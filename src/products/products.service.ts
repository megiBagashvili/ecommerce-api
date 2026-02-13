import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema';
import { SearchProductsDto } from './dto/search-products.dto';
import { S3Service } from './s3.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private s3Service: S3Service,
  ) { }

  async create(productData: any, imageKey: string): Promise<Product> {
    const newProduct = new this.productModel({ ...productData, imageKey });
    return newProduct.save();
  }

  async findAll(query: SearchProductsDto): Promise<Product[]> {
    const { keyword, minPrice, maxPrice } = query;
    const filters: any = {};

    if (keyword) {
      filters.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    return this.productModel.find(filters).exec();
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async update(id: string, updateData: any, imageKey?: string): Promise<Product | null> {
    const data = { ...updateData };
    if (imageKey) {
      data.imageKey = imageKey;
    }
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null || data[key] === '') {
        delete data[key];
      }
    });
    return this.productModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string): Promise<any> {
    const product = await this.productModel.findByIdAndDelete(id);
    if (product && product.imageKey) {
      await this.s3Service.deleteFile(product.imageKey);
    }
    return { message: 'Product deleted successfully' };
  }


}

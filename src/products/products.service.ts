import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async create(productData: any, imageKey: string): Promise<Product> {
    const newProduct = new this.productModel({
      ...productData,
      imageKey,
    });
    return newProduct.save();
  }

  async findAll() {
    return this.productModel.find().exec();
  }
}
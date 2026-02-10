import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchProductsDto {
  @ApiPropertyOptional({ description: 'Search by product name' })
  keyword?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum price' })
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price' })
  maxPrice?: number;
}
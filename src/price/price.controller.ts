import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HourlyPriceDto } from './dto/hourly-price.dto';
import { Price } from './price.entity';
import { PriceService } from './price.service';
@ApiTags('prices')
@Controller('prices')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all saved prices with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results per page' })
  @ApiResponse({ status: 200, description: 'List of prices', type: [Price] })
  async findAll(
    @Query('page') page: number = 1,    // Default to page 1 if not provided
    @Query('limit') limit: number = 10,  // Default to 10 results per page if not provided
  ): Promise<{ data: Price[], total: number }> {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;

    return this.priceService.findAll(parsedPage, parsedLimit);
  }


  @Get('hourly')
  @ApiOperation({ summary: 'Get hourly prices for the last 24 hours' })
  @ApiResponse({
    status: 200,
    description: 'List of hourly prices',
    type: [HourlyPriceDto],
  })
  getHourlyPrices(): Promise<HourlyPriceDto[]> {
    return this.priceService.getHourlyPrices();
  }
}

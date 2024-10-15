import { EvmChain } from '@moralisweb3/common-evm-utils';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import Moralis from 'moralis';
import { Repository } from 'typeorm';
import { HourlyPriceDto } from './dto/hourly-price.dto';
import { Price } from './price.entity';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly moralisApiKey = process.env.MORALIS_API_KEY;
  
  // Define the tokens with their contract addresses and chains
  private readonly tokens = [
    {
      name: 'Ethereum',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',  
      chain: EvmChain.ETHEREUM,
    },
    {
      name: 'Polygon',
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',  
      chain: EvmChain.POLYGON,
    },
  ];

  constructor(
    @InjectRepository(Price)
    private priceRepository: Repository<Price>,
  ) {
    this.initializeMoralis();
  }

  /**
   * Initialize the Moralis SDK with the provided API key.
   */
  async initializeMoralis() {
    try {
      await Moralis.start({
        apiKey: this.moralisApiKey,
      });
      this.logger.log('Moralis initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Moralis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch the USD price of a given token using Moralis SDK.
   * @param token The token object containing name, address, and chain.
   * @returns The USD price of the token.
   */
  async fetchPrice(token: { name: string; address: string; chain: EvmChain }): Promise<number> {
    try {
      const response = await Moralis.EvmApi.token.getTokenPrice({
        address: token.address,
        chain: token.chain,
      });

      const price = response.toJSON().usdPrice;
      if (typeof price !== 'number') {
        throw new Error(`Invalid price data for ${token.name}`);
      }

      return price;
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${token.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save the fetched price to the database.
   * @param blockchain The name of the blockchain (e.g., Ethereum, Polygon).
   * @param price The USD price of the token.
   * @returns The saved Price entity.
   */
  async savePrice(blockchain: string, price: number): Promise<Price> {
    const priceEntity = this.priceRepository.create({
      blockchain,
      price,
    });
    return this.priceRepository.save(priceEntity);
  }

  /**
   * Cron job that runs every 5 minutes to fetch and save token prices.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug('Fetching prices for Ethereum and Polygon');

    for (const token of this.tokens) {
      try {
        const price = await this.fetchPrice(token);
        await this.savePrice(token.name, price);
        this.logger.log(`Saved price for ${token.name}: $${price}`);
      } catch (error) {
        this.logger.error(`Error fetching/saving price for ${token.name}: ${error.message}`);
      }
    }
  }

  /**
   * Retrieve all saved prices from the database.
   * @returns An array of Price entities.
   */
  async findAll(page: number, limit: number): Promise<{ data: Price[], total: number }> {
    const [data, total] = await this.priceRepository.findAndCount({
      order: {
        timestamp: 'DESC' as any,  
      },
      skip: (page - 1) * limit,  
      take: limit, 
    });

    return {
      data,
      total,  
    };
  }
  /**
 * Retrieves the latest price for each hour within the last 24 hours.
 * @returns An array of HourlyPriceDto objects.
 */
async getHourlyPrices(): Promise<HourlyPriceDto[]> {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const hourlyPrices = await this.priceRepository
    .createQueryBuilder('price')
    .select([
      "DATE_TRUNC('hour', price.timestamp) AS hour",
      'price.price AS price',
    ])
    .where('price.timestamp >= :twentyFourHoursAgo', { twentyFourHoursAgo })
    .orderBy('hour', 'DESC')
    .addOrderBy('price.timestamp', 'DESC')
    .distinctOn(['hour'])
    .getRawMany();

  // Map the raw results to HourlyPriceDto
  return hourlyPrices.map((record) => ({
    timestamp: new Date(record.hour),
    price: parseFloat(record.price),
  }));
}
 
}

import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Price } from '../price/price.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly recipientEmail: string;
  private readonly priceIncreaseThreshold: number;

  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.recipientEmail = this.configService.get<string>('NOTIFICATION_RECIPIENT_EMAIL');
    if (!this.recipientEmail) {
      this.logger.error('NOTIFICATION_RECIPIENT_EMAIL is not defined in environment variables.');
      throw new Error('NOTIFICATION_RECIPIENT_EMAIL is required.');
    }
    this.priceIncreaseThreshold = parseFloat(
      this.configService.get<string>('PRICE_INCREASE_THRESHOLD') || '3',
    );
  }

  /**
   * Cron job that runs every 5 minutes to check for price increases.
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async checkPriceIncrease() {
    this.logger.debug('Checking for price increases over 3%');

    const chains = ['ethereum', 'polygon']; // Add more chains if needed

    for (const chain of chains) {
      try {
        // Fetch the latest price
        const latestPrice = await this.priceRepository.findOne({
          where: { blockchain: chain },
          order: { timestamp: 'DESC' },
        });

        if (!latestPrice) {
          this.logger.warn(`No latest price found for ${chain}`);
          continue;
        }

        // Calculate the timestamp for one hour ago
        const oneHourAgo = new Date(latestPrice.timestamp);
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // Fetch the price from one hour ago
        const priceOneHourAgo = await this.priceRepository.findOne({
          where: { 
            blockchain: chain,
            timestamp: LessThanOrEqual(oneHourAgo),
          },
          order: { timestamp: 'DESC' },
        });

        if (!priceOneHourAgo) {
          this.logger.warn(`No price found for ${chain} one hour ago`);
          continue;
        }

        // Calculate the percentage increase
        const oldPrice = parseFloat(priceOneHourAgo.price.toString());
        const newPrice = parseFloat(latestPrice.price.toString());

        const priceIncrease = ((newPrice - oldPrice) / oldPrice) * 100;

        this.logger.debug(`${chain} price increase: ${priceIncrease.toFixed(2)}%`);

        // If price increased by more than 3%, send an email
        if (priceIncrease > this.priceIncreaseThreshold) {
          await this.sendPriceIncreaseEmail(chain, newPrice, oldPrice, priceIncrease);
        }
      } catch (error) {
        this.logger.error(`Error checking price increase for ${chain}: ${error.message}`);
      }
    }
  }

  /**
   * Sends an email notification about the price increase.
   * @param chain - The blockchain chain name.
   * @param newPrice - The current price.
   * @param oldPrice - The price one hour ago.
   * @param increase - The percentage increase.
   */
  private async sendPriceIncreaseEmail(chain: string, newPrice: number, oldPrice: number, increase: number) {
    // const recipient = 'hyperhire_assignment@hyperhire.in';

    const subject = `Price Alert: ${chain} Price Increased by ${increase.toFixed(2)}%`;

    const text = `Hello,\n\nThe price of ${chain} has increased by ${increase.toFixed(2)}% in the last hour.\nPrevious Price: $${oldPrice.toFixed(2)}\nCurrent Price: $${newPrice.toFixed(2)}\n\nBest regards,\nBlockchain Price Tracker`;

    try {
      await this.mailerService.sendMail({
        to: this.recipientEmail,
        subject: subject,
        text: text,
      });
      this.logger.debug(`Price increase email sent to ${ this.recipientEmail} for ${chain}`);
    } catch (error) {
      this.logger.error(`Failed to send price increase email to ${ this.recipientEmail} for ${chain}: ${error.message}`);
    }
  }
}

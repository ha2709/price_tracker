import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Price } from '../price/price.entity';
import { Alert } from './alert.entity';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly mailerService: MailerService,
  ) {}

  // Create a new alert
  async createAlert(chain: string, targetPrice: number, email: string): Promise<Alert> {
    const alert = this.alertRepository.create({ chain, targetPrice, email });
    return this.alertRepository.save(alert);
  }

 

  // Cron job to check alerts every 5 minutes
  @Cron('*/5 * * * *')
  async handleCron() {
    this.logger.debug('Checking alerts...');

    // Fetch the latest price for each chain
    const chains = ['ethereum', 'polygon'];
    for (const chain of chains) {
      const latestPrice = await this.priceRepository.findOne({
        where: { blockchain: chain },
        order: { timestamp: 'DESC' },
      });

      if (latestPrice) {
        // Find alerts that are not yet triggered and targetPrice <= latestPrice
        const alerts = await this.alertRepository.find({
          where: {
            chain,
            targetPrice: LessThanOrEqual(latestPrice.price),
            triggered: false,
          },
        });

        for (const alert of alerts) {
          // Send email
          await this.sendAlertEmail(alert, latestPrice.price);

          // Mark the alert as triggered
          alert.triggered = true;
          await this.alertRepository.save(alert);
        }
      }
    }
  }

  // Send alert email
  private async sendAlertEmail(alert: Alert, currentPrice: number) {
    try {
      await this.mailerService.sendMail({
        to: alert.email,
        subject: `Price Alert: ${alert.chain} reached $${alert.targetPrice}`,
        text: `Hello,\n\nThe price of ${alert.chain} has reached $${currentPrice}, which meets your alert target of $${alert.targetPrice}.\n\nBest regards,\nBlockchain Price Tracker`,
      });
      this.logger.debug(`Alert email sent to ${alert.email} for ${alert.chain} at $${alert.targetPrice}`);
    } catch (error) {
      this.logger.error(`Failed to send alert email to ${alert.email}`, error.stack);
    }
  }
}

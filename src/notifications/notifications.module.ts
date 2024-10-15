import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Price } from '../price/price.entity';
import { NotificationService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Price]), // Register the Price entity
    MailerModule, // Import MailerModule to make MailerService available
  ],
  providers: [NotificationService],
})
export class NotificationsModule {}

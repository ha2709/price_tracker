import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { Price } from '../price/price.entity';
import { AlertController } from './alert.controller';
import { Alert } from './alert.entity';
import { AlertService } from './alert.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, Price]),
    MailModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService], 
})
export class AlertsModule {}

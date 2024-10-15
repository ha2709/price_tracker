import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceController } from './price.controller';
import { Price } from './price.entity';
import { PriceService } from './price.service';
@Module({
  imports: [TypeOrmModule.forFeature([Price])],
  providers: [PriceService],
  controllers: [PriceController],
})
export class PriceModule {}

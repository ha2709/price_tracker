import { ApiProperty } from '@nestjs/swagger';

export class HourlyPriceDto {
  @ApiProperty({ example: '2024-10-15T07:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: 3000.12345678 })
  price: number;
}

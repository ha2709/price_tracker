import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty({
    description: 'The blockchain chain name (e.g., ethereum, polygon)',
    example: 'ethereum',
  })
  @IsString()
  @IsNotEmpty()
  chain: string;

  @ApiProperty({
    description: 'The target price in USD to trigger the alert',
    example: 3500.00,
  })
  @IsNumber()
  targetPrice: number;

  @ApiProperty({
    description: 'The email address to send the alert to',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}

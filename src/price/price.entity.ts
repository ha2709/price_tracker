import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Price {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Ethereum' })
  @Column()
  blockchain: string;

  @ApiProperty({ example: 3000.12345678 })
  @Column('decimal', { precision: 18, scale: 8 })
  price: number;

  @ApiProperty({ example: '2024-10-14T12:34:56.789Z' })
  @CreateDateColumn()
  @Index()
  timestamp: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Alert {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Ethereum' })
  @Column()
  chain: string; // Corresponds to `blockchain` in Price entity

  @ApiProperty({ example: 3500.00 })
  @Column('decimal', { precision: 18, scale: 8 })
  targetPrice: number;

  @ApiProperty({ example: 'user@example.com' })
  @Column()
  email: string;

  @ApiProperty({ example: '2024-10-15T10:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: false })
  @Column({ default: false })
  triggered: boolean;
}

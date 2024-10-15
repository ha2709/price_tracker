// src/price/price.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Price } from './price.entity';
import { PriceService } from './price.service';

// Mock Moralis
jest.mock('moralis'); // This tells Jest to use the manual mock


describe('PriceService', () => {
  let service: PriceService;
  let repository: Repository<Price>;

  // Sample data to be returned by the mocked repository
  const mockPrices: Price[] = [
    {
      id: 1,
      blockchain: 'ethereum',
      price: 3000.12345678,
      timestamp: new Date('2024-10-15T10:00:00.000Z'),
    },
    {
      id: 2,
      blockchain: 'ethereum',
      price: 3050.65432100,
      timestamp: new Date('2024-10-15T09:00:00.000Z'),
    },
    // ... add more entries as needed
  ];

  const mockFindAndCount = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceService,
        {
          provide: getRepositoryToken(Price),
          useValue: {
            findAndCount: mockFindAndCount,
          },
        },
      ],
    }).compile();

    service = module.get<PriceService>(PriceService);
    repository = module.get<Repository<Price>>(getRepositoryToken(Price));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated prices and total count', async () => {
      const page = 1;
      const limit = 10;
      const expectedSkip = (page - 1) * limit;
      const expectedTake = limit;

      // Mock the repository's findAndCount method
      mockFindAndCount.mockResolvedValue([mockPrices, mockPrices.length]);

      const result = await service.findAll(page, limit);

      // Assertions
      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: {
          timestamp: 'DESC',
        },
        skip: expectedSkip,
        take: expectedTake,
      });

      expect(result).toEqual({
        data: mockPrices,
        total: mockPrices.length,
      });
    });

    it('should handle empty data sets', async () => {
      const page = 2;
      const limit = 5;

      // Mock the repository's findAndCount method to return empty data
      mockFindAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(page, limit);

      // Assertions
      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: {
          timestamp: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      expect(result).toEqual({
        data: [],
        total: 0,
      });
    });
  });
});

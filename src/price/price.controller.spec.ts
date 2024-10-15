// src/price/price.controller.spec.ts

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { HourlyPriceDto } from './dto/hourly-price.dto';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';

describe('PriceController (Integration Test)', () => {
  let app: INestApplication;
  let priceService: PriceService;

  // Sample data to be returned by the mocked service
  const mockHourlyPrices: HourlyPriceDto[] = [
    { timestamp: new Date('2024-10-15T10:00:00.000Z'), price: 1000.12345678 },
    { timestamp: new Date('2024-10-15T11:00:00.000Z'), price: 1010.65432100 },
    // ... add up to 24 entries as needed
  ];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PriceController],
      providers: [
        {
          provide: PriceService,
          useValue: {
            // Mock the getHourlyPrices method
            getHourlyPrices: jest.fn().mockResolvedValue(mockHourlyPrices),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    priceService = moduleRef.get<PriceService>(PriceService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should return hourly prices within the past 24 hours for a specific chain', async () => {
    const chain = 'ethereum';

    const response = await request(app.getHttpServer())
      .get('/prices/hourly')
      .query({ chain }) // Pass the 'chain' query parameter
      .expect(200);

    // Convert mockHourlyPrices to match JSON response (Date -> ISO string)
    const expectedResponse = mockHourlyPrices.map(dto => ({
      timestamp: dto.timestamp.toISOString(),
      price: dto.price,
    }));

    expect(response.body).toEqual(expectedResponse);
    expect(priceService.getHourlyPrices).toHaveBeenCalledWith(chain);
    expect(priceService.getHourlyPrices).toHaveBeenCalledTimes(1);
  });

  it('should default to ethereum if chain is not specified', async () => {
    const defaultChain = 'ethereum';

    const response = await request(app.getHttpServer())
      .get('/prices/hourly')
      .expect(200);

    // Convert mockHourlyPrices to match JSON response (Date -> ISO string)
    const expectedResponse = mockHourlyPrices.map(dto => ({
      timestamp: dto.timestamp.toISOString(),
      price: dto.price,
    }));

    expect(response.body).toEqual(expectedResponse);
    expect(priceService.getHourlyPrices).toHaveBeenCalledWith(defaultChain);
    expect(priceService.getHourlyPrices).toHaveBeenCalledTimes(1);
  });
});

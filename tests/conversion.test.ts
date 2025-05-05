import request from 'supertest';
import app from '../src/app';
import axios from 'axios';
import * as prismaModule from '../src/lib/prisma';
import * as cacheModule from '../src/lib/cache';

// Types for conversion result
interface ConversionResult {
  id: number;
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: Date;
}

// Types for exchange rates
interface ExchangeRates {
  [currency: string]: string | undefined;
}

// Mock modules before importing/requiring them
jest.mock('axios');
jest.mock('../src/lib/prisma', () => ({
  conversion: {
    create: jest.fn(),
  },
}));

jest.mock('../src/lib/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  stats: jest.fn(() => ({ size: 0, itemCount: 0 })),
}));

// Use imported modules with proper typing
const prisma = prismaModule as unknown as {
  conversion: { create: jest.Mock };
};

const cache = cacheModule as unknown as {
  get: jest.Mock;
  set: jest.Mock;
  has: jest.Mock;
  delete: jest.Mock;
  clear: jest.Mock;
  stats: jest.Mock;
};

// Type the mocked axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Currency Conversion API', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock cache miss (to force API call)
    (cache.get as jest.Mock).mockReturnValue(undefined);

    // Mock successful Coinbase API response
    // @ts-expect-error - Axios typing with mocks is complex
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: {
          data: {
            rates: {
              USD: '1.0',
              EUR: '0.9234',
              BTC: '0.000015',
              ETH: '0.0003',
              INVALID: undefined, // For testing invalid currency code
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'https://api.coinbase.com/v2/exchange-rates' },
      });
    });
  });

  describe('GET /api/convert', () => {
    it('should convert currency successfully', async () => {
      // Mock successful conversion
      (prisma.conversion.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        userId: 'test-user-id',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        amount: 100,
        result: 92.34,
        rate: 0.9234,
        timestamp: new Date(),
      } as ConversionResult);

      const response = await request(app)
        .get('/api/convert?from=USD&to=EUR&amount=100')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('from', 'USD');
      expect(response.body).toHaveProperty('to', 'EUR');
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('result', 92.34);
      expect(response.body).toHaveProperty('rate', 0.9234);

      // Verify Prisma was called correctly
      expect(prisma.conversion.create).toHaveBeenCalledTimes(1);
      expect(prisma.conversion.create).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-id',
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          amount: 100,
          result: 92.34,
          rate: 0.9234,
        },
      });

      // Verify cache operations
      expect(cache.get).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should use cached exchange rates when available', async () => {
      // Mock cache hit
      (cache.get as jest.Mock).mockReturnValue({
        USD: '1.0',
        EUR: '0.9234',
        BTC: '0.000015',
        ETH: '0.0003',
      } as ExchangeRates);

      // Mock successful conversion
      (prisma.conversion.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        userId: 'test-user-id',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        amount: 100,
        result: 92.34,
        rate: 0.9234,
        timestamp: new Date(),
      } as ConversionResult);

      const response = await request(app)
        .get('/api/convert?from=USD&to=EUR&amount=100')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(200);

      // Verify cache was used and API was not called
      expect(cache.get).toHaveBeenCalled();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app).get(
        '/api/convert?from=USD&to=EUR&amount=100',
      );

      expect(response.status).toBe(401);
      expect(prisma.conversion.create).not.toHaveBeenCalled();
    });

    it('should return 400 with missing parameters', async () => {
      const response = await request(app)
        .get('/api/convert?from=USD&to=EUR')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(prisma.conversion.create).not.toHaveBeenCalled();
    });

    it('should return 400 with invalid parameter type', async () => {
      const response = await request(app)
        .get('/api/convert?from=USD&to=EUR&amount=invalid')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(prisma.conversion.create).not.toHaveBeenCalled();
    });

    it('should return 400 with too short currency code', async () => {
      const response = await request(app)
        .get('/api/convert?from=US&to=EUR&amount=100')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(prisma.conversion.create).not.toHaveBeenCalled();
    });

    it('should return 400 for unsupported currency code', async () => {
      // Using a valid format but unsupported currency code
      const response = await request(app)
        .get('/api/convert?from=XYZ&to=EUR&amount=100')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(prisma.conversion.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      (prisma.conversion.create as jest.Mock).mockRejectedValueOnce(
        new Error('Database error'),
      );

      const response = await request(app)
        .get('/api/convert?from=USD&to=EUR&amount=100')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Database error');
    });

    it('should handle Coinbase API errors gracefully', async () => {
      // Mock Coinbase API error
      mockedAxios.get.mockRejectedValueOnce(new Error('Coinbase API error'));

      const response = await request(app)
        .get('/api/convert?from=USD&to=EUR&amount=100')
        .set('Authorization', 'Bearer test-user-id');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe(
        'Failed to fetch exchange rates',
      );
    });
  });
});

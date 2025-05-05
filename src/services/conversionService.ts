import axios from 'axios';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import cache from '../lib/cache';
import { SUPPORTED_CURRENCIES } from '../lib/validation';

// Cache key for exchange rates
const EXCHANGE_RATES_CACHE_KEY = 'exchange_rates';
// Cache TTL (5 minutes)
const EXCHANGE_RATES_CACHE_TTL = 5 * 60 * 1000;

/**
 * Interface for exchange rates
 */
interface ExchangeRates {
  [currency: string]: string;
}

/**
 * Interface for API response structure
 */
interface ExchangeRateApiResponse {
  data: {
    data: {
      rates: ExchangeRates;
    };
  };
}

/**
 * Interface for conversion result
 */
interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}

/**
 * Service responsible for currency conversion operations
 * Handles exchange rate retrieval, caching, and conversion calculations
 */
class ConversionService {
  private apiUrl: string;

  /**
   * Initialize the conversion service
   * Sets up the API URL from environment variables or uses default
   */
  constructor() {
    this.apiUrl = process.env.COINBASE_API_URL || 'https://api.coinbase.com/v2';
  }

  /**
   * Retrieves current exchange rates
   * First checks the cache, then falls back to the external API if needed
   *
   * @async
   * @returns {Promise<ExchangeRates>} Object with currency codes as keys and exchange rates as values
   * @throws {Error} If exchange rates cannot be fetched
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    try {
      // Check if rates are in cache
      const cachedRates = cache.get(EXCHANGE_RATES_CACHE_KEY) as
        | ExchangeRates
        | undefined;
      if (cachedRates) {
        logger.debug('Using cached exchange rates');
        return cachedRates;
      }

      // If not in cache, fetch from API
      logger.info('Fetching fresh exchange rates from API');
      const response = await axios.get<ExchangeRateApiResponse['data']>(
        `${this.apiUrl}/exchange-rates`,
      );
      const rates = response.data.data.rates;

      // Filter to only include supported currencies
      const filteredRates: ExchangeRates = {};
      SUPPORTED_CURRENCIES.forEach((currency) => {
        if (rates[currency]) {
          filteredRates[currency] = rates[currency];
        } else {
          logger.warn(
            `Exchange rate for supported currency ${currency} not found in API response`,
          );
        }
      });

      // Store in cache
      cache.set(EXCHANGE_RATES_CACHE_KEY, filteredRates, {
        ttl: EXCHANGE_RATES_CACHE_TTL,
      });

      return filteredRates;
    } catch (error) {
      logger.error('Error fetching exchange rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  /**
   * Converts an amount from one currency to another
   *
   * @async
   * @param {string} from - Source currency code (e.g., 'USD', 'BTC')
   * @param {string} to - Target currency code (e.g., 'EUR', 'ETH')
   * @param {number} amount - Amount to convert in the source currency
   * @param {string} userId - ID of the user performing the conversion
   * @returns {Promise<ConversionResult>} Conversion result containing source, target, amount, result and rate
   * @throws {Error} If currency codes are invalid or conversion fails
   */
  async convertCurrency(
    from: string,
    to: string,
    amount: number,
    userId: string,
  ): Promise<ConversionResult> {
    try {
      // Validate that currencies are supported
      if (
        !SUPPORTED_CURRENCIES.includes(from) ||
        !SUPPORTED_CURRENCIES.includes(to)
      ) {
        throw new Error('Invalid currency code');
      }

      const rates = await this.getExchangeRates();

      if (!rates[from] || !rates[to]) {
        throw new Error(
          'Exchange rate not available for the selected currency',
        );
      }

      const fromRate = parseFloat(rates[from]);
      const toRate = parseFloat(rates[to]);

      if (isNaN(fromRate) || isNaN(toRate)) {
        throw new Error('Invalid exchange rate');
      }

      const result = (amount * toRate) / fromRate;
      const rate = toRate / fromRate;

      // Store the conversion in the database
      await prisma.conversion.create({
        data: {
          userId,
          fromCurrency: from,
          toCurrency: to,
          amount,
          result,
          rate,
        },
      });

      logger.info(
        `Currency conversion completed: ${amount} ${from} to ${result.toFixed(2)} ${to}`,
      );

      return {
        from,
        to,
        amount,
        result,
        rate,
      };
    } catch (error) {
      logger.error('Error converting currency:', error);
      throw error;
    }
  }
}

export default new ConversionService();

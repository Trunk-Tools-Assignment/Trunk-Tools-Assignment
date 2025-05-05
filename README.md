# Currency Conversion Service

A TypeScript and Express-based currency conversion service that supports both FIAT and cryptocurrencies. The service uses the Coinbase API for real-time exchange rates and implements rate limiting based on workdays and weekends.

## Features

- Real-time currency conversion between FIAT and cryptocurrencies
- Support for USD, EUR, BTC, ETH and many more currencies
- User-specific rate limiting (100 requests per workday, 200 per weekend day)
- Request logging and history storage using SQLite and Prisma ORM
- Authentication via user ID in Authorization header
- Comprehensive error handling
- Input validation with Zod
- In-memory caching to reduce API calls
- Structured logging with Winston
- Full TypeScript support with strong typing
- API documentation with OpenAPI/Swagger UI at /api-docs
- Docker support for containerized deployment

## Technical Architecture

### Core Technologies

- **TypeScript** - Typed JavaScript superset
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Prisma** - ORM for database operations
- **SQLite** - Lightweight database
- **Zod** - Schema validation
- **Winston** - Logging
- **Jest** - Testing framework
- **LRU Cache** - Efficient memory caching
- **Swagger** - API documentation
- **Docker** - Containerization

### Project Structure

```
src/
├── controllers/      # Request handlers
├── lib/              # Shared utilities
├── middleware/       # Express middleware
├── routes/           # API routes
├── services/         # Business logic
├── app.ts            # Express application setup
└── server.ts         # Application entry point

prisma/               # Prisma ORM configuration
tests/                # Test files
```

### Key Components

1. **Validation Layer**

   - Uses Zod for schema validation
   - Validates query parameters and authentication tokens
   - Provides clear error messages

2. **Rate Limiting**

   - User-specific rate limits
   - Different limits for weekdays and weekends
   - Based on express-rate-limit

3. **Caching Layer**

   - In-memory cache using LRU Cache for efficient memory management
   - Direct use of the LRUCache instance for better type safety and performance
   - 5-minute TTL to balance freshness and performance
   - Reduces load on external API

4. **Logging System**

   - Structured logging with Winston
   - Different log levels for various events
   - Console and file transports

5. **Data Persistence**

   - Prisma ORM for type-safe database operations
   - SQLite database for storing conversion history
   - Proper database indexing for performance

6. **API Documentation**
   - Interactive OpenAPI/Swagger documentation
   - Available at /api-docs endpoint
   - Detailed request/response schemas and examples
   - Authentication information included

## API Reference

### Convert Currency

```
GET /api/convert
```

**Parameters:**

- `from` - Source currency code (e.g., USD, BTC)
- `to` - Target currency code (e.g., EUR, ETH)
- `amount` - Amount to convert

**Headers:**

```
Authorization: Bearer <user-id>
```

**Response:**

```json
{
  "from": "USD",
  "to": "EUR",
  "amount": 100,
  "result": 92.34,
  "rate": 0.9234
}
```

**Error Responses:**

- 400: Bad Request (missing or invalid parameters)
- 401: Unauthorized (missing or invalid user ID)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Running the Application

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Using Docker

Build and run the Docker container:

```bash
# Build the Docker image
docker build -t currency-conversion-service .

# Run the container
docker run -p 3000:3000 currency-conversion-service
```

Using Docker Compose:

```bash
docker-compose up
```

### Building the Application

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Running Linting

```bash
npm run lint
```

### API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Performance Considerations

- **Caching**: Exchange rates are cached for 5 minutes to reduce API calls
- **Database Indexing**: Key fields are indexed for faster queries
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Validation**: Early validation prevents unnecessary processing
- **Type Safety**: TypeScript provides compile-time checks to prevent runtime errors

## Future Improvements

- **External Cache**: Move the in-memory cache to an external resource like Redis for better scalability and persistence across service restarts

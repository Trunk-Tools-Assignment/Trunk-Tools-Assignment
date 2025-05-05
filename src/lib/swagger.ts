import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Basic configuration for Swagger
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Currency Conversion API',
      version: '1.0.0',
      description:
        'API for converting currencies using real-time exchange rates',
      contact: {
        name: 'API Support',
        url: 'https://example.com/support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your user ID as the bearer token',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing annotations for the OpenAPI Specification
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

// Generate the Swagger specification
const swaggerSpec = swaggerJSDoc(options);

// Function to setup Swagger in the Express app
export const setupSwagger = (app: Express): void => {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
    }),
  );

  // Serve Swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger documentation available at /api-docs');
};

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import config from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Site Access Management System API',
      version: '1.0.0',
      description: 'API documentation for Site Access Management System used by security guards to control site access',
      contact: {
        name: 'API Support',
        email: config.company.adminEmail,
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'security_guard', 'receptionist', 'visitor'] },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
            employeeId: { type: 'string' },
            department: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Visitor: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            idNumber: { type: 'string' },
            company: { type: 'string' },
            vehicleNumber: { type: 'string' },
            hostEmployee: { type: 'string' },
            hostDepartment: { type: 'string' },
            visitPurpose: { 
              type: 'string',
              enum: ['meeting', 'delivery', 'pig_delivery', 'maintenance', 'contract_works', 'interview', 'pig_order', 'shop', 'payment_collection', 'other']
            },
            expectedDate: { type: 'string', format: 'date' },
            expectedTime: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['pending', 'approved', 'rejected', 'checked_in', 'checked_out', 'expired']
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AccessLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            visitorId: { type: 'string' },
            employeeId: { type: 'string' },
            guardId: { type: 'string' },
            action: { type: 'string', enum: ['check_in', 'check_out', 'access_granted', 'access_denied'] },
            location: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            error: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Site Access Management API',
  }));
};

export default specs;
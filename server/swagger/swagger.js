const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UPS One Logistics Experience API',
      version: '1.0.0',
      description:
        'Central backend API for the UPS One Logistics Experience platform.\n\n' +
        'Supports: customer authentication, shipment management, draft shipments, ' +
        'real-time tracking, vehicle availability, ML-powered recommendations, ' +
        'AI chat (LLM-ready), and admin operations.\n\n' +
        'All requests must use the `Authorization: Bearer <token>` header unless noted as public.',
      contact: { name: 'UPS Logistics Team' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtained from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Shipment not found' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['customer', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PackageDetail: {
          type: 'object',
          properties: {
            weight: { type: 'number', example: 5 },
            height: { type: 'number', example: 15 },
            width: { type: 'number', example: 20 },
            length: { type: 'number', example: 30 },
            packageType: { type: 'string', enum: ['document', 'parcel', 'fragile', 'electronics', 'other'] },
            fragile: { type: 'boolean', example: false },
          },
        },
        ShipmentEvent: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'In Transit' },
            location: { type: 'string', example: 'Bangalore' },
            description: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Shipment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            trackingNumber: { type: 'string', example: 'UPS123456789' },
            from: { type: 'string', example: 'Chennai' },
            to: { type: 'string', example: 'Mumbai' },
            deliveryOption: { type: 'string', enum: ['Economy', 'Normal', 'Express'] },
            transportMode: { type: 'string', enum: ['Road', 'Rail', 'Air'] },
            cost: { type: 'number', example: 820 },
            estimatedTime: { type: 'number', example: 24, description: 'Hours' },
            status: { type: 'string', enum: ['draft', 'booked', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'] },
            lastChannel: { type: 'string', enum: ['web', 'mobile'] },
            packageId: { $ref: '#/components/schemas/PackageDetail' },
            events: { type: 'array', items: { $ref: '#/components/schemas/ShipmentEvent' } },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            vehicleNumber: { type: 'string', example: 'TN01AB1234' },
            type: { type: 'string', enum: ['Truck', 'Van', 'Rail', 'Aircraft'] },
            location: { type: 'string', example: 'Chennai' },
            capacityKg: { type: 'number', example: 1000 },
            status: { type: 'string', enum: ['available', 'in_transit', 'maintenance', 'unavailable'] },
          },
        },
        Message: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['user', 'assistant', 'tool'] },
            content: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            channel: { type: 'string', enum: ['web', 'mobile'] },
            title: { type: 'string' },
            messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
          },
        },
        RecommendationResponse: {
          type: 'object',
          properties: {
            recommendedMode: { type: 'string', example: 'Air' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  mode: { type: 'string' },
                  cost: { type: 'number' },
                  time: { type: 'number', description: 'Hours' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication and user profile' },
      { name: 'Shipments', description: 'Shipment CRUD and draft management' },
      { name: 'Tracking', description: 'Public shipment tracking' },
      { name: 'Vehicles', description: 'Vehicle availability' },
      { name: 'Recommendation', description: 'ML-powered shipping recommendations' },
      { name: 'Chat', description: 'AI chat assistant and conversation history' },
      { name: 'Admin', description: 'Admin-only operations' },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };

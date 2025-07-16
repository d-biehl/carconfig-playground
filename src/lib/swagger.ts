import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.1.1',
    info: {
      title: 'CarConfigurator API',
      version: '1.0.0',
      description: 'Comprehensive car configuration API with internationalization, user management, and admin features. Fully compliant with OpenAPI 3.1.1 specification for Robot Framework training and automation testing.',
      contact: {
        name: 'CarConfigurator Team',
        email: 'support@carconfigurator.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://carconfigurator.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      schemas: {
        Car: {
          type: 'object',
          required: ['id', 'name', 'category', 'basePrice', 'description'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique car identifier'
            },
            name: {
              type: 'string',
              description: 'Car model name',
              examples: ['BMW X5', 'Audi Q7', 'Mercedes GLE']
            },
            category: {
              type: 'string',
              description: 'Car category',
              examples: ['SUV', 'Sedan', 'Coupe']
            },
            basePrice: {
              type: 'number',
              format: 'float',
              description: 'Base price in Euro',
              examples: [45000.00, 52000.00, 68000.00]
            },
            description: {
              type: 'string',
              description: 'Car description',
              examples: ['Luxury SUV with latest technology', 'Premium sedan with hybrid drive']
            },
            imageUrl: {
              type: ['string', 'null'],
              description: 'Car image URL (can be relative or absolute)',
              examples: ['/images/cars/elegance-sedan.jpg', 'https://example.com/car.jpg']
            },
            imageData: {
              type: ['string', 'null'],
              description: 'Base64 encoded image data'
            },
            imageMimeType: {
              type: ['string', 'null'],
              description: 'Image MIME type',
              examples: ['image/jpeg', 'image/png', 'image/webp']
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Option: {
          type: 'object',
          required: ['id', 'name', 'category', 'price'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique option identifier'
            },
            name: {
              type: 'string',
              description: 'Option name',
              examples: ['Lederausstattung', 'Sportmotor', 'Panorama-Schiebedach']
            },
            category: {
              type: 'string',
              description: 'Option category',
              examples: ['Innenausstattung', 'Motor', 'Lackierung', 'Felgen']
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Option price in Euro',
              examples: [2500.00, 5000.00, 1200.00]
            },
            description: {
              type: ['string', 'null'],
              description: 'Short option description'
            },
            detailedDescription: {
              type: ['string', 'null'],
              description: 'Detailed option description'
            },
            imageUrl: {
              type: ['string', 'null'],
              description: 'Option image URL (can be relative or absolute)',
              examples: ['/images/options/sport-package.jpg', 'https://example.com/option.jpg']
            },
            imageData: {
              type: ['string', 'null'],
              description: 'Base64 encoded image data'
            },
            imageMimeType: {
              type: ['string', 'null'],
              description: 'Image MIME type'
            },
            exclusiveGroup: {
              type: ['string', 'null'],
              description: 'Exclusive group - options in the same group are mutually exclusive'
            },
            isRequired: {
              type: 'boolean',
              description: 'Indicates whether the option is required',
              default: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        User: {
          type: 'object',
          required: ['id', 'email', 'name', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              minLength: 5,
              description: 'User email address'
            },
            name: {
              type: 'string',
              minLength: 1,
              description: 'User name'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Configuration: {
          type: 'object',
          required: ['id', 'name', 'totalPrice', 'userId', 'carId'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique configuration identifier'
            },
            name: {
              type: 'string',
              description: 'Configuration name',
              examples: ['Meine Traumkonfiguration', 'Sport-Edition', 'Comfort-Paket']
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              description: 'Total configuration price in Euro'
            },
            userId: {
              type: 'string',
              description: 'ID of the user who created the configuration'
            },
            carId: {
              type: 'string',
              description: 'ID of the configured car'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            car: {
              $ref: '#/components/schemas/Car'
            },
            options: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ConfigurationOption'
              }
            }
          }
        },
        ConfigurationOption: {
          type: 'object',
          required: ['configurationId', 'optionId', 'option'],
          properties: {
            configurationId: {
              type: 'string',
              description: 'ID of the configuration'
            },
            optionId: {
              type: 'string',
              description: 'ID of the option'
            },
            option: {
              $ref: '#/components/schemas/Option'
            }
          }
        },
        CreateCarRequest: {
          type: 'object',
          required: ['name', 'category', 'basePrice', 'description'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'Car model name'
            },
            category: {
              type: 'string',
              minLength: 1,
              description: 'Kategorie des Autos'
            },
            basePrice: {
              type: 'number',
              format: 'float',
              minimum: 0.01,
              description: 'Base price in Euro'
            },
            description: {
              type: 'string',
              minLength: 1,
              description: 'Car description'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Car image URL'
            },
            imageData: {
              type: 'string',
              description: 'Base64-kodierte Bilddaten'
            },
            imageMimeType: {
              type: 'string',
              description: 'Image MIME type'
            },
            translations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  locale: { type: 'string', minLength: 2, examples: ['de', 'en'] },
                  name: { type: 'string', minLength: 1 },
                  category: { type: 'string', minLength: 1 },
                  description: { type: 'string', minLength: 1 }
                }
              }
            }
          }
        },
        UpdateCarRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'Car model name'
            },
            category: {
              type: 'string',
              minLength: 1,
              description: 'Car category'
            },
            basePrice: {
              type: 'number',
              format: 'float',
              minimum: 0.01,
              description: 'Base price in Euro'
            },
            description: {
              type: 'string',
              minLength: 1,
              description: 'Car description'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Car image URL'
            },
            imageData: {
              type: 'string',
              description: 'Base64 encoded image data'
            },
            imageMimeType: {
              type: 'string',
              description: 'Image MIME type'
            },
            translations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  locale: { type: 'string', minLength: 2, examples: ['de', 'en'] },
                  name: { type: 'string', minLength: 1 },
                  category: { type: 'string', minLength: 1 },
                  description: { type: 'string', minLength: 1 }
                }
              }
            }
          }
        },
        CreateOptionRequest: {
          type: 'object',
          required: ['name', 'category', 'price'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'Option name'
            },
            category: {
              type: 'string',
              minLength: 1,
              description: 'Option category'
            },
            price: {
              type: 'number',
              format: 'float',
              minimum: 0.01,
              description: 'Option price in Euro'
            },
            description: {
              type: 'string',
              minLength: 1,
              description: 'Short option description'
            },
            detailedDescription: {
              type: 'string',
              minLength: 1,
              description: 'Detailed option description'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Option image URL'
            },
            imageData: {
              type: 'string',
              description: 'Base64-kodierte Bilddaten'
            },
            imageMimeType: {
              type: 'string',
              description: 'Image MIME type'
            },
            exclusiveGroup: {
              type: 'string',
              description: 'Exklusivgruppe'
            },
            isRequired: {
              type: 'boolean',
              description: 'Indicates whether the option is required'
            },
            translations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  locale: { type: 'string', minLength: 2, examples: ['de', 'en'] },
                  name: { type: 'string', minLength: 1 },
                  category: { type: 'string', minLength: 1 },
                  description: { type: 'string', minLength: 1 },
                  detailedDescription: { type: 'string', minLength: 1 }
                }
              }
            }
          }
        },
        CreateConfigurationRequest: {
          type: 'object',
          required: ['name', 'carId', 'userId', 'selectedOptions'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'Configuration name'
            },
            carId: {
              type: 'string',
              description: 'ID of the configured car'
            },
            userId: {
              type: 'string',
              description: 'ID des Benutzers'
            },
            selectedOptions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array der ausgewählten Options-IDs'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address for admin login',
              minLength: 5
            },
            password: {
              type: 'string',
              description: 'Password for admin login',
              minLength: 1
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address for registration',
              minLength: 5
            },
            name: {
              type: 'string',
              description: 'Name of the new user',
              minLength: 1
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Password (minimum 6 characters)'
            }
          }
        },
        ValidateOptionsRequest: {
          type: 'object',
          required: ['optionIds'],
          properties: {
            optionIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of option IDs to validate'
            },
            carId: {
              type: 'string',
              description: 'Optional: Car ID for context-specific validation'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          required: ['success'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates whether the request was successful'
            },
            data: {
              description: 'Response data (only when success: true)'
            },
            error: {
              type: 'string',
              description: 'Error message (only when success: false)'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              enum: [false],
              description: 'Always false for errors'
            },
            error: {
              type: 'string',
              description: 'Fehlermeldung'
            },
            details: {
              type: 'object',
              additionalProperties: true,
              description: 'Additional error details'
            }
          }
        },
        LocaleUpdate: {
          type: 'object',
          required: ['locale'],
          properties: {
            locale: {
              type: 'string',
              enum: ['de', 'en'],
              description: 'Language locale code'
            }
          }
        },
        RequiredGroup: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the required group'
            },
            exclusiveGroup: {
              type: 'string',
              description: 'Name of the exclusive group'
            },
            isRequired: {
              type: 'boolean',
              description: 'Whether this group is required for configurations'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        RequiredGroupUpdate: {
          type: 'object',
          required: ['exclusiveGroup', 'isRequired'],
          properties: {
            exclusiveGroup: {
              type: 'string',
              description: 'Name of the exclusive group',
              minLength: 1
            },
            isRequired: {
              type: 'boolean',
              description: 'Whether this group should be required'
            }
          }
        },
        AdminUserDelete: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'string',
              description: 'ID of the user to delete',
              minLength: 1
            }
          }
        },
        UserSession: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Optional session identifier'
            },
            userId: {
              type: 'string',
              description: 'Optional user identifier'
            }
          }
        },
        option: {
          type: 'object',
          required: ['id', 'name', 'category', 'price'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique option identifier'
            },
            name: {
              type: 'string',
              description: 'Option name',
              examples: ['Sport Package', 'Premium Sound', 'Navigation']
            },
            category: {
              type: 'string',
              description: 'Option category',
              examples: ['engine', 'interior', 'exterior', 'technology']
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Option price in Euro',
              minimum: 0
            },
            description: {
              type: 'string',
              description: 'Detailed option description'
            },
            imageUrl: {
              type: ['string', 'null'],
              description: 'Option image URL (can be relative or absolute)',
              examples: ['/images/options/sport-package.jpg', 'https://example.com/image.jpg']
            },
            isExclusive: {
              type: 'boolean',
              description: 'Whether this option is exclusive to one selection'
            },
            exclusiveGroup: {
              type: ['string', 'null'],
              description: 'Exclusive group identifier'
            },
            requiredOptions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of required option IDs'
            },
            conflictingOptions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of conflicting option IDs'
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error response',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    type: 'object',
                    properties: {
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            field: { type: 'string' },
                            message: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error response',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Internal server error'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized access response',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Unauthorized access'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      securitySchemes: {
        AdminAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'admin-session',
          description: 'Admin-Session-Cookie für authentifizierte Anfragen'
        },
        UserAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT-Token für Benutzerauthentifizierung'
        }
      }
    }
  },
  apis: ['./src/app/api/**/*.ts']
}

export const swaggerSpec = swaggerJSDoc(options)

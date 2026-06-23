import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  spec: {
    content: {
      openapi: '3.0.0',
      info: { title: 'Supermarket ERP API', version: '1.0.0' },
      paths: {
        '/api/products': {
          get: { summary: 'List all products', responses: { 200: { description: 'OK' } } }
        }
      }
    }
  }
})
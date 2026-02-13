import { PrismaClient } from '@prisma/client';

// Database security configuration
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  errorFormat: 'minimal',
});

// Enhanced error handling
prisma.$on('error', (e) => {
  console.error('Database error:', e);
});

// Query logging for monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  });
}

export { prisma };
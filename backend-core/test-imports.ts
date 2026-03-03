import { config } from './src/config';
import { logger } from './src/utils/logger';
import { connectDatabase } from './src/services/prisma';
import { connectMongoDB } from './src/services/mongodb';
import { getRedisClient } from './src/services/redis';
import { scheduleRecurringJobs } from './src/services/queue';
import { startAllProcessors } from './src/jobs/processors';
import { createApp } from './src/app';

console.log('Testing imports...');
try {
    console.log('Config:', !!config);
    console.log('Logger:', !!logger);
    console.log('ConnectDatabase:', !!connectDatabase);
    console.log('ConnectMongoDB:', !!connectMongoDB);
    console.log('Redis:', !!getRedisClient);
    console.log('Queue:', !!scheduleRecurringJobs);
    console.log('Processors:', !!startAllProcessors);
    console.log('App:', !!createApp);
    const { Server } = require('socket.io');
    console.log('Socket.io:', !!Server);
    console.log('All imports successful!');
} catch (e) {
    console.error('Import failed:', e);
}

import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

let memoryServer: any = null;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const configuredUri = configService.get<string>('MONGODB_URI');

        // If a remote MongoDB Atlas URI is explicitly configured, use it directly
        if (
          configuredUri &&
          !configuredUri.includes('127.0.0.1') &&
          !configuredUri.includes('localhost')
        ) {
          logger.log(`Connecting to external MongoDB database...`);
          return { uri: configuredUri };
        }

        // Try local MongoDB first with short timeout (1.5s), or fallback to embedded in-memory MongoDB
        try {
          const testUri = configuredUri || 'mongodb://127.0.0.1:27017/task-management';
          const mongoose = require('mongoose');
          const conn = await mongoose.createConnection(testUri, {
            serverSelectionTimeoutMS: 1500,
          }).asPromise();
          await conn.close();
          logger.log(`Connected to local MongoDB instance at ${testUri}`);
          return { uri: testUri };
        } catch {
          logger.warn(
            'Local MongoDB service not detected on port 27017. Starting embedded in-memory database...',
          );
          try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            if (!memoryServer) {
              memoryServer = await MongoMemoryServer.create({
                instance: {
                  dbName: 'task-management',
                },
              });
            }
            const memoryUri = memoryServer.getUri();
            logger.log(`Embedded in-memory MongoDB active at ${memoryUri}`);
            return { uri: memoryUri };
          } catch (memErr: any) {
            logger.error(`Could not start in-memory MongoDB: ${memErr.message}`);
            return { uri: configuredUri || 'mongodb://127.0.0.1:27017/task-management' };
          }
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
let memoryServer = null;
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const logger = new common_1.Logger('DatabaseModule');
                    const configuredUri = configService.get('MONGODB_URI');
                    if (configuredUri &&
                        !configuredUri.includes('127.0.0.1') &&
                        !configuredUri.includes('localhost')) {
                        logger.log(`Connecting to external MongoDB database...`);
                        return {
                            uri: configuredUri,
                            serverSelectionTimeoutMS: 10000,
                            family: 4,
                        };
                    }
                    try {
                        const testUri = configuredUri || 'mongodb://127.0.0.1:27017/task-management';
                        const mongoose = require('mongoose');
                        const conn = await mongoose.createConnection(testUri, {
                            serverSelectionTimeoutMS: 1500,
                        }).asPromise();
                        await conn.close();
                        logger.log(`Connected to local MongoDB instance at ${testUri}`);
                        return { uri: testUri };
                    }
                    catch {
                        logger.warn('Local MongoDB service not detected on port 27017. Starting embedded in-memory database...');
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
                        }
                        catch (memErr) {
                            logger.error(`Could not start in-memory MongoDB: ${memErr.message}`);
                            return { uri: configuredUri || 'mongodb://127.0.0.1:27017/task-management' };
                        }
                    }
                },
                inject: [config_1.ConfigService],
            }),
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map
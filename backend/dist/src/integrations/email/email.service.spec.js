"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const email_service_1 = require("./email.service");
describe('EmailService', () => {
    let service;
    let configService;
    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn().mockImplementation((key, defaultValue) => {
                if (key === 'EMAIL_PROVIDER')
                    return 'log';
                if (key === 'EMAIL_FROM')
                    return 'TaskFlow <no-reply@taskflow.dev>';
                return defaultValue || null;
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                email_service_1.EmailService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(email_service_1.EmailService);
        configService = module.get(config_1.ConfigService);
    });
    describe('sendTaskCreatedEmail', () => {
        it('should dispatch task creation email notification asynchronously', async () => {
            const result = await service.sendTaskCreatedEmail('user@example.com', 'John Doe', 'Build Email Service', new Date('2026-09-01'));
            expect(result).toBe(true);
        });
    });
    describe('sendTaskCompletedEmail', () => {
        it('should dispatch task completion email notification when status transitions to DONE', async () => {
            const result = await service.sendTaskCompletedEmail('user@example.com', 'John Doe', 'Build Email Service');
            expect(result).toBe(true);
        });
    });
});
//# sourceMappingURL=email.service.spec.js.map
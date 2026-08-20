import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'EMAIL_PROVIDER') return 'log';
        if (key === 'EMAIL_FROM') return 'TaskFlow <no-reply@taskflow.dev>';
        return defaultValue || null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
  });

  describe('sendTaskCreatedEmail', () => {
    it('should dispatch task creation email notification asynchronously', async () => {
      const result = await service.sendTaskCreatedEmail(
        'user@example.com',
        'John Doe',
        'Build Email Service',
        new Date('2026-09-01'),
      );

      expect(result).toBe(true);
    });
  });

  describe('sendTaskCompletedEmail', () => {
    it('should dispatch task completion email notification when status transitions to DONE', async () => {
      const result = await service.sendTaskCompletedEmail(
        'user@example.com',
        'John Doe',
        'Build Email Service',
      );

      expect(result).toBe(true);
    });
  });
});

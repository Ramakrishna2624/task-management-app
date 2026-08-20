import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'demo_cloud';
        if (key === 'CLOUDINARY_API_KEY') return '123456';
        if (key === 'CLOUDINARY_API_SECRET') return 'secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    configService = module.get(ConfigService);
  });

  describe('validateFile', () => {
    it('should throw BadRequestException if no file is provided', () => {
      expect(() => service.validateFile(undefined)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file exceeds 5MB size limit', () => {
      const mockOversizedFile: any = {
        size: 6 * 1024 * 1024,
        mimetype: 'image/png',
        originalname: 'large_image.png',
      };

      expect(() => service.validateFile(mockOversizedFile)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unsupported file types', () => {
      const mockExecutableFile: any = {
        size: 1024,
        mimetype: 'application/x-msdownload',
        originalname: 'malware.exe',
      };

      expect(() => service.validateFile(mockExecutableFile)).toThrow(
        BadRequestException,
      );
    });

    it('should pass validation for valid images and PDFs under 5MB', () => {
      const mockValidFile: any = {
        size: 2 * 1024 * 1024,
        mimetype: 'image/png',
        originalname: 'document.png',
      };

      expect(() => service.validateFile(mockValidFile)).not.toThrow();
    });
  });

  describe('uploadFile', () => {
    it('should return secure URL and public ID on successful upload in fallback mode', async () => {
      // Mock missing credentials to trigger test fallback upload
      configService.get.mockReturnValue(null);

      const mockFile: any = {
        size: 1024,
        mimetype: 'image/png',
        originalname: 'test.png',
        buffer: Buffer.from('test data'),
      };

      const result = await service.uploadFile(mockFile);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('publicId');
      expect(result.originalName).toBe('test.png');
    });
  });
});

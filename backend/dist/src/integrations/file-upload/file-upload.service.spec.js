"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const file_upload_service_1 = require("./file-upload.service");
describe('FileUploadService', () => {
    let service;
    let configService;
    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn().mockImplementation((key) => {
                if (key === 'CLOUDINARY_CLOUD_NAME')
                    return 'demo_cloud';
                if (key === 'CLOUDINARY_API_KEY')
                    return '123456';
                if (key === 'CLOUDINARY_API_SECRET')
                    return 'secret';
                return null;
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                file_upload_service_1.FileUploadService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(file_upload_service_1.FileUploadService);
        configService = module.get(config_1.ConfigService);
    });
    describe('validateFile', () => {
        it('should throw BadRequestException if no file is provided', () => {
            expect(() => service.validateFile(undefined)).toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException if file exceeds 5MB size limit', () => {
            const mockOversizedFile = {
                size: 6 * 1024 * 1024,
                mimetype: 'image/png',
                originalname: 'large_image.png',
            };
            expect(() => service.validateFile(mockOversizedFile)).toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException for unsupported file types', () => {
            const mockExecutableFile = {
                size: 1024,
                mimetype: 'application/x-msdownload',
                originalname: 'malware.exe',
            };
            expect(() => service.validateFile(mockExecutableFile)).toThrow(common_1.BadRequestException);
        });
        it('should pass validation for valid images and PDFs under 5MB', () => {
            const mockValidFile = {
                size: 2 * 1024 * 1024,
                mimetype: 'image/png',
                originalname: 'document.png',
            };
            expect(() => service.validateFile(mockValidFile)).not.toThrow();
        });
    });
    describe('uploadFile', () => {
        it('should return secure URL and public ID on successful upload in fallback mode', async () => {
            configService.get.mockReturnValue(null);
            const mockFile = {
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
//# sourceMappingURL=file-upload.service.spec.js.map
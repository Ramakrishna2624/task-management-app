"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FileUploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FileUploadService = FileUploadService_1 = class FileUploadService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FileUploadService_1.name);
        this.MAX_FILE_SIZE = 5 * 1024 * 1024;
        this.ALLOWED_MIME_TYPES = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
    }
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        if (file.size > this.MAX_FILE_SIZE) {
            throw new common_1.BadRequestException(`File size exceeds maximum allowed limit of 5MB`);
        }
        if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed types: images (JPEG, PNG, WEBP, GIF), PDF, TXT, DOCX.`);
        }
    }
    async uploadFile(file) {
        this.validateFile(file);
        const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
        let cloudinary = null;
        try {
            cloudinary = require('cloudinary').v2;
            if (cloudName && apiKey && apiSecret) {
                cloudinary.config({
                    cloud_name: cloudName,
                    api_key: apiKey,
                    api_secret: apiSecret,
                });
            }
        }
        catch (e) {
            this.logger.warn('Cloudinary package not loaded, using fallback upload handler');
        }
        if (!cloudName || !apiKey || !apiSecret || !cloudinary) {
            this.logger.log(`[Fallback Upload] Simulating upload for file ${file.originalname}`);
            return {
                url: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
                publicId: `sample_${Date.now()}`,
                originalName: file.originalname,
            };
        }
        try {
            return await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'task_attachments',
                    resource_type: 'auto',
                }, (error, result) => {
                    if (error || !result) {
                        this.logger.error('Cloudinary upload error:', error);
                        return reject(new common_1.InternalServerErrorException('Cloudinary file upload failed'));
                    }
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        originalName: file.originalname,
                    });
                });
                uploadStream.end(file.buffer);
            });
        }
        catch (err) {
            this.logger.error(`Upload failed for file ${file.originalname}`, err);
            throw new common_1.InternalServerErrorException(err.message || 'File upload failed');
        }
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = FileUploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map
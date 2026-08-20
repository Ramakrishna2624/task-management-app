import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadResult {
  url: string;
  publicId: string;
  originalName: string;
}

export interface MulterFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  // 5MB Limit
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_MIME_TYPES = [
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

  constructor(private readonly configService: ConfigService) {}

  validateFile(file?: MulterFile) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed limit of 5MB`,
      );
    }
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed types: images (JPEG, PNG, WEBP, GIF), PDF, TXT, DOCX.`,
      );
    }
  }

  async uploadFile(file: MulterFile): Promise<UploadResult> {
    this.validateFile(file);

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    // Dynamically require cloudinary to support environments without optional native bindings
    let cloudinary: any = null;
    try {
      cloudinary = require('cloudinary').v2;
      if (cloudName && apiKey && apiSecret) {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });
      }
    } catch (e) {
      this.logger.warn('Cloudinary package not loaded, using fallback upload handler');
    }

    // Fallback mode if Cloudinary secrets or package are missing
    if (!cloudName || !apiKey || !apiSecret || !cloudinary) {
      this.logger.log(
        `[Fallback Upload] Simulating upload for file ${file.originalname}`,
      );
      return {
        url: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
        publicId: `sample_${Date.now()}`,
        originalName: file.originalname,
      };
    }

    try {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'task_attachments',
            resource_type: 'auto',
          },
          (error: any, result: any) => {
            if (error || !result) {
              this.logger.error('Cloudinary upload error:', error);
              return reject(
                new InternalServerErrorException('Cloudinary file upload failed'),
              );
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              originalName: file.originalname,
            });
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (err: any) {
      this.logger.error(`Upload failed for file ${file.originalname}`, err);
      throw new InternalServerErrorException(
        err.message || 'File upload failed',
      );
    }
  }
}

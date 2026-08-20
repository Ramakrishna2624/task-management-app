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
export declare class FileUploadService {
    private readonly configService;
    private readonly logger;
    private readonly MAX_FILE_SIZE;
    private readonly ALLOWED_MIME_TYPES;
    constructor(configService: ConfigService);
    validateFile(file?: MulterFile): void;
    uploadFile(file: MulterFile): Promise<UploadResult>;
}

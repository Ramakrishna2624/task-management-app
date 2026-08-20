import { FileUploadService, UploadResult, MulterFile } from './file-upload.service';
export declare class FileUploadController {
    private readonly fileUploadService;
    constructor(fileUploadService: FileUploadService);
    uploadFile(file?: MulterFile): Promise<UploadResult>;
}

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService, UploadResult, MulterFile } from './file-upload.service';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file?: MulterFile,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.fileUploadService.uploadFile(file);
  }
}

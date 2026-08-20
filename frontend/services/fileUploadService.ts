import api from './api';

export interface UploadResponse {
  url: string;
  publicId: string;
  originalName: string;
}

export const fileUploadService = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response: any = await api.post('/file-upload/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

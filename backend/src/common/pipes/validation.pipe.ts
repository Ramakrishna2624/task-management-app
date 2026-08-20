import { ValidationPipe as NestValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export const createValidationPipe = (options?: ValidationPipeOptions) => {
  return new NestValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    ...options,
  });
};

import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../schemas/task.schema';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description?: string;

  @IsEnum(TaskStatus, { message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}` })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority, { message: `Priority must be one of: ${Object.values(TaskPriority).join(', ')}` })
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Location must not exceed 500 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048, { message: 'Attachment URL must not exceed 2048 characters' })
  attachmentUrl?: string;
}

import { Model } from 'mongoose';
import { TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';
import { EmailService } from '../integrations/email/email.service';
import { UsersService } from '../users/users.service';
export interface PaginatedTaskResponse {
    data: TaskDocument[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
export declare class TasksService {
    private readonly taskModel;
    private readonly emailService;
    private readonly usersService;
    private readonly logger;
    constructor(taskModel: Model<TaskDocument>, emailService: EmailService, usersService: UsersService);
    create(userId: string, createTaskDto: CreateTaskDto): Promise<TaskDocument>;
    private sendTaskCreatedNotification;
    private sendTaskCompletedNotification;
    findAll(userId: string, query?: GetTasksQueryDto): Promise<PaginatedTaskResponse>;
    findOne(userId: string, id: string): Promise<TaskDocument>;
    update(userId: string, id: string, updateTaskDto: UpdateTaskDto): Promise<TaskDocument>;
    remove(userId: string, id: string): Promise<{
        id: string;
        success: boolean;
    }>;
}

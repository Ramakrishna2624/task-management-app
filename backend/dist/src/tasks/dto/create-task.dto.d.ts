import { TaskPriority, TaskStatus } from '../schemas/task.schema';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    location?: string;
    attachmentUrl?: string;
}

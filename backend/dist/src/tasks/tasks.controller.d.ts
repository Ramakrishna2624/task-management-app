import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(userId: string, createTaskDto: CreateTaskDto): Promise<import("./schemas/task.schema").TaskDocument>;
    findAll(userId: string, query: GetTasksQueryDto): Promise<import("./tasks.service").PaginatedTaskResponse>;
    findOne(userId: string, id: string): Promise<import("./schemas/task.schema").TaskDocument>;
    update(userId: string, id: string, updateTaskDto: UpdateTaskDto): Promise<import("./schemas/task.schema").TaskDocument>;
    remove(userId: string, id: string): Promise<{
        id: string;
        success: boolean;
    }>;
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksQueryDto, SortByField, SortOrder } from './dto/get-tasks-query.dto';
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

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<TaskDocument> {
    const task = new this.taskModel({
      ...createTaskDto,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      user: new Types.ObjectId(userId),
    });

    const savedTask = await task.save();

    // Fire-and-forget email – never blocks the response
    this.sendTaskCreatedNotification(userId, savedTask).catch(() => {
      // Silently swallowed; logged inside helper
    });

    return savedTask;
  }

  private async sendTaskCreatedNotification(
    userId: string,
    task: TaskDocument,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (user?.email) {
        await this.emailService.sendTaskCreatedEmail(
          user.email,
          user.name,
          task.title,
          task.dueDate,
        );
      }
    } catch (err: any) {
      this.logger.warn(`Task-created email notification failed: ${err.message || err}`);
    }
  }

  private async sendTaskCompletedNotification(
    userId: string,
    taskTitle: string,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (user?.email) {
        await this.emailService.sendTaskCompletedEmail(user.email, user.name, taskTitle);
      }
    } catch (err: any) {
      this.logger.warn(`Task-completed email notification failed: ${err.message || err}`);
    }
  }

  async findAll(
    userId: string,
    query: GetTasksQueryDto = {},
  ): Promise<PaginatedTaskResponse> {
    // Date validation
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);
      if (start > end) {
        throw new BadRequestException('startDate cannot be after endDate');
      }
    }

    // Base ownership filter — always enforced, no override possible
    const filter: Record<string, any> = { user: new Types.ObjectId(userId) };

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    if (query.startDate || query.endDate) {
      filter.dueDate = {};
      if (query.startDate) filter.dueDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.dueDate.$lte = new Date(query.endDate);
    }

    if (query.search && query.search.trim()) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    const sortBy = query.sortBy || SortByField.CREATED_AT;
    const sortOrder = query.sortOrder === SortOrder.ASC ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, tasks] = await Promise.all([
      this.taskModel.countDocuments(filter).exec(),
      this.taskModel.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(userId: string, id: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID format');
    }

    const task = await this.taskModel
      .findOne({
        _id: new Types.ObjectId(id),
        user: new Types.ObjectId(userId),
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    userId: string,
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID format');
    }

    // Load existing task to detect status transition for email
    const existingTask = await this.findOne(userId, id);
    const wasNotDone = existingTask.status !== TaskStatus.DONE;

    // Strip any attempts to override ownership from payload
    const updateData: Record<string, any> = { ...updateTaskDto };
    delete updateData.user;
    delete updateData._id;
    delete updateData.id;

    if (updateTaskDto.dueDate !== undefined) {
      updateData.dueDate = updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : null;
    }

    const updatedTask = await this.taskModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          user: new Types.ObjectId(userId),
        },
        updateData,
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    // Only send DONE email if this is an actual status transition (prevents duplicates)
    if (wasNotDone && updatedTask.status === TaskStatus.DONE) {
      this.sendTaskCompletedNotification(userId, updatedTask.title).catch(() => {});
    }

    return updatedTask;
  }

  async remove(userId: string, id: string): Promise<{ id: string; success: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID format');
    }

    const deletedTask = await this.taskModel
      .findOneAndDelete({
        _id: new Types.ObjectId(id),
        user: new Types.ObjectId(userId),
      })
      .exec();

    if (!deletedTask) {
      throw new NotFoundException('Task not found');
    }

    return { id, success: true };
  }
}

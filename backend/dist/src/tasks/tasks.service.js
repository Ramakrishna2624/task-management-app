"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const task_schema_1 = require("./schemas/task.schema");
const get_tasks_query_dto_1 = require("./dto/get-tasks-query.dto");
const email_service_1 = require("../integrations/email/email.service");
const users_service_1 = require("../users/users.service");
let TasksService = TasksService_1 = class TasksService {
    constructor(taskModel, emailService, usersService) {
        this.taskModel = taskModel;
        this.emailService = emailService;
        this.usersService = usersService;
        this.logger = new common_1.Logger(TasksService_1.name);
    }
    async create(userId, createTaskDto) {
        const task = new this.taskModel({
            ...createTaskDto,
            dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
            user: new mongoose_2.Types.ObjectId(userId),
        });
        const savedTask = await task.save();
        this.sendTaskCreatedNotification(userId, savedTask).catch(() => {
        });
        return savedTask;
    }
    async sendTaskCreatedNotification(userId, task) {
        try {
            const user = await this.usersService.findById(userId);
            if (user?.email) {
                await this.emailService.sendTaskCreatedEmail(user.email, user.name, task.title, task.dueDate);
            }
        }
        catch (err) {
            this.logger.warn(`Task-created email notification failed: ${err.message || err}`);
        }
    }
    async sendTaskCompletedNotification(userId, taskTitle) {
        try {
            const user = await this.usersService.findById(userId);
            if (user?.email) {
                await this.emailService.sendTaskCompletedEmail(user.email, user.name, taskTitle);
            }
        }
        catch (err) {
            this.logger.warn(`Task-completed email notification failed: ${err.message || err}`);
        }
    }
    async findAll(userId, query = {}) {
        if (query.startDate && query.endDate) {
            const start = new Date(query.startDate);
            const end = new Date(query.endDate);
            if (start > end) {
                throw new common_1.BadRequestException('startDate cannot be after endDate');
            }
        }
        const filter = { user: new mongoose_2.Types.ObjectId(userId) };
        if (query.status)
            filter.status = query.status;
        if (query.priority)
            filter.priority = query.priority;
        if (query.startDate || query.endDate) {
            filter.dueDate = {};
            if (query.startDate)
                filter.dueDate.$gte = new Date(query.startDate);
            if (query.endDate)
                filter.dueDate.$lte = new Date(query.endDate);
        }
        if (query.search && query.search.trim()) {
            const searchRegex = { $regex: query.search.trim(), $options: 'i' };
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex },
            ];
        }
        const sortBy = query.sortBy || get_tasks_query_dto_1.SortByField.CREATED_AT;
        const sortOrder = query.sortOrder === get_tasks_query_dto_1.SortOrder.ASC ? 1 : -1;
        const sortObj = { [sortBy]: sortOrder };
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
    async findOne(userId, id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid task ID format');
        }
        const task = await this.taskModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(id),
            user: new mongoose_2.Types.ObjectId(userId),
        })
            .exec();
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async update(userId, id, updateTaskDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid task ID format');
        }
        const existingTask = await this.findOne(userId, id);
        const wasNotDone = existingTask.status !== task_schema_1.TaskStatus.DONE;
        const updateData = { ...updateTaskDto };
        delete updateData.user;
        delete updateData._id;
        delete updateData.id;
        if (updateTaskDto.dueDate !== undefined) {
            updateData.dueDate = updateTaskDto.dueDate
                ? new Date(updateTaskDto.dueDate)
                : null;
        }
        const updatedTask = await this.taskModel
            .findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(id),
            user: new mongoose_2.Types.ObjectId(userId),
        }, updateData, { new: true, runValidators: true })
            .exec();
        if (!updatedTask) {
            throw new common_1.NotFoundException('Task not found');
        }
        if (wasNotDone && updatedTask.status === task_schema_1.TaskStatus.DONE) {
            this.sendTaskCompletedNotification(userId, updatedTask.title).catch(() => { });
        }
        return updatedTask;
    }
    async remove(userId, id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid task ID format');
        }
        const deletedTask = await this.taskModel
            .findOneAndDelete({
            _id: new mongoose_2.Types.ObjectId(id),
            user: new mongoose_2.Types.ObjectId(userId),
        })
            .exec();
        if (!deletedTask) {
            throw new common_1.NotFoundException('Task not found');
        }
        return { id, success: true };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(task_schema_1.Task.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        email_service_1.EmailService,
        users_service_1.UsersService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map
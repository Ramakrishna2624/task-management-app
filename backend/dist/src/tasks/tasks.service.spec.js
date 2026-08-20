"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const task_schema_1 = require("./schemas/task.schema");
const mongoose_2 = require("mongoose");
const email_service_1 = require("../integrations/email/email.service");
const users_service_1 = require("../users/users.service");
describe('TasksService', () => {
    let service;
    let model;
    let emailService;
    let usersService;
    const mockUserId = new mongoose_2.Types.ObjectId().toString();
    const mockOtherUserId = new mongoose_2.Types.ObjectId().toString();
    const mockTaskId = new mongoose_2.Types.ObjectId().toString();
    const mockTaskDoc = {
        _id: new mongoose_2.Types.ObjectId(mockTaskId),
        title: 'Test Task',
        description: 'Test Description',
        status: task_schema_1.TaskStatus.PENDING,
        priority: task_schema_1.TaskPriority.MEDIUM,
        dueDate: new Date('2026-09-01'),
        location: 'Office',
        attachmentUrl: 'https://example.com/file.pdf',
        user: new mongoose_2.Types.ObjectId(mockUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const mockModel = jest.fn().mockImplementation((dto) => ({
            ...dto,
            save: jest.fn().mockResolvedValue({
                _id: new mongoose_2.Types.ObjectId(mockTaskId),
                ...dto,
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
        }));
        mockModel.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue([mockTaskDoc]),
                    }),
                }),
            }),
        });
        mockModel.findOne = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockTaskDoc),
        });
        mockModel.findOneAndUpdate = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockTaskDoc),
        });
        mockModel.findOneAndDelete = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockTaskDoc),
        });
        mockModel.countDocuments = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(1),
        });
        const mockEmailService = {
            sendTaskCreatedEmail: jest.fn().mockResolvedValue(true),
            sendTaskCompletedEmail: jest.fn().mockResolvedValue(true),
        };
        const mockUsersService = {
            findById: jest.fn().mockResolvedValue({
                _id: mockUserId,
                name: 'Test User',
                email: 'test@example.com',
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tasks_service_1.TasksService,
                {
                    provide: (0, mongoose_1.getModelToken)(task_schema_1.Task.name),
                    useValue: mockModel,
                },
                {
                    provide: email_service_1.EmailService,
                    useValue: mockEmailService,
                },
                {
                    provide: users_service_1.UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();
        service = module.get(tasks_service_1.TasksService);
        model = module.get((0, mongoose_1.getModelToken)(task_schema_1.Task.name));
        emailService = module.get(email_service_1.EmailService);
        usersService = module.get(users_service_1.UsersService);
    });
    describe('create', () => {
        it('should create a task bound to the authenticated user ID', async () => {
            const dto = {
                title: 'New Task',
                description: 'Details',
                status: task_schema_1.TaskStatus.PENDING,
                priority: task_schema_1.TaskPriority.HIGH,
            };
            const result = await service.create(mockUserId, dto);
            expect(result.title).toBe('New Task');
        });
    });
    describe('findAll (Paginated Query API)', () => {
        it('should return paginated task data and metadata with defaults', async () => {
            const mockExec = jest.fn().mockResolvedValue([mockTaskDoc]);
            const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
            const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
            const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
            model.find.mockReturnValue({ sort: mockSort });
            model.countDocuments.mockReturnValue({
                exec: jest.fn().mockResolvedValue(15),
            });
            const result = await service.findAll(mockUserId, { page: 1, limit: 10 });
            expect(model.find).toHaveBeenCalledWith({
                user: new mongoose_2.Types.ObjectId(mockUserId),
            });
            expect(result.data).toHaveLength(1);
            expect(result.meta).toEqual({
                total: 15,
                page: 1,
                limit: 10,
                totalPages: 2,
                hasNextPage: true,
                hasPreviousPage: false,
            });
        });
        it('should filter by status, priority, and search keyword', async () => {
            const mockExec = jest.fn().mockResolvedValue([mockTaskDoc]);
            const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
            const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
            const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
            model.find.mockReturnValue({ sort: mockSort });
            model.countDocuments.mockReturnValue({
                exec: jest.fn().mockResolvedValue(1),
            });
            await service.findAll(mockUserId, {
                status: task_schema_1.TaskStatus.IN_PROGRESS,
                priority: task_schema_1.TaskPriority.HIGH,
                search: 'Office',
            });
            expect(model.find).toHaveBeenCalledWith({
                user: new mongoose_2.Types.ObjectId(mockUserId),
                status: task_schema_1.TaskStatus.IN_PROGRESS,
                priority: task_schema_1.TaskPriority.HIGH,
                $or: [
                    { title: { $regex: 'Office', $options: 'i' } },
                    { description: { $regex: 'Office', $options: 'i' } },
                    { location: { $regex: 'Office', $options: 'i' } },
                ],
            });
        });
        it('should filter by due-date range (startDate and endDate)', async () => {
            const mockExec = jest.fn().mockResolvedValue([mockTaskDoc]);
            const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
            const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
            const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
            model.find.mockReturnValue({ sort: mockSort });
            model.countDocuments.mockReturnValue({
                exec: jest.fn().mockResolvedValue(1),
            });
            const startDate = '2026-08-01T00:00:00.000Z';
            const endDate = '2026-09-30T23:59:59.999Z';
            await service.findAll(mockUserId, { startDate, endDate });
            expect(model.find).toHaveBeenCalledWith({
                user: new mongoose_2.Types.ObjectId(mockUserId),
                dueDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            });
        });
        it('should throw BadRequestException if startDate is after endDate', async () => {
            await expect(service.findAll(mockUserId, {
                startDate: '2026-10-01',
                endDate: '2026-08-01',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should calculate pagination metadata correctly on empty results', async () => {
            const mockExec = jest.fn().mockResolvedValue([]);
            const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
            const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
            const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
            model.find.mockReturnValue({ sort: mockSort });
            model.countDocuments.mockReturnValue({
                exec: jest.fn().mockResolvedValue(0),
            });
            const result = await service.findAll(mockUserId, { page: 1, limit: 10 });
            expect(result.data).toHaveLength(0);
            expect(result.meta).toEqual({
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            });
        });
    });
    describe('findOne', () => {
        it('should return task if found for authenticated user', async () => {
            model.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockTaskDoc),
            });
            const result = await service.findOne(mockUserId, mockTaskId);
            expect(result).toEqual(mockTaskDoc);
        });
        it('should throw BadRequestException if task ID format is invalid', async () => {
            await expect(service.findOne(mockUserId, 'invalid-id')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException if task does not belong to user', async () => {
            model.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });
            await expect(service.findOne(mockOtherUserId, mockTaskId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('update', () => {
        it('should update task and preserve user ownership', async () => {
            model.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({
                    ...mockTaskDoc,
                    title: 'Updated Title',
                }),
            });
            const result = await service.update(mockUserId, mockTaskId, {
                title: 'Updated Title',
            });
            expect(result.title).toBe('Updated Title');
        });
        it('should throw NotFoundException if trying to update task owned by another user', async () => {
            model.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });
            await expect(service.update(mockOtherUserId, mockTaskId, { title: 'Hacked' })).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('remove', () => {
        it('should delete task owned by user', async () => {
            model.findOneAndDelete.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockTaskDoc),
            });
            const result = await service.remove(mockUserId, mockTaskId);
            expect(result).toEqual({ id: mockTaskId, success: true });
        });
        it('should throw NotFoundException if user attempts to delete another user task', async () => {
            model.findOneAndDelete.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });
            await expect(service.remove(mockOtherUserId, mockTaskId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=tasks.service.spec.js.map
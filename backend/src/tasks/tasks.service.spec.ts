import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskPriority, TaskStatus } from './schemas/task.schema';
import { Types } from 'mongoose';
import { SortByField, SortOrder } from './dto/get-tasks-query.dto';
import { EmailService } from '../integrations/email/email.service';
import { UsersService } from '../users/users.service';

describe('TasksService', () => {
  let service: TasksService;
  let model: any;
  let emailService: any;
  let usersService: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockOtherUserId = new Types.ObjectId().toString();
  const mockTaskId = new Types.ObjectId().toString();

  const mockTaskDoc: any = {
    _id: new Types.ObjectId(mockTaskId),
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2026-09-01'),
    location: 'Office',
    attachmentUrl: 'https://example.com/file.pdf',
    user: new Types.ObjectId(mockUserId),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockModel: any = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(mockTaskId),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: mockModel,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    model = module.get(getModelToken(Task.name));
    emailService = module.get<EmailService>(EmailService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a task bound to the authenticated user ID', async () => {
      const dto = {
        title: 'New Task',
        description: 'Details',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
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
        user: new Types.ObjectId(mockUserId),
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
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        search: 'Office',
      });

      expect(model.find).toHaveBeenCalledWith({
        user: new Types.ObjectId(mockUserId),
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
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
        user: new Types.ObjectId(mockUserId),
        dueDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });
    });

    it('should throw BadRequestException if startDate is after endDate', async () => {
      await expect(
        service.findAll(mockUserId, {
          startDate: '2026-10-01',
          endDate: '2026-08-01',
        }),
      ).rejects.toThrow(BadRequestException);
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
      await expect(service.findOne(mockUserId, 'invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if task does not belong to user', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockOtherUserId, mockTaskId)).rejects.toThrow(
        NotFoundException,
      );
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

      await expect(
        service.update(mockOtherUserId, mockTaskId, { title: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);
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

      await expect(service.remove(mockOtherUserId, mockTaskId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

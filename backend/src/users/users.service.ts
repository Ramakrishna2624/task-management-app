import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userData: { name: string; email: string; password: string }): Promise<UserDocument> {
    const normalizedEmail = userData.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = new this.userModel({
      name: userData.name.trim(),
      email: normalizedEmail,
      password: userData.password,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.userModel.findOne({ email: normalizedEmail }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.userModel
      .findOne({ email: normalizedEmail })
      .select('+password')
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(id).exec();
    } catch {
      // Invalid ObjectId format — return null rather than throwing
      return null;
    }
  }
}

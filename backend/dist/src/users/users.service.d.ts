import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private readonly userModel;
    private readonly logger;
    constructor(userModel: Model<UserDocument>);
    create(userData: {
        name: string;
        email: string;
        password: string;
    }): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findByEmailWithPassword(email: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
}

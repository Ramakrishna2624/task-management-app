import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
export type TaskDocument = Task & Document;
export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare class Task {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    location: string;
    attachmentUrl: string;
    user: User;
}
export declare const TaskSchema: MongooseSchema<Task, import("mongoose").Model<Task, any, any, any, Document<unknown, any, Task, any, {}> & Task & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Task, Document<unknown, {}, import("mongoose").FlatRecord<Task>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Task> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

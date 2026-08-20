import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendTaskCreatedEmail(userEmail: string, userName: string, taskTitle: string, dueDate?: Date | null): Promise<boolean>;
    sendTaskCompletedEmail(userEmail: string, userName: string, taskTitle: string): Promise<boolean>;
}

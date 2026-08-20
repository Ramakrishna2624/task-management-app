import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'log');
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    const fromAddress = this.configService.get<string>(
      'EMAIL_FROM',
      'TaskFlow <no-reply@taskflow.dev>',
    );

    this.logger.log(`[Email Integration] Preparing email to ${options.to}: "${options.subject}"`);

    // If Resend API key is configured
    if ((provider === 'resend' || resendApiKey) && resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Resend email delivery failed: ${response.status} ${errorText}`);
          return false;
        }

        this.logger.log(`Email successfully delivered via Resend to ${options.to}`);
        return true;
      } catch (err: any) {
        this.logger.error(`Resend API request exception: ${err.message || err}`);
        return false;
      }
    }

    // Default Log / Local Dev Fallback Provider
    this.logger.log(
      `[Email Log Fallback] SIMULATED EMAIL DELIVERED TO: ${options.to}\nSubject: ${options.subject}\nFrom: ${fromAddress}`,
    );
    return true;
  }

  async sendTaskCreatedEmail(
    userEmail: string,
    userName: string,
    taskTitle: string,
    dueDate?: Date | null,
  ): Promise<boolean> {
    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'No due date';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #3b82f6;">Task Created: ${taskTitle}</h2>
        <p>Hello ${userName},</p>
        <p>Your task <strong>"${taskTitle}"</strong> has been successfully created in TaskFlow.</p>
        <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formattedDueDate}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">TaskFlow Automated Notifications</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Task Created: ${taskTitle}`,
      html,
    });
  }

  async sendTaskCompletedEmail(
    userEmail: string,
    userName: string,
    taskTitle: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #10b981;">Task Completed! 🎉</h2>
        <p>Hello ${userName},</p>
        <p>Congratulations! Your task <strong>"${taskTitle}"</strong> has been marked as <strong>DONE</strong>.</p>
        <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #10b981;">Status: Completed</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">TaskFlow Automated Notifications</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Task Completed: ${taskTitle}`,
      html,
    });
  }
}

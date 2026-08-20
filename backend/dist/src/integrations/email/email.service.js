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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async sendEmail(options) {
        const provider = this.configService.get('EMAIL_PROVIDER', 'log');
        const resendApiKey = this.configService.get('RESEND_API_KEY');
        const fromAddress = this.configService.get('EMAIL_FROM', 'TaskFlow <no-reply@taskflow.dev>');
        this.logger.log(`[Email Integration] Preparing email to ${options.to}: "${options.subject}"`);
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
            }
            catch (err) {
                this.logger.error(`Resend API request exception: ${err.message || err}`);
                return false;
            }
        }
        this.logger.log(`[Email Log Fallback] SIMULATED EMAIL DELIVERED TO: ${options.to}\nSubject: ${options.subject}\nFrom: ${fromAddress}`);
        return true;
    }
    async sendTaskCreatedEmail(userEmail, userName, taskTitle, dueDate) {
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
    async sendTaskCompletedEmail(userEmail, userName, taskTitle) {
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map
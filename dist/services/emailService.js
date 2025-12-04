"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer = __importStar(require("nodemailer"));
const logger_1 = __importDefault(require("../config/logger"));
class EmailService {
    constructor() {
        const emailConfig = {
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port: parseInt(process.env.EMAIL_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER || "",
                pass: process.env.EMAIL_PASS || "",
            },
        };
        const transportConfig = {
            ...emailConfig,
            tls: {
                rejectUnauthorized: false,
            },
            requireTLS: true,
            logger: false,
            debug: false
        };
        this.transporter = nodemailer.createTransport(transportConfig);
    }
    async sendVisitorApprovalRequest(data) {
        try {
            const { visitor, employee, approvalToken, baseUrl } = data;
            const approveUrl = `${baseUrl}/api/visitors/approve-email?token=${approvalToken}&action=approve`;
            const rejectUrl = `${baseUrl}/api/visitors/approve-email?token=${approvalToken}&action=reject`;
            const emailHtml = this.generateApprovalEmailTemplate({
                visitor,
                employee,
                approveUrl,
                rejectUrl,
            });
            const mailOptions = {
                from: `"FCL Security System" <${process.env.EMAIL_USER}>`,
                to: employee.email,
                subject: `Visitor Approval Required - ${visitor.fullName}`,
                html: emailHtml,
            };
            const result = await this.transporter.sendMail(mailOptions);
            logger_1.default.info(`Approval email sent to ${employee.email} for visitor ${visitor.fullName}`, {
                messageId: result.messageId,
                visitorId: visitor.id,
                employeeId: employee.employeeId,
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to send visitor approval email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                employeeEmail: data.employee.email,
                visitorId: data.visitor.id,
            });
            return false;
        }
    }
    async sendVisitorStatusUpdate(visitor, status, hostEmployee) {
        try {
            const emailHtml = this.generateStatusUpdateTemplate({
                visitor,
                status,
                hostEmployee,
            });
            const mailOptions = {
                from: `"FCL Security System" <${process.env.EMAIL_USER}>`,
                to: visitor.email,
                subject: `Visit ${status === 'approved' ? 'Approved' : 'Declined'} - FCL Security System`,
                html: emailHtml,
            };
            const result = await this.transporter.sendMail(mailOptions);
            logger_1.default.info(`Status update email sent to ${visitor.email}`, {
                messageId: result.messageId,
                visitorId: visitor.id,
                status,
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to send visitor status update email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                visitorEmail: visitor.email,
                visitorId: visitor.id,
                status,
            });
            return false;
        }
    }
    generateApprovalEmailTemplate(data) {
        const { visitor, employee, approveUrl, rejectUrl } = data;
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visitor Approval Required</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .approve { background: #28a745; color: white; }
          .reject { background: #dc3545; color: white; }
          .visitor-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Visitor Approval Required</h1>
          </div>
          <div class="content">
            <p>Dear ${employee.fullName},</p>
            <p>A visitor has requested to meet with you. Please review the details below and approve or reject the visit.</p>
            
            <div class="visitor-info">
              <h3>Visitor Information</h3>
              <p><strong>Name:</strong> ${visitor.fullName}</p>
              <p><strong>Email:</strong> ${visitor.email}</p>
              <p><strong>Phone:</strong> ${visitor.phone}</p>
              <p><strong>Company:</strong> ${visitor.company || 'N/A'}</p>
              <p><strong>Purpose:</strong> ${visitor.visitPurpose}</p>
              <p><strong>Expected Date/Time:</strong> ${visitor.expectedDate} at ${visitor.expectedTime}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${approveUrl}" class="button approve">APPROVE VISIT</a>
              <a href="${rejectUrl}" class="button reject">REJECT VISIT</a>
            </div>

            <p><strong>Note:</strong> This approval request will expire in 24 hours. If no action is taken, the visit will be automatically rejected.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from FCL Security System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateStatusUpdateTemplate(data) {
        const { visitor, status, hostEmployee } = data;
        const isApproved = status === 'approved';
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visit ${isApproved ? 'Approved' : 'Declined'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isApproved ? '#28a745' : '#dc3545'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .approved { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .rejected { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          .visit-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ${isApproved ? '#28a745' : '#dc3545'}; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Visit ${isApproved ? 'Approved' : 'Declined'}</h1>
          </div>
          <div class="content">
            <p>Dear ${visitor.fullName},</p>
            
            <div style="text-align: center;">
              <span class="status-badge ${isApproved ? 'approved' : 'rejected'}">
                ${isApproved ? '✓ APPROVED' : '✗ DECLINED'}
              </span>
            </div>

            <p>Your visit request has been <strong>${status}</strong> by ${hostEmployee.fullName}.</p>
            
            <div class="visit-info">
              <h3>Visit Details</h3>
              <p><strong>Host Employee:</strong> ${hostEmployee.fullName}</p>
              <p><strong>Department:</strong> ${hostEmployee.department}</p>
              <p><strong>Purpose:</strong> ${visitor.visitPurpose}</p>
              <p><strong>Expected Date/Time:</strong> ${visitor.expectedDate} at ${visitor.expectedTime}</p>
            </div>

            ${isApproved ? `
              <div style="background: #d1ecf1; padding: 15px; margin: 15px 0; border-left: 4px solid #bee5eb;">
                <h4>Next Steps:</h4>
                <ul>
                  <li>Please arrive at the main reception with a valid ID</li>
                  <li>Mention that you have an approved visit with ${hostEmployee.fullName}</li>
                  <li>Security will verify your identity and issue a visitor badge</li>
                  <li>Follow all security protocols during your visit</li>
                </ul>
              </div>
            ` : `
              <div style="background: #f8d7da; padding: 15px; margin: 15px 0; border-left: 4px solid #f5c6cb;">
                <p>If you have any questions about this decision, please contact ${hostEmployee.fullName} directly.</p>
              </div>
            `}
          </div>
          <div class="footer">
            <p>This is an automated message from FCL Security System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            logger_1.default.info('Email service connection verified successfully');
            return true;
        }
        catch (error) {
            logger_1.default.error('Email service connection failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}
exports.EmailService = EmailService;
const emailService = new EmailService();
exports.default = emailService;
//# sourceMappingURL=emailService.js.map
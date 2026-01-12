import * as nodemailer from 'nodemailer';
import { Employee } from '../entities/Employee';
import { Visitor } from '../entities/Visitor';
import logger from '../config/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface ApprovalEmailData {
  visitor: Visitor;
  employee: Employee;
  approvalToken: string;
  baseUrl: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailConfig: EmailConfig = {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    };

    // Add additional options for better SSL/TLS compatibility
    const transportConfig = {
      ...emailConfig,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      requireTLS: true,
      logger: false,
      debug: false
    };

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  /**
   * Send visitor approval request email to host employee
   */
  async sendVisitorApprovalRequest(data: ApprovalEmailData): Promise<boolean> {
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
      
      logger.info(`Approval email sent to ${employee.email} for visitor ${visitor.fullName}`, {
        messageId: result.messageId,
        visitorId: visitor.id,
        employeeId: employee.employeeId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send visitor approval email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        employeeEmail: data.employee.email,
        visitorId: data.visitor.id,
      });
      return false;
    }
  }

  /**
   * Send visitor status update email to visitor
   */
  async sendVisitorStatusUpdate(visitor: Visitor, status: 'approved' | 'rejected', hostEmployee: Employee): Promise<boolean> {
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
      
      logger.info(`Status update email sent to ${visitor.email}`, {
        messageId: result.messageId,
        visitorId: visitor.id,
        status,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send visitor status update email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        visitorEmail: visitor.email,
        visitorId: visitor.id,
        status,
      });
      return false;
    }
  }

  /**
   * Send visitor check-in notification to host employee
   * This method is called asynchronously (fire-and-forget) to avoid delaying the check-in process
   */
  async sendVisitorCheckInNotification(visitor: Visitor, hostEmployee: Employee): Promise<boolean> {
    try {
      const emailHtml = this.generateCheckInNotificationTemplate({
        visitor,
        hostEmployee,
      });

      const mailOptions = {
        from: `"FCL Security System" <${process.env.EMAIL_USER}>`,
        to: hostEmployee.email,
        subject: `Visitor Checked In - ${visitor.fullName} is here to see you`,
        html: emailHtml,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Check-in notification sent to ${hostEmployee.email} for visitor ${visitor.fullName}`, {
        messageId: result.messageId,
        visitorId: visitor.id,
        employeeId: hostEmployee.employeeId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send visitor check-in notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        employeeEmail: hostEmployee.email,
        visitorName: visitor.fullName,
        visitorId: visitor.id,
      });
      return false;
    }
  }

  /**
   * Generate HTML template for approval email
   */
  private generateApprovalEmailTemplate(data: {
    visitor: Visitor;
    employee: Employee;
    approveUrl: string;
    rejectUrl: string;
  }): string {
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

  /**
   * Generate HTML template for status update email
   */
  private generateStatusUpdateTemplate(data: {
    visitor: Visitor;
    status: 'approved' | 'rejected';
    hostEmployee: Employee;
  }): string {
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

  /**
   * Generate HTML template for visitor check-in notification to host employee
   */
  private generateCheckInNotificationTemplate(data: {
    visitor: Visitor;
    hostEmployee: Employee;
  }): string {
    const { visitor, hostEmployee } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visitor Checked In</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert-box { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .alert-box h2 { color: #856404; margin: 0 0 10px 0; }
          .visitor-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
          .info-row { padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #555; display: inline-block; width: 150px; }
          .value { color: #333; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .timestamp { background: #007bff; color: white; padding: 10px; text-align: center; border-radius: 5px; margin: 15px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Visitor Has Checked In</h1>
          </div>
          <div class="content">
            <p>Dear ${hostEmployee.fullName},</p>
            
            <div class="alert-box">
              <h2>Your visitor is here!</h2>
              <p style="margin: 5px 0; font-size: 18px;"><strong>${visitor.fullName}</strong> has checked in at the gate and is on their way to meet you.</p>
            </div>

            <div class="timestamp">
              Check-in Time: ${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Africa/Nairobi'
              })}
            </div>
            
            <div class="visitor-info">
              <h3>Visitor Information</h3>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${visitor.fullName}</span>
              </div>
              ${visitor.email ? `
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${visitor.email}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${visitor.phone}</span>
              </div>
              ${visitor.company ? `
              <div class="info-row">
                <span class="label">Company:</span>
                <span class="value">${visitor.company}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Purpose of Visit:</span>
                <span class="value">${visitor.visitPurpose}</span>
              </div>
              ${visitor.vehicleNumber ? `
              <div class="info-row">
                <span class="label">Vehicle Number:</span>
                <span class="value">${visitor.vehicleNumber}</span>
              </div>
              ` : ''}
              ${visitor.visitorCardNumber ? `
              <div class="info-row">
                <span class="label">Visitor Badge:</span>
                <span class="value">${visitor.visitorCardNumber}</span>
              </div>
              ` : ''}
            </div>

            <div style="background: #d1ecf1; padding: 15px; margin: 15px 0; border-left: 4px solid #0c5460; border-radius: 3px;">
              <h4 style="margin-top: 0; color: #0c5460;">📋 Please Note:</h4>
              <ul style="margin: 10px 0;">
                <li>Your visitor has been cleared by security and issued a visitor badge</li>
                <li>Please expect them to arrive at your location shortly</li>
                <li>Ensure they are accompanied during their visit as per company policy</li>
                <li>Remember to sign them out when the visit concludes</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from FCL Security System.</p>
            <p>For assistance, contact Security at Main Gate or IT Support.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

const emailService = new EmailService();
export default emailService;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("../config/logger"));
class NotificationService {
    static async notifyAdmins(subject, text) {
        const recipients = (process.env.ALERT_EMAILS || '')
            .split(',')
            .map(e => e.trim())
            .filter(Boolean);
        if (!recipients.length || !this.transporter) {
            logger_1.default.warn(`Admin notification skipped. Subject: ${subject}. Message: ${text}`);
            return;
        }
        const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
        try {
            await this.transporter.sendMail({
                from,
                to: recipients,
                subject,
                text,
            });
            logger_1.default.info(`Admin notification sent: ${subject}`);
        }
        catch (err) {
            logger_1.default.error('Failed to send admin notification', err);
        }
    }
}
exports.NotificationService = NotificationService;
NotificationService.transporter = (() => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        logger_1.default.warn('SMTP not configured; admin notifications will be logged only');
        return null;
    }
    return nodemailer_1.default.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
})();
//# sourceMappingURL=notificationService.js.map
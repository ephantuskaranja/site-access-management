export declare class NotificationService {
    private static transporter;
    static notifyAdmins(subject: string, text: string): Promise<void>;
}

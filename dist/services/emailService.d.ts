import { Employee } from '../entities/Employee';
import { Visitor } from '../entities/Visitor';
interface ApprovalEmailData {
    visitor: Visitor;
    employee: Employee;
    approvalToken: string;
    baseUrl: string;
}
export declare class EmailService {
    private transporter;
    constructor();
    sendVisitorApprovalRequest(data: ApprovalEmailData): Promise<boolean>;
    sendVisitorStatusUpdate(visitor: Visitor, status: 'approved' | 'rejected', hostEmployee: Employee): Promise<boolean>;
    private generateApprovalEmailTemplate;
    private generateStatusUpdateTemplate;
    testConnection(): Promise<boolean>;
}
declare const emailService: EmailService;
export default emailService;

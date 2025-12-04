"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorController = void 0;
const Visitor_1 = require("../entities/Visitor");
const Employee_1 = require("../entities/Employee");
const AccessLog_1 = require("../entities/AccessLog");
const types_1 = require("../types");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../config/logger"));
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = __importDefault(require("../config/database"));
const emailService_1 = __importDefault(require("../services/emailService"));
const typeorm_1 = require("typeorm");
class VisitorController {
}
exports.VisitorController = VisitorController;
_a = VisitorController;
VisitorController.getAllVisitors = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status, hostDepartment, visitPurpose, startDate, endDate, search, sort = 'createdAt', order = 'desc', } = req.query;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const where = {};
    if (status && typeof status === 'string') {
        where.status = status;
    }
    if (hostDepartment && typeof hostDepartment === 'string') {
        where.hostDepartment = hostDepartment;
    }
    if (visitPurpose && typeof visitPurpose === 'string') {
        where.visitPurpose = visitPurpose;
    }
    if (startDate || endDate) {
        const dateFilter = {};
        if (startDate && typeof startDate === 'string') {
            dateFilter.from = new Date(startDate);
        }
        if (endDate && typeof endDate === 'string') {
            dateFilter.to = new Date(endDate);
        }
        if (dateFilter.from || dateFilter.to) {
            where.expectedDate = (0, typeorm_1.Between)(dateFilter.from || new Date('1900-01-01'), dateFilter.to || new Date('2100-01-01'));
        }
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const orderBy = {};
    const sortField = sort || 'createdAt';
    const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    orderBy[sortField] = orderDirection;
    try {
        let visitors;
        let total;
        if (search && typeof search === 'string') {
            const queryBuilder = visitorRepository.createQueryBuilder('visitor');
            queryBuilder.where('(visitor.firstName LIKE :search OR visitor.lastName LIKE :search OR visitor.email LIKE :search OR visitor.phone LIKE :search OR visitor.idNumber LIKE :search OR visitor.company LIKE :search)', { search: `%${search}%` });
            if (status)
                queryBuilder.andWhere('visitor.status = :status', { status });
            if (hostDepartment)
                queryBuilder.andWhere('visitor.hostDepartment = :hostDepartment', { hostDepartment });
            if (visitPurpose)
                queryBuilder.andWhere('visitor.visitPurpose = :visitPurpose', { visitPurpose });
            if (startDate || endDate) {
                if (startDate && endDate) {
                    queryBuilder.andWhere('visitor.expectedDate BETWEEN :startDate AND :endDate', {
                        startDate: new Date(startDate),
                        endDate: new Date(endDate)
                    });
                }
                else if (startDate) {
                    queryBuilder.andWhere('visitor.expectedDate >= :startDate', { startDate: new Date(startDate) });
                }
                else if (endDate) {
                    queryBuilder.andWhere('visitor.expectedDate <= :endDate', { endDate: new Date(endDate) });
                }
            }
            queryBuilder
                .orderBy(`visitor.${sortField}`, orderDirection)
                .skip(skip)
                .take(limitNum);
            visitors = await queryBuilder.getMany();
            total = await queryBuilder.getCount();
        }
        else {
            visitors = await visitorRepository.find({
                where,
                order: orderBy,
                skip,
                take: limitNum,
            });
            total = await visitorRepository.count({ where });
        }
        const totalPages = Math.ceil(total / limitNum);
        const response = {
            success: true,
            message: 'Visitors retrieved successfully',
            data: {
                visitors,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1,
                },
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Error fetching visitors:', error);
        const response = {
            success: false,
            message: 'Error fetching visitors',
        };
        res.status(500).json(response);
    }
});
VisitorController.getApprovedVisitors = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, date, } = req.query;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const queryBuilder = visitorRepository.createQueryBuilder('visitor');
    queryBuilder.where('visitor.status = :status', { status: types_1.VisitorStatus.APPROVED });
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    queryBuilder.andWhere('visitor.expectedDate BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
    });
    queryBuilder
        .orderBy('visitor.expectedTime', 'ASC')
        .addOrderBy('visitor.createdAt', 'DESC')
        .skip(skip)
        .take(limitNum);
    try {
        const visitors = await queryBuilder.getMany();
        const total = await queryBuilder.getCount();
        const totalPages = Math.ceil(total / limitNum);
        const response = {
            success: true,
            message: 'Approved visitors retrieved successfully',
            data: {
                visitors,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1,
                },
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Error fetching approved visitors:', error);
        const response = {
            success: false,
            message: 'Error fetching approved visitors',
        };
        res.status(500).json(response);
    }
});
VisitorController.getVisitorById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const visitor = await visitorRepository.findOne({
        where: { id },
        relations: ['approvedBy']
    });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    const response = {
        success: true,
        message: 'Visitor retrieved successfully',
        data: { visitor },
    };
    res.status(200).json(response);
});
VisitorController.createVisitor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const visitorData = req.body;
    const { autoApprove = false } = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const employeeRepository = dataSource.getRepository(Employee_1.Employee);
    let hostEmployee = null;
    if (!autoApprove && visitorData.hostEmployee) {
        hostEmployee = await employeeRepository.findOne({
            where: { id: visitorData.hostEmployee },
        });
        if (!hostEmployee) {
            const response = {
                success: false,
                message: 'Selected host employee not found',
            };
            res.status(400).json(response);
            return;
        }
    }
    let selectedEmployee = null;
    if (visitorData.hostEmployee) {
        selectedEmployee = await employeeRepository.findOne({
            where: { id: visitorData.hostEmployee },
        });
        if (!selectedEmployee) {
            const response = {
                success: false,
                message: 'Selected host employee not found',
            };
            res.status(400).json(response);
            return;
        }
    }
    const visitor = visitorRepository.create({
        ...visitorData,
        hostEmployee: selectedEmployee ? selectedEmployee.email : visitorData.hostEmployee,
        status: autoApprove ? types_1.VisitorStatus.APPROVED : types_1.VisitorStatus.PENDING,
        approvedById: autoApprove ? req.user?.id : undefined,
    });
    const savedVisitor = await visitorRepository.save(visitor);
    const visitorEntity = Array.isArray(savedVisitor) ? savedVisitor[0] : savedVisitor;
    if (autoApprove && visitorEntity.status === types_1.VisitorStatus.APPROVED) {
        visitorEntity.generateQRCode();
        await visitorRepository.save(visitorEntity);
    }
    if (!autoApprove && hostEmployee) {
        try {
            const approvalToken = hostEmployee.getApprovalToken();
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            await emailService_1.default.sendVisitorApprovalRequest({
                visitor: visitorEntity,
                employee: hostEmployee,
                approvalToken,
                baseUrl,
            });
            logger_1.default.info(`Approval email sent to ${hostEmployee.email} for visitor ${visitorEntity.fullName}`);
        }
        catch (error) {
            logger_1.default.error('Failed to send approval email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                visitorId: visitorEntity.id,
                hostEmployeeEmail: hostEmployee.email,
            });
        }
    }
    logger_1.default.info(`New visitor created: ${visitorEntity.fullName} by ${req.user?.email}${autoApprove ? ' (auto-approved)' : ''}`);
    const response = {
        success: true,
        message: autoApprove ? 'Visitor created and approved successfully' : 'Visitor created successfully',
        data: { visitor: visitorEntity },
    };
    res.status(201).json(response);
});
VisitorController.handleEmailApproval = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, action } = req.query;
    if (!token || !action) {
        res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Invalid Request</h2>
            <p>The approval link is invalid or expired.</p>
          </body>
        </html>
      `);
        return;
    }
    if (action !== 'approve' && action !== 'reject') {
        res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Invalid Action</h2>
            <p>Invalid approval action specified.</p>
          </body>
        </html>
      `);
        return;
    }
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">System Error</h2>
            <p>Database connection not available. Please try again later.</p>
          </body>
        </html>
      `);
        return;
    }
    const employeeRepository = dataSource.getRepository(Employee_1.Employee);
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    try {
        const employees = await employeeRepository.find();
        let matchingEmployee = null;
        let visitor = null;
        for (const employee of employees) {
            const employeeToken = employee.getApprovalToken();
            if (employeeToken === token) {
                matchingEmployee = employee;
                visitor = await visitorRepository.findOne({
                    where: [
                        {
                            hostEmployee: employee.email,
                            status: types_1.VisitorStatus.PENDING,
                        },
                        {
                            hostEmployee: employee.fullName,
                            status: types_1.VisitorStatus.PENDING,
                        }
                    ],
                    order: { createdAt: 'DESC' },
                });
                logger_1.default.info(`Email approval attempt: Employee ${employee.fullName} (${employee.email}), token match: true, pending visitor found: ${!!visitor}`);
                break;
            }
        }
        if (!matchingEmployee) {
            logger_1.default.warn(`Email approval failed: No employee found for token`, { token: token.toString().substring(0, 10) + '...' });
            res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #dc3545;">Invalid Link</h2>
              <p>This approval link is not valid or has expired.</p>
            </body>
          </html>
        `);
            return;
        }
        if (!visitor) {
            logger_1.default.warn(`Email approval failed: No pending visitor found for employee ${matchingEmployee.fullName}`);
            res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #dc3545;">Not Found</h2>
              <p>No pending visitor found for this approval link, or the link has expired.</p>
            </body>
          </html>
        `);
            return;
        }
        if (action === 'approve') {
            visitor.status = types_1.VisitorStatus.APPROVED;
            delete visitor.approvedById;
            visitor.generateQRCode();
            delete visitor.rejectionReason;
        }
        else {
            visitor.status = types_1.VisitorStatus.REJECTED;
            visitor.rejectionReason = 'Rejected by host employee via email';
            delete visitor.approvedById;
        }
        await visitorRepository.save(visitor);
        const actionText = action === 'approve' ? 'approved' : 'rejected';
        const statusColor = action === 'approve' ? '#28a745' : '#dc3545';
        logger_1.default.info(`Visitor ${visitor.fullName} ${actionText} by ${matchingEmployee.fullName} via email`);
        try {
            const status = action === 'approve' ? 'approved' : 'rejected';
            await emailService_1.default.sendVisitorStatusUpdate(visitor, status, matchingEmployee);
            logger_1.default.info(`Status update email sent to visitor ${visitor.email}`);
        }
        catch (emailError) {
            logger_1.default.error('Failed to send status update email to visitor', {
                error: emailError instanceof Error ? emailError.message : 'Unknown error',
                visitorId: visitor.id,
                visitorEmail: visitor.email,
            });
        }
        res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: ${statusColor};">Visitor ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px auto; max-width: 400px;">
              <p><strong>Visitor:</strong> ${visitor.fullName}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${visitor.status.toUpperCase()}</span></p>
              <p><strong>Date:</strong> ${new Date(visitor.expectedDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${visitor.expectedTime}</p>
            </div>
            <p style="color: #666;">The security team has been notified of your decision.</p>
          </body>
        </html>
      `);
    }
    catch (error) {
        logger_1.default.error('Error processing email approval', {
            error: error instanceof Error ? error.message : 'Unknown error',
            token,
            action,
        });
        res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Error</h2>
            <p>An error occurred while processing your request. Please contact the security department.</p>
          </body>
        </html>
      `);
    }
});
VisitorController.updateVisitor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const visitor = await visitorRepository.findOne({ where: { id } });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    Object.assign(visitor, updateData);
    const updatedVisitor = await visitorRepository.save(visitor);
    const response = {
        success: true,
        message: 'Visitor updated successfully',
        data: { visitor: updatedVisitor },
    };
    res.status(200).json(response);
});
VisitorController.approveVisitor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const visitor = await visitorRepository.findOne({ where: { id } });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    if (visitor.status !== types_1.VisitorStatus.PENDING) {
        const response = {
            success: false,
            message: 'Only pending visitors can be approved',
        };
        res.status(400).json(response);
        return;
    }
    if (!req.user?.id) {
        const response = {
            success: false,
            message: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
    }
    visitor.approve(req.user.id);
    const approvedVisitor = await visitorRepository.save(visitor);
    logger_1.default.info(`Visitor approved: ${approvedVisitor.fullName} by ${req.user?.email}`);
    const response = {
        success: true,
        message: 'Visitor approved successfully',
        data: { visitor: approvedVisitor },
    };
    res.status(200).json(response);
});
VisitorController.rejectVisitor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
        const response = {
            success: false,
            message: 'Rejection reason is required',
        };
        res.status(400).json(response);
        return;
    }
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const visitor = await visitorRepository.findOne({ where: { id } });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    if (visitor.status !== types_1.VisitorStatus.PENDING) {
        const response = {
            success: false,
            message: 'Only pending visitors can be rejected',
        };
        res.status(400).json(response);
        return;
    }
    visitor.reject(reason);
    const rejectedVisitor = await visitorRepository.save(visitor);
    logger_1.default.info(`Visitor rejected: ${rejectedVisitor.fullName} by ${req.user?.email}`);
    const response = {
        success: true,
        message: 'Visitor rejected successfully',
        data: { visitor: rejectedVisitor },
    };
    res.status(200).json(response);
});
VisitorController.checkInVisitor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const accessLogRepository = dataSource.getRepository(AccessLog_1.AccessLog);
    const visitor = await visitorRepository.findOne({ where: { id } });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    if (visitor.status !== types_1.VisitorStatus.APPROVED) {
        const response = {
            success: false,
            message: 'Only approved visitors can check in',
        };
        res.status(400).json(response);
        return;
    }
    visitor.checkIn();
    const checkedInVisitor = await visitorRepository.save(visitor);
    if (!req.user?.id) {
        const response = {
            success: false,
            message: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
    }
    const accessLog = accessLogRepository.create({
        visitorId: visitor.id,
        action: types_1.AccessAction.CHECK_IN,
        timestamp: new Date(),
        guardId: req.user.id,
        location: 'Main Gate',
        notes: `Visitor checked in: ${visitor.fullName}`,
    });
    await accessLogRepository.save(accessLog);
    logger_1.default.info(`Visitor checked in: ${checkedInVisitor.fullName} by ${req.user?.email}`);
    const response = {
        success: true,
        message: 'Visitor checked in successfully',
        data: { visitor: checkedInVisitor },
    };
    res.status(200).json(response);
});
VisitorController.checkOutVisitor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const accessLogRepository = dataSource.getRepository(AccessLog_1.AccessLog);
    const visitor = await visitorRepository.findOne({ where: { id } });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    if (visitor.status !== types_1.VisitorStatus.CHECKED_IN) {
        const response = {
            success: false,
            message: 'Only checked-in visitors can check out',
        };
        res.status(400).json(response);
        return;
    }
    visitor.checkOut();
    const checkedOutVisitor = await visitorRepository.save(visitor);
    if (!req.user?.id) {
        const response = {
            success: false,
            message: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
    }
    const accessLog = accessLogRepository.create({
        visitorId: visitor.id,
        action: types_1.AccessAction.CHECK_OUT,
        timestamp: new Date(),
        guardId: req.user.id,
        location: 'Main Gate',
        notes: `Visitor checked out: ${visitor.fullName}. Duration: ${visitor.visitDuration || 'N/A'}`,
    });
    await accessLogRepository.save(accessLog);
    logger_1.default.info(`Visitor checked out: ${checkedOutVisitor.fullName} by ${req.user?.email}`);
    const response = {
        success: true,
        message: 'Visitor checked out successfully',
        data: { visitor: checkedOutVisitor },
    };
    res.status(200).json(response);
});
VisitorController.getVisitorQRCode = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const visitor = await visitorRepository.findOne({ where: { id } });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    if (visitor.status !== types_1.VisitorStatus.APPROVED && visitor.status !== types_1.VisitorStatus.CHECKED_IN) {
        const response = {
            success: false,
            message: 'QR code only available for approved or checked-in visitors',
        };
        res.status(400).json(response);
        return;
    }
    if (!visitor.qrCode) {
        const response = {
            success: false,
            message: 'QR code not generated for this visitor',
        };
        res.status(400).json(response);
        return;
    }
    try {
        const qrCodeDataURL = await qrcode_1.default.toDataURL(visitor.qrCode);
        const response = {
            success: true,
            message: 'QR code generated successfully',
            data: {
                qrCode: visitor.qrCode,
                qrCodeImage: qrCodeDataURL,
                visitor: {
                    id: visitor.id,
                    name: visitor.fullName,
                    status: visitor.status,
                    visitPurpose: visitor.visitPurpose,
                },
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Error generating QR code:', error);
        const response = {
            success: false,
            message: 'Error generating QR code',
        };
        res.status(500).json(response);
    }
});
VisitorController.deleteVisitor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const visitorRepository = dataSource.getRepository(Visitor_1.Visitor);
    const visitor = await visitorRepository.findOne({ where: { id } });
    if (!visitor) {
        const response = {
            success: false,
            message: 'Visitor not found',
        };
        res.status(404).json(response);
        return;
    }
    if (visitor.status === types_1.VisitorStatus.CHECKED_IN) {
        const response = {
            success: false,
            message: 'Cannot delete checked-in visitors',
        };
        res.status(400).json(response);
        return;
    }
    await visitorRepository.remove(visitor);
    logger_1.default.info(`Visitor deleted: ${visitor.fullName}`);
    const response = {
        success: true,
        message: 'Visitor deleted successfully',
    };
    res.status(200).json(response);
});
//# sourceMappingURL=visitorController.js.map
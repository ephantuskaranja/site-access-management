import { Request, Response } from 'express';
import { Visitor } from '../entities/Visitor';
import { Employee } from '../entities/Employee';
import { AccessLog } from '../entities/AccessLog';
import { ApiResponse, VisitorStatus, AccessAction, VisitPurpose } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import QRCode from 'qrcode';
import database from '../config/database';
import emailService from '../services/emailService';
import { Between, FindOptionsWhere } from 'typeorm';

export class VisitorController {
  /**
   * @desc    Get all visitors with filtering and pagination
   * @route   GET /api/visitors
   * @access  Private (Guard/Admin/Employee)
   */
  static getAllVisitors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      status,
      hostDepartment,
      visitPurpose,
      startDate,
      endDate,
      search,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);

    // Build where conditions
    const where: FindOptionsWhere<Visitor> = {};

    if (status && typeof status === 'string') {
      where.status = status as VisitorStatus;
    }

    if (hostDepartment && typeof hostDepartment === 'string') {
      where.hostDepartment = hostDepartment;
    }

    if (visitPurpose && typeof visitPurpose === 'string') {
      where.visitPurpose = visitPurpose as VisitPurpose;
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate && typeof startDate === 'string') {
        dateFilter.from = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        dateFilter.to = new Date(endDate);
      }
      if (dateFilter.from || dateFilter.to) {
        where.expectedDate = Between(
          dateFilter.from || new Date('1900-01-01'),
          dateFilter.to || new Date('2100-01-01')
        );
      }
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build order
    const orderBy: any = {};
    const sortField = (sort as string) || 'createdAt';
    const orderDirection = (order as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    orderBy[sortField] = orderDirection;

    try {
      let visitors;
      let total;

      if (search && typeof search === 'string') {
        // Use query builder for complex search
        const queryBuilder = visitorRepository.createQueryBuilder('visitor');
        
        queryBuilder.where(
          `(
            visitor.firstName LIKE :search OR 
            visitor.lastName LIKE :search OR 
            visitor.email LIKE :search OR 
            visitor.phone LIKE :search OR 
            visitor.idNumber LIKE :search OR 
            visitor.company LIKE :search OR 
            visitor.visitorCardNumber LIKE :search OR 
            visitor.hostEmployee LIKE :search
          )`,
          { search: `%${search}%` }
        );

        // Apply other filters
        if (status) queryBuilder.andWhere('visitor.status = :status', { status });
        if (hostDepartment) queryBuilder.andWhere('visitor.hostDepartment = :hostDepartment', { hostDepartment });
        if (visitPurpose) queryBuilder.andWhere('visitor.visitPurpose = :visitPurpose', { visitPurpose });
        
        if (startDate || endDate) {
          if (startDate && endDate) {
            queryBuilder.andWhere('visitor.expectedDate BETWEEN :startDate AND :endDate', {
              startDate: new Date(startDate as string),
              endDate: new Date(endDate as string)
            });
          } else if (startDate) {
            queryBuilder.andWhere('visitor.expectedDate >= :startDate', { startDate: new Date(startDate as string) });
          } else if (endDate) {
            queryBuilder.andWhere('visitor.expectedDate <= :endDate', { endDate: new Date(endDate as string) });
          }
        }

        queryBuilder
          .orderBy(`visitor.${sortField}`, orderDirection as 'ASC' | 'DESC')
          .skip(skip)
          .take(limitNum);

        visitors = await queryBuilder.getMany();
        total = await queryBuilder.getCount();
      } else {
        // Simple find with where conditions
        visitors = await visitorRepository.find({
          where,
          order: orderBy,
          skip,
          take: limitNum,
        });

        total = await visitorRepository.count({ where });
      }

      const totalPages = Math.ceil(total / limitNum);

      // Enrich host display name without requiring client to fetch employees
      const employeeRepo = dataSource.getRepository(Employee);
      const hostValues = Array.from(new Set((visitors || []).map(v => v.hostEmployee).filter(Boolean))) as string[];
      let employees: Employee[] = [];
      if (hostValues.length) {
        const emails = hostValues.filter(v => /@/.test(String(v)));
        const ids = hostValues.filter(v => !/@/.test(String(v)));
        if (emails.length) {
          const chunk = await employeeRepo
            .createQueryBuilder('e')
            .where('LOWER(e.email) IN (:...emails)', { emails: emails.map(e => String(e).toLowerCase()) })
            .getMany();
          employees.push(...chunk);
        }
        if (ids.length) {
          const chunk = await employeeRepo
            .createQueryBuilder('e')
            .where('e.id IN (:...ids)', { ids })
            .getMany();
          employees.push(...chunk);
        }
      }
      const byEmail = new Map<string, Employee>();
      const byId = new Map<string, Employee>();
      for (const e of employees) {
        byId.set(e.id, e);
        byEmail.set((e.email || '').toLowerCase(), e);
      }
      const visitorsWithHost = (visitors || []).map(v => {
        const hv = v.hostEmployee;
        let hostDisplayName: string | undefined = undefined;
        if (hv) {
          if (/@/.test(String(hv))) {
            const emp = byEmail.get(String(hv).toLowerCase());
            if (emp) hostDisplayName = `${emp.firstName} ${emp.lastName}`.trim();
          } else {
            const emp = byId.get(String(hv));
            if (emp) hostDisplayName = `${emp.firstName} ${emp.lastName}`.trim();
          }
        }
        return { ...v, hostDisplayName } as any;
      });
      
      const response: ApiResponse<any> = {
        success: true,
        message: 'Visitors retrieved successfully',
        data: {
          visitors: visitorsWithHost,
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
    } catch (error) {
      logger.error('Error fetching visitors:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error fetching visitors',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Get approved visitors ready for check-in
   * @route   GET /api/visitors/ready-for-checkin
   * @access  Private (Guard/Admin)
   */
  static getApprovedVisitors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      date,
    } = req.query;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build query for approved visitors
    const queryBuilder = visitorRepository.createQueryBuilder('visitor');
    
    queryBuilder.where('visitor.status = :status', { status: VisitorStatus.APPROVED });

    // Filter by date if provided, otherwise show today's visitors
    const targetDate = date ? new Date(date as string) : new Date();
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
      
      const response: ApiResponse<any> = {
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
    } catch (error) {
      logger.error('Error fetching approved visitors:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error fetching approved visitors',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Get visitor by ID
   * @route   GET /api/visitors/:id
   * @access  Private (Guard/Admin/Employee)
   */
  static getVisitorById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);
    const employeeRepository = dataSource.getRepository(Employee);

    const visitor = await visitorRepository.findOne({ 
      where: { id },
      relations: ['approvedBy']
    });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    // Enrich host display name
    let hostDisplayName: string | undefined;
    if (visitor.hostEmployee) {
      if (/@/.test(String(visitor.hostEmployee))) {
        const emp = await employeeRepository.findOne({ where: { email: String(visitor.hostEmployee) } });
        if (emp) hostDisplayName = `${emp.firstName} ${emp.lastName}`.trim();
      } else {
        const emp = await employeeRepository.findOne({ where: { id: String(visitor.hostEmployee) } });
        if (emp) hostDisplayName = `${emp.firstName} ${emp.lastName}`.trim();
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor retrieved successfully',
      data: { visitor: { ...(visitor as any), hostDisplayName } },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Create new visitor
   * @route   POST /api/visitors
   * @access  Private (Guard/Admin)
   */
  static createVisitor = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const visitorData = req.body;
    const { autoApprove = false } = req.body;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);
    const employeeRepository = dataSource.getRepository(Employee);

    // Note: Removed duplicate ID check to allow repeat visitors
    // Multiple visitors can now have the same ID number for different visits

    // If not auto-approved, look up the host employee for email notification
    let hostEmployee: Employee | null = null;
    if (!autoApprove && visitorData.hostEmployee) {
      // Find employee by ID (since frontend now sends employee ID)
      hostEmployee = await employeeRepository.findOne({
        where: { id: visitorData.hostEmployee },
      });

      if (!hostEmployee) {
        const response: ApiResponse = {
          success: false,
          message: 'Selected host employee not found',
        };
        res.status(400).json(response);
        return;
      }
    }

    // Also validate that the employee exists even for auto-approve
    let selectedEmployee: Employee | null = null;
    if (visitorData.hostEmployee) {
      selectedEmployee = await employeeRepository.findOne({
        where: { id: visitorData.hostEmployee },
      });

      if (!selectedEmployee) {
        const response: ApiResponse = {
          success: false,
          message: 'Selected host employee not found',
        };
        res.status(400).json(response);
        return;
      }
    }

    // Create new visitor with appropriate status based on autoApprove
    // Store employee email in hostEmployee field for compatibility with existing views
    const visitor = visitorRepository.create({
      ...visitorData,
      hostEmployee: selectedEmployee ? selectedEmployee.email : visitorData.hostEmployee,
      status: autoApprove ? VisitorStatus.APPROVED : VisitorStatus.PENDING,
      approvedById: autoApprove ? req.user?.id : undefined,
    });
    
    const savedVisitor = await visitorRepository.save(visitor);

    // Handle array return from save
    const visitorEntity = Array.isArray(savedVisitor) ? savedVisitor[0] : savedVisitor;

    // Generate QR code if auto-approved
    if (autoApprove && visitorEntity.status === VisitorStatus.APPROVED) {
      visitorEntity.generateQRCode();
      await visitorRepository.save(visitorEntity);
    }

    // Send email notification if not auto-approved and host employee found
    if (!autoApprove && hostEmployee) {
      try {
        const approvalToken = hostEmployee.getApprovalToken();
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        
        await emailService.sendVisitorApprovalRequest({
          visitor: visitorEntity,
          employee: hostEmployee,
          approvalToken,
          baseUrl,
        });

        logger.info(`Approval email sent to ${hostEmployee.email} for visitor ${visitorEntity.fullName}`);
      } catch (error) {
        logger.error('Failed to send approval email', {
          error: error instanceof Error ? error.message : 'Unknown error',
          visitorId: visitorEntity.id,
          hostEmployeeEmail: hostEmployee.email,
        });
        // Don't fail the visitor creation if email fails
      }
    }

    logger.info(`New visitor created: ${visitorEntity.fullName} by ${req.user?.email}${autoApprove ? ' (auto-approved)' : ''}`);

    const response: ApiResponse<any> = {
      success: true,
      message: autoApprove ? 'Visitor created and approved successfully' : 'Visitor created successfully',
      data: { visitor: visitorEntity },
    };

    res.status(201).json(response);
  });

  /**
   * @desc    Handle visitor approval/rejection from email link
   * @route   GET /api/visitors/approve-email
   * @access  Public (no authentication required for email links)
   */
  static handleEmailApproval = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

    // Get database connection
    const dataSource = database.getDataSource();
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

    const employeeRepository = dataSource.getRepository(Employee);
    const visitorRepository = dataSource.getRepository(Visitor);

    try {
      // Find employee by token
      const employees = await employeeRepository.find();
      let matchingEmployee: Employee | null = null;
      let visitor: Visitor | null = null;

      // Find the employee whose token matches
      for (const employee of employees) {
        const employeeToken = employee.getApprovalToken();
        if (employeeToken === token) {
          matchingEmployee = employee;
          
          // Find pending visitor for this employee using both email and full name
          visitor = await visitorRepository.findOne({
            where: [
              {
                hostEmployee: employee.email,
                status: VisitorStatus.PENDING,
              },
              {
                hostEmployee: employee.fullName,
                status: VisitorStatus.PENDING,
              }
            ],
            order: { createdAt: 'DESC' }, // Get the most recent pending visitor
          });
          
          logger.info(`Email approval attempt: Employee ${employee.fullName} (${employee.email}), token match: true, pending visitor found: ${!!visitor}`);
          break;
        }
      }

      if (!matchingEmployee) {
        logger.warn(`Email approval failed: No employee found for token`, { token: token.toString().substring(0, 10) + '...' });
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
        logger.warn(`Email approval failed: No pending visitor found for employee ${matchingEmployee.fullName}`);
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

      // Perform the approval/rejection
      if (action === 'approve') {
        visitor.status = VisitorStatus.APPROVED;
        delete visitor.approvedById; // Email approvals don't have a user ID since employees may not be users
        visitor.generateQRCode();
        delete visitor.rejectionReason;
      } else {
        visitor.status = VisitorStatus.REJECTED;
        visitor.rejectionReason = 'Rejected by host employee via email';
        delete visitor.approvedById;
      }

      await visitorRepository.save(visitor);

      const actionText = action === 'approve' ? 'approved' : 'rejected';
      const statusColor = action === 'approve' ? '#28a745' : '#dc3545';

      logger.info(`Visitor ${visitor.fullName} ${actionText} by ${matchingEmployee.fullName} via email`);

      // Send status update email to the visitor
      try {
        const status = action === 'approve' ? 'approved' : 'rejected';
        await emailService.sendVisitorStatusUpdate(visitor, status, matchingEmployee);
        logger.info(`Status update email sent to visitor ${visitor.email}`);
      } catch (emailError) {
        logger.error('Failed to send status update email to visitor', {
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          visitorId: visitor.id,
          visitorEmail: visitor.email,
        });
        // Don't fail the approval if email notifications fail
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

    } catch (error) {
      logger.error('Error processing email approval', {
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

  /**
   * @desc    Update visitor
   * @route   PUT /api/visitors/:id
   * @access  Private (Guard/Admin)
   */
  static updateVisitor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);
    const employeeRepository = dataSource.getRepository(Employee);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    // Normalize hostEmployee: if an ID was provided, store the employee email to keep consistency
    if (updateData.hostEmployee && !String(updateData.hostEmployee).includes('@')) {
      const emp = await employeeRepository.findOne({ where: { id: String(updateData.hostEmployee) } });
      if (emp) {
        updateData.hostEmployee = emp.email;
      }
    }

    // Update visitor data
    Object.assign(visitor, updateData);
    const updatedVisitor = await visitorRepository.save(visitor);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor updated successfully',
      data: { visitor: updatedVisitor },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Approve visitor
   * @route   POST /api/visitors/:id/approve
   * @access  Private (Guard/Admin)
   */
  static approveVisitor = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    if (visitor.status !== VisitorStatus.PENDING) {
      const response: ApiResponse = {
        success: false,
        message: 'Only pending visitors can be approved',
      };
      res.status(400).json(response);
      return;
    }

    // Approve visitor
    if (!req.user?.id) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    visitor.approve(req.user.id);
    const approvedVisitor = await visitorRepository.save(visitor);

    logger.info(`Visitor approved: ${approvedVisitor.fullName} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor approved successfully',
      data: { visitor: approvedVisitor },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Reject visitor
   * @route   POST /api/visitors/:id/reject
   * @access  Private (Guard/Admin)
   */
  static rejectVisitor = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      const response: ApiResponse = {
        success: false,
        message: 'Rejection reason is required',
      };
      res.status(400).json(response);
      return;
    }

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    if (visitor.status !== VisitorStatus.PENDING) {
      const response: ApiResponse = {
        success: false,
        message: 'Only pending visitors can be rejected',
      };
      res.status(400).json(response);
      return;
    }

    // Reject visitor
    visitor.reject(reason);
    const rejectedVisitor = await visitorRepository.save(visitor);

    logger.info(`Visitor rejected: ${rejectedVisitor.fullName} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor rejected successfully',
      data: { visitor: rejectedVisitor },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Check in visitor
   * @route   POST /api/visitors/:id/checkin
   * @access  Private (Guard/Admin)
   */
  static checkInVisitor = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);
    const accessLogRepository = dataSource.getRepository(AccessLog);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    if (visitor.status !== VisitorStatus.APPROVED) {
      const response: ApiResponse = {
        success: false,
        message: 'Only approved visitors can check in',
      };
      res.status(400).json(response);
      return;
    }

    // Check in visitor
    visitor.checkIn();
    const checkedInVisitor = await visitorRepository.save(visitor);

    // Create access log entry
    if (!req.user?.id) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const userId = req.user.id as string;
    const accessLog = accessLogRepository.create({
      visitorId: visitor.id,
      action: AccessAction.CHECK_IN,
      timestamp: new Date(),
      guardId: userId,
      location: 'Main Gate',
      notes: `Visitor checked in: ${visitor.fullName}`,
    });
    await accessLogRepository.save(accessLog);

    // Send email notification to host employee (non-blocking, fire-and-forget)
    // This runs asynchronously without delaying the check-in response
    const emailNotificationsEnabled = process.env.ENABLE_CHECKIN_EMAIL_NOTIFICATIONS === 'true';
    if (emailNotificationsEnabled && visitor.hostEmployee) {
      const employeeRepository = dataSource.getRepository(Employee);

      // Use a simple query builder OR to avoid driver issues
      employeeRepository
        .createQueryBuilder('employee')
        .where('employee.email = :value OR employee.employeeId = :value', {
          value: visitor.hostEmployee,
        })
        .getOne()
        .then((hostEmployee) => {
          if (hostEmployee) {
            emailService
              .sendVisitorCheckInNotification(visitor, hostEmployee)
              .then((success) => {
                if (success) {
                  logger.info(
                    `Check-in notification queued for ${hostEmployee.email}`,
                  );
                } else {
                  logger.warn(
                    `Check-in notification failed for ${hostEmployee.email}`,
                  );
                }
              })
              .catch((error) => {
                logger.error('Error queueing check-in notification', { error });
              });
          } else {
            logger.warn(`Host employee not found for value: ${visitor.hostEmployee}`);
          }
        })
        .catch((error) => {
          logger.error('Error finding host employee for notification', { error });
        });
    }

    logger.info(`Visitor checked in: ${checkedInVisitor.fullName} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor checked in successfully',
      data: { visitor: checkedInVisitor },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Check out visitor
   * @route   POST /api/visitors/:id/checkout
   * @access  Private (Guard/Admin)
   */
  static checkOutVisitor = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);
    const accessLogRepository = dataSource.getRepository(AccessLog);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      const response: ApiResponse = {
        success: false,
        message: 'Only checked-in visitors can check out',
      };
      res.status(400).json(response);
      return;
    }

    // Enforce reception/admin confirmation before checkout
    if (!visitor.receptionConfirmedAt) {
      const response: ApiResponse = {
        success: false,
        message:
          'Visitor must be confirmed at reception by an admin or receptionist before checkout',
      };
      res.status(400).json(response);
      return;
    }

    // Check out visitor
    visitor.checkOut();
    const checkedOutVisitor = await visitorRepository.save(visitor);

    // Create access log entry
    if (!req.user?.id) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const userId = req.user.id as string;
    const accessLog = accessLogRepository.create({
      visitorId: visitor.id,
      action: AccessAction.CHECK_OUT,
      timestamp: new Date(),
      guardId: userId,
      location: 'Main Gate',
      notes: `Visitor checked out: ${visitor.fullName}. Duration: ${visitor.visitDuration || 'N/A'}`,
    });
    await accessLogRepository.save(accessLog);

    logger.info(`Visitor checked out: ${checkedOutVisitor.fullName} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor checked out successfully',
      data: { visitor: checkedOutVisitor },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Confirm visitor at reception (mark attended to)
   * @route   POST /api/visitors/:id/confirm
   * @access  Private (Admin/Receptionist)
   */
  static confirmVisitor = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);
    const accessLogRepository = dataSource.getRepository(AccessLog);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    // Only confirm visitors who are checked-in and not yet confirmed
    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      const response: ApiResponse = {
        success: false,
        message: 'Only checked-in visitors can be confirmed at reception',
      };
      res.status(400).json(response);
      return;
    }

    if (visitor.receptionConfirmedAt) {
      const response: ApiResponse = {
        success: true,
        message: 'Visitor already confirmed',
        data: { visitor },
      };
      res.status(200).json(response);
      return;
    }

    // Ensure authenticated user context for confirmation
    const confirmerId = req.user?.id;
    if (!confirmerId) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    visitor.receptionConfirmedAt = new Date();
    visitor.receptionConfirmedById = confirmerId;
    const confirmedVisitor = await visitorRepository.save(visitor);

    // Log the confirmation for audit (use ACCESS_GRANTED to avoid new enum)
    if (req.user?.id) {
      const accessLog = accessLogRepository.create({
        visitorId: visitor.id,
        action: AccessAction.ACCESS_GRANTED,
        timestamp: new Date(),
        guardId: req.user.id,
        location: 'Reception',
        notes: `Reception confirmed attendance for ${visitor.fullName}`,
      });
      await accessLogRepository.save(accessLog);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor confirmed at reception',
      data: { visitor: confirmedVisitor },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Get visitor QR code
   * @route   GET /api/visitors/:id/qrcode
   * @access  Private (Guard/Admin/Employee)
   */
  static getVisitorQRCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    if (visitor.status !== VisitorStatus.APPROVED && visitor.status !== VisitorStatus.CHECKED_IN) {
      const response: ApiResponse = {
        success: false,
        message: 'QR code only available for approved or checked-in visitors',
      };
      res.status(400).json(response);
      return;
    }

    if (!visitor.qrCode) {
      const response: ApiResponse = {
        success: false,
        message: 'QR code not generated for this visitor',
      };
      res.status(400).json(response);
      return;
    }

    try {
      // Generate QR code image
      const qrCodeDataURL = await QRCode.toDataURL(visitor.qrCode);

      const response: ApiResponse<any> = {
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
    } catch (error) {
      logger.error('Error generating QR code:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error generating QR code',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Delete visitor
   * @route   DELETE /api/visitors/:id
   * @access  Private (Admin only)
   */
  static deleteVisitor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const visitorRepository = dataSource.getRepository(Visitor);

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
    }

    // Don't allow deletion of checked-in visitors
    if (visitor.status === VisitorStatus.CHECKED_IN) {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot delete checked-in visitors',
      };
      res.status(400).json(response);
      return;
    }

    await visitorRepository.remove(visitor);

    logger.info(`Visitor deleted: ${visitor.fullName}`);

    const response: ApiResponse = {
      success: true,
      message: 'Visitor deleted successfully',
    };

    res.status(200).json(response);
  });
}
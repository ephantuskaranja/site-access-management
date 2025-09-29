import { Request, Response } from 'express';
import { Visitor } from '../entities/Visitor';
import { AccessLog } from '../entities/AccessLog';
import { ApiResponse, VisitorStatus, AccessAction, VisitPurpose } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import QRCode from 'qrcode';
import database from '../config/database';
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
          '(visitor.firstName LIKE :search OR visitor.lastName LIKE :search OR visitor.email LIKE :search OR visitor.phone LIKE :search OR visitor.idNumber LIKE :search OR visitor.company LIKE :search)',
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
      
      const response: ApiResponse<any> = {
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

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor retrieved successfully',
      data: { visitor },
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

    // Note: Removed duplicate ID check to allow repeat visitors
    // Multiple visitors can now have the same ID number for different visits

    // Create new visitor
    const visitor = visitorRepository.create(visitorData);
    const savedVisitor = await visitorRepository.save(visitor);

    // Handle array return from save
    const visitorEntity = Array.isArray(savedVisitor) ? savedVisitor[0] : savedVisitor;

    logger.info(`New visitor created: ${visitorEntity.fullName} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Visitor created successfully',
      data: { visitor: visitorEntity },
    };

    res.status(201).json(response);
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

    const visitor = await visitorRepository.findOne({ where: { id } });

    if (!visitor) {
      const response: ApiResponse = {
        success: false,
        message: 'Visitor not found',
      };
      res.status(404).json(response);
      return;
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

    const accessLog = accessLogRepository.create({
      visitorId: visitor.id,
      action: AccessAction.CHECK_IN,
      timestamp: new Date(),
      guardId: req.user.id,
      location: 'Main Gate',
      notes: `Visitor checked in: ${visitor.fullName}`,
    });
    await accessLogRepository.save(accessLog);

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

    const accessLog = accessLogRepository.create({
      visitorId: visitor.id,
      action: AccessAction.CHECK_OUT,
      timestamp: new Date(),
      guardId: req.user.id,
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
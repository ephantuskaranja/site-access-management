import { Request, Response } from 'express';
import { VehicleMovement, MovementType, MovementStatus } from '../entities/VehicleMovement';
import { Vehicle } from '../entities/Vehicle';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import database from '../config/database';
import { FindOptionsWhere, Between } from 'typeorm';

export class VehicleMovementController {
  /**
   * @desc    Get all vehicle movements with filtering and pagination
   * @route   GET /api/vehicle-movements
   * @access  Private (Admin/Security Guard)
   */
  static getAllMovements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      vehicleId,
      area,
      movementType,
      status,
      driverName,
      startDate,
      endDate,
      search,
      sort = 'recordedAt',
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

    const movementRepository = dataSource.getRepository(VehicleMovement);

    // Use QueryBuilder to support searching related vehicle fields
    const qb = movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.vehicle', 'vehicle')
      .leftJoinAndSelect('movement.recordedBy', 'recordedBy');

    // Filters
    if (vehicleId && typeof vehicleId === 'string') {
      qb.andWhere('movement.vehicleId = :vehicleId', { vehicleId });
    }

    if (area && typeof area === 'string') {
      qb.andWhere('movement.area LIKE :area', { area: `%${area}%` });
    }

    if (movementType && typeof movementType === 'string') {
      qb.andWhere('movement.movementType = :movementType', { movementType });
    }

    if (status && typeof status === 'string') {
      qb.andWhere('movement.status = :status', { status });
    }

    if (driverName && typeof driverName === 'string') {
      qb.andWhere('movement.driverName LIKE :driverName', { driverName: `%${driverName}%` });
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      qb.andWhere('movement.recordedAt BETWEEN :start AND :end', { start, end });
    }

    // Search across movement and vehicle fields
    if (search && typeof search === 'string') {
      const searchTerm = (search as string).trim();
      if (searchTerm) {
        qb.andWhere(
          'movement.driverName LIKE :term OR movement.area LIKE :term OR movement.purpose LIKE :term OR movement.notes LIKE :term OR vehicle.licensePlate LIKE :term OR vehicle.make LIKE :term OR vehicle.model LIKE :term',
          { term: `%${searchTerm}%` }
        );
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await qb.clone().getCount();

    // Sorting
    const sortField = (sort as string) || 'recordedAt';
    const sortOrder = ((order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    qb.orderBy(`movement.${sortField}`, sortOrder);

    // Pagination and fetch
    qb.skip(skip).take(limitNum);
    const movements = await qb.getMany();

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle movements retrieved successfully',
      data: {
        movements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Get single vehicle movement by ID
   * @route   GET /api/vehicle-movements/:id
   * @access  Private (Admin/Security Guard)
   */
  static getMovement = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const movementRepository = dataSource.getRepository(VehicleMovement);

    const movement = await movementRepository.findOne({
      where: { id },
      relations: ['vehicle', 'recordedBy'],
    });

    if (!movement) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle movement not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle movement retrieved successfully',
      data: { movement },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Record vehicle entry or exit
   * @route   POST /api/vehicle-movements
   * @access  Private (Admin/Security Guard)
   */
  static recordMovement = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      vehicleId,
      area,
      movementType,
      mileage,
      driverName,
      driverPhone,
      driverLicense,
      purpose,
      notes,
      destination,
      recordedAt,
    } = req.body;

    // Validation (allow mileage = 0)
    if (!vehicleId || !area || !movementType || mileage === undefined || mileage === null || !driverName) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle ID, area, movement type, mileage, and driver name are required',
      };
      res.status(400).json(response);
      return;
    }

    if (!Object.values(MovementType).includes(movementType)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid movement type. Must be "entry" or "exit"',
      };
      res.status(400).json(response);
      return;
    }

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const movementRepository = dataSource.getRepository(VehicleMovement);
    const vehicleRepository = dataSource.getRepository(Vehicle);

    // Verify vehicle exists
    const vehicle = await vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle not found',
      };
      res.status(404).json(response);
      return;
    }

    if (!vehicle.isActive) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle is inactive and cannot be used for movements',
      };
      res.status(400).json(response);
      return;
    }

    if (!req.user?.id) {
      const response: ApiResponse = {
        success: false,
        message: 'User authentication required',
      };
      res.status(401).json(response);
      return;
    }

    // Log incoming payload for debugging destination value
    logger.info('Recording vehicle movement request payload', { payload: req.body });
    logger.info('Destination debug', {
      destinationProvided: Object.prototype.hasOwnProperty.call(req.body, 'destination'),
      destinationValue: req.body?.destination,
      destinationType: typeof req.body?.destination,
    });

    // Create movement record
    const movement = new VehicleMovement();
    movement.vehicleId = vehicleId;
    movement.area = area;
    movement.movementType = movementType;
    movement.mileage = parseFloat(mileage);
    movement.driverName = driverName;
    movement.driverPhone = driverPhone;
    movement.driverLicense = driverLicense;
    movement.purpose = purpose;
    movement.notes = notes;
    // Normalize and persist destination
    // - If destination is a string, trim it and store null when empty
    // - If destination is undefined, store null
    if (typeof destination === 'string') {
      const trimmed = destination.trim();
      movement.destination = trimmed.length > 0 ? trimmed : null;
    } else if (destination === null || destination === undefined) {
      movement.destination = null;
    } else {
      // In case a non-string sneaks in (unlikely), coerce to string
      movement.destination = String(destination);
    }
    movement.recordedById = req.user.id;
    movement.recordedAt = recordedAt ? new Date(recordedAt) : new Date();
    movement.status = MovementStatus.COMPLETED;

    logger.info('About to save movement', { vehicleId: movement.vehicleId, destination: movement.destination });

    const savedMovement = await movementRepository.save(movement);

    // Update vehicle's current mileage if this is more recent
    const currentMileage = parseFloat(mileage);
    if (!vehicle.currentMileage || currentMileage > vehicle.currentMileage) {
      vehicle.currentMileage = currentMileage;
      await vehicleRepository.save(vehicle);
    }

    // Fetch the saved movement with relations
    const movementWithRelations = await movementRepository.findOne({
      where: { id: savedMovement.id },
      relations: ['vehicle', 'recordedBy'],
    });

    logger.info('Vehicle movement recorded', {
      movementId: savedMovement.id,
      vehicleId,
      licensePlate: vehicle.licensePlate,
      movementType,
      area,
      mileage: currentMileage,
      driverName,
      destination: movementWithRelations?.destination ?? movement.destination ?? null,
      recordedBy: req.user?.id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle movement recorded successfully',
      data: { movement: movementWithRelations },
    };

      res.status(201).json(response);
  });

  /**
   * @desc    Update vehicle movement
   * @route   PUT /api/vehicle-movements/:id
   * @access  Private (Admin only)
   */
  static updateMovement = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
      area,
      movementType,
      mileage,
      driverName,
      driverPhone,
      driverLicense,
      purpose,
      notes,
      status,
      recordedAt,
    } = req.body;

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const movementRepository = dataSource.getRepository(VehicleMovement);

    const movement = await movementRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!movement) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle movement not found',
      };
      res.status(404).json(response);
      return;
    }

    // Update movement
    if (area !== undefined) movement.area = area;
    if (movementType !== undefined) movement.movementType = movementType;
    if (mileage !== undefined) movement.mileage = parseFloat(mileage);
    if (driverName !== undefined) movement.driverName = driverName;
    if (driverPhone !== undefined) movement.driverPhone = driverPhone;
    if (driverLicense !== undefined) movement.driverLicense = driverLicense;
  if (purpose !== undefined) movement.purpose = purpose;
  if (notes !== undefined) movement.notes = notes;
  if (req.body.destination !== undefined) {
    const d = req.body.destination;
    if (typeof d === 'string') {
      const trimmed = d.trim();
      movement.destination = trimmed.length > 0 ? trimmed : null;
    } else if (d === null) {
      movement.destination = null;
    } else {
      movement.destination = String(d);
    }
  }
    if (status !== undefined) movement.status = status;
    if (recordedAt !== undefined) movement.recordedAt = new Date(recordedAt);

    const updatedMovement = await movementRepository.save(movement);

    // Fetch updated movement with relations
    const movementWithRelations = await movementRepository.findOne({
      where: { id: updatedMovement.id },
      relations: ['vehicle', 'recordedBy'],
    });

    logger.info('Vehicle movement updated', {
      movementId: updatedMovement.id,
      vehicleId: movement.vehicleId,
      updatedBy: req.user?.id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle movement updated successfully',
      data: { movement: movementWithRelations },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Delete vehicle movement
   * @route   DELETE /api/vehicle-movements/:id
   * @access  Private (Admin only)
   */
  static deleteMovement = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const movementRepository = dataSource.getRepository(VehicleMovement);

    const movement = await movementRepository.findOne({
      where: { id },
    });

    if (!movement) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle movement not found',
      };
      res.status(404).json(response);
      return;
    }

    await movementRepository.remove(movement);

    logger.info('Vehicle movement deleted', {
      movementId: id,
      vehicleId: movement.vehicleId,
      deletedBy: req.user?.id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle movement deleted successfully',
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Get vehicle movement statistics
   * @route   GET /api/vehicle-movements/stats
   * @access  Private (Admin/Security Guard)
   */
  static getMovementStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const movementRepository = dataSource.getRepository(VehicleMovement);

    // Get date parameter from query (default to today if not provided)
    const { date } = req.query;
    let targetDate: Date;
    
    if (date && typeof date === 'string') {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }
    
    // Create date range for the target date (start of day to end of day)
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    
    logger.info(`Movement stats date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    logger.info(`Target date from query: ${date}, parsed as: ${targetDate.toISOString()}`);

    // Get movements for the specified date
    const totalMovements = await movementRepository.count({
      where: {
        recordedAt: Between(startOfDay, endOfDay),
      },
    });
    
    const entriesCount = await movementRepository.count({
      where: { 
        movementType: MovementType.ENTRY,
        recordedAt: Between(startOfDay, endOfDay),
      },
    });
    
    const exitsCount = await movementRepository.count({
      where: { 
        movementType: MovementType.EXIT,
        recordedAt: Between(startOfDay, endOfDay),
      },
    });

    logger.info(`Movement stats for ${date || 'today'}: Total=${totalMovements}, Entries=${entriesCount}, Exits=${exitsCount}`);

    // Get movements by area (for the specified date)
    const movementsByArea = await movementRepository
      .createQueryBuilder('movement')
      .select('movement.area', 'area')
      .addSelect('COUNT(*)', 'count')
      .where('movement.recordedAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .groupBy('movement.area')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Get recent movements (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMovements = await movementRepository.count({
      where: {
        recordedAt: Between(sevenDaysAgo, new Date()),
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle movement statistics retrieved successfully',
      data: {
        totalMovements,
        entriesCount,
        exitsCount,
        recentMovements,
        todayMovements: totalMovements, // Same as totalMovements since we're already filtering by date
        movementsByArea,
      },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Get movements for a specific vehicle
   * @route   GET /api/vehicles/:vehicleId/movements
   * @access  Private (Admin/Security Guard)
   */
  static getVehicleMovements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { vehicleId } = req.params;
    const {
      page = 1,
      limit = 10,
      movementType,
      startDate,
      endDate,
      sort = 'recordedAt',
      order = 'desc',
    } = req.query;

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const movementRepository = dataSource.getRepository(VehicleMovement);
    const vehicleRepository = dataSource.getRepository(Vehicle);

    // Verify vehicle exists
    const vehicle = await vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle not found',
      };
      res.status(404).json(response);
      return;
    }

    // Build where conditions
    const where: FindOptionsWhere<VehicleMovement> = { vehicleId };

    if (movementType && typeof movementType === 'string') {
      where.movementType = movementType;
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      where.recordedAt = Between(start, end);
    }

    // Get total count
    const total = await movementRepository.count({ where });

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get movements with pagination
    const movements = await movementRepository.find({
      where,
      relations: ['recordedBy'],
      order: { [sort as string]: order as 'ASC' | 'DESC' },
      skip,
      take: limitNum,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle movements retrieved successfully',
      data: {
        vehicle,
        movements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.status(200).json(response);
  });
}
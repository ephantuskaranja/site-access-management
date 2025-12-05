import { Request, Response } from 'express';
import { Vehicle, VehicleType, VehicleStatus } from '../entities/Vehicle';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import database from '../config/database';
import { FindOptionsWhere, Like, Not } from 'typeorm';

export class VehicleController {
  /**
   * @desc    Get all vehicles with filtering and pagination
   * @route   GET /api/vehicles
   * @access  Private (Admin/Security Guard)
   */
  static getAllVehicles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      department,
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

    const vehicleRepository = dataSource.getRepository(Vehicle);

    // Build where conditions
    const where: FindOptionsWhere<Vehicle> = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (type && typeof type === 'string') {
      where.type = type;
    }

    if (department && typeof department === 'string') {
      where.department = Like(`%${department}%`);
    }

    // Handle search across multiple fields
    let searchConditions: FindOptionsWhere<Vehicle>[] = [];
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      searchConditions = [
        { ...where, licensePlate: Like(`%${searchTerm}%`) },
        { ...where, make: Like(`%${searchTerm}%`) },
        { ...where, model: Like(`%${searchTerm}%`) },
        { ...where, assignedDriver: Like(`%${searchTerm}%`) },
        { ...where, department: Like(`%${searchTerm}%`) },
      ];
    }

    const finalWhere = searchConditions.length > 0 ? searchConditions : where;

    // Get total count
    const total = await vehicleRepository.count({
      where: finalWhere,
    });

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get vehicles with pagination
    const vehicles = await vehicleRepository.find({
      where: finalWhere,
      order: { [sort as string]: order as 'ASC' | 'DESC' },
      skip,
      take: limitNum,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles,
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
   * @desc    Get single vehicle by ID
   * @route   GET /api/vehicles/:id
   * @access  Private (Admin/Security Guard)
   */
  static getVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

    const vehicleRepository = dataSource.getRepository(Vehicle);

    const vehicle = await vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle retrieved successfully',
      data: { vehicle },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Create new vehicle
   * @route   POST /api/vehicles
   * @access  Private (Admin only)
   */
  static createVehicle = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      licensePlate,
      make,
      model,
      year,
      color,
      type = VehicleType.CAR,
      status = VehicleStatus.ACTIVE,
      department,
      assignedDriver,
      currentMileage,
      notes,
    } = req.body;

    // Validation
    if (!licensePlate) {
      const response: ApiResponse = {
        success: false,
        message: 'License plate is required',
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

    const vehicleRepository = dataSource.getRepository(Vehicle);

    // Check if license plate already exists
    const existingVehicle = await vehicleRepository.findOne({
      where: { licensePlate: licensePlate.toUpperCase() },
    });

    if (existingVehicle) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle with this license plate already exists',
      };
      res.status(409).json(response);
      return;
    }

    // Create new vehicle
    const vehicleData: Partial<Vehicle> = {
      licensePlate: licensePlate.toUpperCase(),
      make,
      model,
      color,
      type,
      status,
      department,
      assignedDriver,
      notes,
      isActive: true,
    };

    if (year) {
      vehicleData.year = parseInt(year, 10);
    }

    if (currentMileage) {
      vehicleData.currentMileage = parseFloat(currentMileage);
    }

    const vehicle = vehicleRepository.create(vehicleData);

    const savedVehicle = await vehicleRepository.save(vehicle);

    logger.info('Vehicle created', {
      vehicleId: savedVehicle.id,
      licensePlate: savedVehicle.licensePlate,
      createdBy: req.user?.id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle created successfully',
      data: { vehicle: savedVehicle },
    };

    res.status(201).json(response);
  });

  /**
   * @desc    Update vehicle
   * @route   PUT /api/vehicles/:id
   * @access  Private (Admin only)
   */
  static updateVehicle = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
      licensePlate,
      make,
      model,
      year,
      color,
      type,
      status,
      department,
      assignedDriver,
      currentMileage,
      notes,
      isActive,
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

    const vehicleRepository = dataSource.getRepository(Vehicle);

    const vehicle = await vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle not found',
      };
      res.status(404).json(response);
      return;
    }

    // Check if license plate is being changed and if it conflicts
    if (licensePlate && licensePlate.toUpperCase() !== vehicle.licensePlate) {
      const existingVehicle = await vehicleRepository.findOne({
        where: { licensePlate: licensePlate.toUpperCase() },
      });

      if (existingVehicle) {
        const response: ApiResponse = {
          success: false,
          message: 'Vehicle with this license plate already exists',
        };
        res.status(409).json(response);
        return;
      }
    }

    // Update vehicle
    if (licensePlate) vehicle.licensePlate = licensePlate.toUpperCase();
    if (make !== undefined) vehicle.make = make;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) {
      if (year) {
        vehicle.year = parseInt(year, 10);
      } else {
        delete vehicle.year;
      }
    }
    if (color !== undefined) vehicle.color = color;
    if (type !== undefined) vehicle.type = type;
    if (status !== undefined) vehicle.status = status;
    // Ensure isActive is true whenever status is set to active
    if (status === VehicleStatus.ACTIVE || status === 'active') {
      vehicle.isActive = true;
    }
  if (department !== undefined) vehicle.department = department;
    if (assignedDriver !== undefined) vehicle.assignedDriver = assignedDriver;
    if (currentMileage !== undefined) {
      if (currentMileage) {
        vehicle.currentMileage = parseFloat(currentMileage);
      } else {
        delete vehicle.currentMileage;
      }
    }
    if (notes !== undefined) vehicle.notes = notes;
    if (isActive !== undefined) vehicle.isActive = isActive;

    const updatedVehicle = await vehicleRepository.save(vehicle);

    logger.info('Vehicle updated', {
      vehicleId: updatedVehicle.id,
      licensePlate: updatedVehicle.licensePlate,
      updatedBy: req.user?.id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle: updatedVehicle },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Delete vehicle (soft delete)
   * @route   DELETE /api/vehicles/:id
   * @access  Private (Admin only)
   */
  static deleteVehicle = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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

    const vehicleRepository = dataSource.getRepository(Vehicle);

    const vehicle = await vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle not found',
      };
      res.status(404).json(response);
      return;
    }

    // Soft delete - set as inactive
    vehicle.isActive = false;
    vehicle.status = VehicleStatus.RETIRED;
    await vehicleRepository.save(vehicle);

    logger.info('Vehicle deleted (soft)', {
      vehicleId: vehicle.id,
      licensePlate: vehicle.licensePlate,
      deletedBy: req.user?.id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle deleted successfully',
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Get vehicle statistics
   * @route   GET /api/vehicles/stats
   * @access  Private (Admin/Security Guard)
   */
  static getVehicleStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const vehicleRepository = dataSource.getRepository(Vehicle);

    const totalVehicles = await vehicleRepository.count();
    const activeVehicles = await vehicleRepository.count({
      where: { status: VehicleStatus.ACTIVE, isActive: true },
    });
    const inactiveVehicles = await vehicleRepository.count({
      where: { status: VehicleStatus.INACTIVE },
    });
    const maintenanceVehicles = await vehicleRepository.count({
      where: { status: VehicleStatus.MAINTENANCE },
    });

    // Calculate vehicles currently on-site based on their latest movements
    const vehiclesOnSiteQuery = `
      WITH LatestMovements AS (
        SELECT 
          vm.vehicleId,
          vm.movementType,
          ROW_NUMBER() OVER (PARTITION BY vm.vehicleId ORDER BY vm.recordedAt DESC) as rn
        FROM vehicle_movements vm
        INNER JOIN vehicles v ON vm.vehicleId = v.id
        WHERE v.isActive = 1 AND v.status != 'retired'
      )
      SELECT COUNT(*) as count
      FROM LatestMovements 
      WHERE rn = 1 AND movementType = 'entry'
    `;

    let vehiclesOnSite = 0;
    let vehiclesOffSite = 0;
    try {
      // First, let's check if we have any movements at all
      const totalMovementsQuery = `SELECT COUNT(*) as count FROM vehicle_movements`;
      const totalMovementsResult = await dataSource.query(totalMovementsQuery);
      const totalMovements = totalMovementsResult[0]?.count || 0;
      
      // Check if we have any vehicles
      const totalActiveVehiclesQuery = `SELECT COUNT(*) as count FROM vehicles WHERE isActive = 1 AND status != 'retired'`;
      const totalActiveVehiclesResult = await dataSource.query(totalActiveVehiclesQuery);
      const totalActiveVehiclesCount = totalActiveVehiclesResult[0]?.count || 0;
      
      logger.info(`Debug: Total movements: ${totalMovements}, Total active vehicles: ${totalActiveVehiclesCount}`);
      
      if (totalMovements > 0) {
        const vehiclesOnSiteResult = await dataSource.query(vehiclesOnSiteQuery);
        vehiclesOnSite = vehiclesOnSiteResult[0]?.count || 0;
        
        // Calculate vehicles off-site (latest movement is exit or no movements)
        const vehiclesOffSiteQuery = `
          WITH LatestMovements AS (
            SELECT 
              vm.vehicleId,
              vm.movementType,
              ROW_NUMBER() OVER (PARTITION BY vm.vehicleId ORDER BY vm.recordedAt DESC) as rn
            FROM vehicle_movements vm
            INNER JOIN vehicles v ON vm.vehicleId = v.id
            WHERE v.isActive = 1 AND v.status != 'retired'
          ),
          VehiclesWithMovements AS (
            SELECT COUNT(*) as countWithExitMovement
            FROM LatestMovements 
            WHERE rn = 1 AND movementType = 'exit'
          ),
          VehiclesWithoutMovements AS (
            SELECT COUNT(*) as countWithoutMovement
            FROM vehicles v
            WHERE v.isActive = 1 AND v.status != 'retired'
            AND v.id NOT IN (SELECT DISTINCT vehicleId FROM vehicle_movements)
          )
          SELECT 
            (SELECT countWithExitMovement FROM VehiclesWithMovements) + 
            (SELECT countWithoutMovement FROM VehiclesWithoutMovements) as count
        `;
        
        const vehiclesOffSiteResult = await dataSource.query(vehiclesOffSiteQuery);
        vehiclesOffSite = vehiclesOffSiteResult[0]?.count || 0;
      } else {
        // No movements recorded yet, all active vehicles are off-site
        vehiclesOffSite = totalActiveVehiclesCount;
      }
      
      logger.info(`Vehicle site status: ${vehiclesOnSite} on-site, ${vehiclesOffSite} off-site`);
    } catch (error) {
      logger.error('Error calculating vehicle site status:', error);
      // If movements table doesn't exist or query fails, default to 0
      vehiclesOnSite = 0;
      vehiclesOffSite = 0;
    }

    // Get vehicles by type
    const vehiclesByType = await vehicleRepository
      .createQueryBuilder('vehicle')
      .select('vehicle.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('vehicle.isActive = :isActive', { isActive: true })
      .groupBy('vehicle.type')
      .getRawMany();

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle statistics retrieved successfully',
      data: {
        totalVehicles,
        activeVehicles,
        inactiveVehicles,
        maintenanceVehicles,
        vehiclesOnSite,
        vehiclesOffSite,
        vehiclesByType,
      },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Get active vehicles for movements (excludes retired and inactive)
   * @route   GET /api/vehicles/active
   * @access  Private (Admin/Security Guard)
   */
  static getActiveVehicles = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const vehicleRepository = dataSource.getRepository(Vehicle);

    try {
      // Get only active, non-retired vehicles for movement recording
      // Vehicles in maintenance can still appear in lists but not in movement dropdowns
      const vehicles = await vehicleRepository.find({
        where: {
          isActive: true,
          status: Not('retired'),
        },
        select: ['id', 'licensePlate', 'make', 'model', 'type'],
        order: { licensePlate: 'ASC' },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Active vehicles for movements retrieved successfully',
        data: vehicles,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error retrieving active vehicles:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving active vehicles',
      };
      res.status(500).json(response);
    }
  });
}
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleController = void 0;
const Vehicle_1 = require("../entities/Vehicle");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../config/logger"));
const database_1 = __importDefault(require("../config/database"));
const typeorm_1 = require("typeorm");
class VehicleController {
}
exports.VehicleController = VehicleController;
_a = VehicleController;
VehicleController.getAllVehicles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status, type, department, search, sort = 'createdAt', order = 'desc', } = req.query;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const where = {};
    if (status && typeof status === 'string') {
        where.status = status;
    }
    if (type && typeof type === 'string') {
        where.type = type;
    }
    if (department && typeof department === 'string') {
        where.department = (0, typeorm_1.Like)(`%${department}%`);
    }
    let searchConditions = [];
    if (search && typeof search === 'string') {
        const searchTerm = search.trim();
        searchConditions = [
            { ...where, licensePlate: (0, typeorm_1.Like)(`%${searchTerm}%`) },
            { ...where, make: (0, typeorm_1.Like)(`%${searchTerm}%`) },
            { ...where, model: (0, typeorm_1.Like)(`%${searchTerm}%`) },
            { ...where, assignedDriver: (0, typeorm_1.Like)(`%${searchTerm}%`) },
            { ...where, department: (0, typeorm_1.Like)(`%${searchTerm}%`) },
        ];
    }
    const finalWhere = searchConditions.length > 0 ? searchConditions : where;
    const total = await vehicleRepository.count({
        where: finalWhere,
    });
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const vehicles = await vehicleRepository.find({
        where: finalWhere,
        order: { [sort]: order },
        skip,
        take: limitNum,
    });
    const response = {
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
VehicleController.getVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const vehicle = await vehicleRepository.findOne({
        where: { id },
    });
    if (!vehicle) {
        const response = {
            success: false,
            message: 'Vehicle not found',
        };
        res.status(404).json(response);
        return;
    }
    const response = {
        success: true,
        message: 'Vehicle retrieved successfully',
        data: { vehicle },
    };
    res.status(200).json(response);
});
VehicleController.createVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { licensePlate, make, model, year, color, type = Vehicle_1.VehicleType.CAR, status = Vehicle_1.VehicleStatus.ACTIVE, department, assignedDriver, currentMileage, notes, } = req.body;
    if (!licensePlate) {
        const response = {
            success: false,
            message: 'License plate is required',
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
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const existingVehicle = await vehicleRepository.findOne({
        where: { licensePlate: licensePlate.toUpperCase() },
    });
    if (existingVehicle) {
        const response = {
            success: false,
            message: 'Vehicle with this license plate already exists',
        };
        res.status(409).json(response);
        return;
    }
    const vehicleData = {
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
    logger_1.default.info('Vehicle created', {
        vehicleId: savedVehicle.id,
        licensePlate: savedVehicle.licensePlate,
        createdBy: req.user?.id,
    });
    const response = {
        success: true,
        message: 'Vehicle created successfully',
        data: { vehicle: savedVehicle },
    };
    res.status(201).json(response);
});
VehicleController.updateVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { licensePlate, make, model, year, color, type, status, department, assignedDriver, currentMileage, notes, isActive, } = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const vehicle = await vehicleRepository.findOne({
        where: { id },
    });
    if (!vehicle) {
        const response = {
            success: false,
            message: 'Vehicle not found',
        };
        res.status(404).json(response);
        return;
    }
    if (licensePlate && licensePlate.toUpperCase() !== vehicle.licensePlate) {
        const existingVehicle = await vehicleRepository.findOne({
            where: { licensePlate: licensePlate.toUpperCase() },
        });
        if (existingVehicle) {
            const response = {
                success: false,
                message: 'Vehicle with this license plate already exists',
            };
            res.status(409).json(response);
            return;
        }
    }
    if (licensePlate)
        vehicle.licensePlate = licensePlate.toUpperCase();
    if (make !== undefined)
        vehicle.make = make;
    if (model !== undefined)
        vehicle.model = model;
    if (year !== undefined) {
        if (year) {
            vehicle.year = parseInt(year, 10);
        }
        else {
            delete vehicle.year;
        }
    }
    if (color !== undefined)
        vehicle.color = color;
    if (type !== undefined)
        vehicle.type = type;
    if (status !== undefined)
        vehicle.status = status;
    if (department !== undefined)
        vehicle.department = department;
    if (assignedDriver !== undefined)
        vehicle.assignedDriver = assignedDriver;
    if (currentMileage !== undefined) {
        if (currentMileage) {
            vehicle.currentMileage = parseFloat(currentMileage);
        }
        else {
            delete vehicle.currentMileage;
        }
    }
    if (notes !== undefined)
        vehicle.notes = notes;
    if (isActive !== undefined)
        vehicle.isActive = isActive;
    const updatedVehicle = await vehicleRepository.save(vehicle);
    logger_1.default.info('Vehicle updated', {
        vehicleId: updatedVehicle.id,
        licensePlate: updatedVehicle.licensePlate,
        updatedBy: req.user?.id,
    });
    const response = {
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle: updatedVehicle },
    };
    res.status(200).json(response);
});
VehicleController.deleteVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const vehicle = await vehicleRepository.findOne({
        where: { id },
    });
    if (!vehicle) {
        const response = {
            success: false,
            message: 'Vehicle not found',
        };
        res.status(404).json(response);
        return;
    }
    vehicle.isActive = false;
    vehicle.status = Vehicle_1.VehicleStatus.RETIRED;
    await vehicleRepository.save(vehicle);
    logger_1.default.info('Vehicle deleted (soft)', {
        vehicleId: vehicle.id,
        licensePlate: vehicle.licensePlate,
        deletedBy: req.user?.id,
    });
    const response = {
        success: true,
        message: 'Vehicle deleted successfully',
    };
    res.status(200).json(response);
});
VehicleController.getVehicleStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const totalVehicles = await vehicleRepository.count();
    const activeVehicles = await vehicleRepository.count({
        where: { status: Vehicle_1.VehicleStatus.ACTIVE, isActive: true },
    });
    const inactiveVehicles = await vehicleRepository.count({
        where: { status: Vehicle_1.VehicleStatus.INACTIVE },
    });
    const maintenanceVehicles = await vehicleRepository.count({
        where: { status: Vehicle_1.VehicleStatus.MAINTENANCE },
    });
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
        const totalMovementsQuery = `SELECT COUNT(*) as count FROM vehicle_movements`;
        const totalMovementsResult = await dataSource.query(totalMovementsQuery);
        const totalMovements = totalMovementsResult[0]?.count || 0;
        const totalActiveVehiclesQuery = `SELECT COUNT(*) as count FROM vehicles WHERE isActive = 1 AND status != 'retired'`;
        const totalActiveVehiclesResult = await dataSource.query(totalActiveVehiclesQuery);
        const totalActiveVehiclesCount = totalActiveVehiclesResult[0]?.count || 0;
        logger_1.default.info(`Debug: Total movements: ${totalMovements}, Total active vehicles: ${totalActiveVehiclesCount}`);
        if (totalMovements > 0) {
            const vehiclesOnSiteResult = await dataSource.query(vehiclesOnSiteQuery);
            vehiclesOnSite = vehiclesOnSiteResult[0]?.count || 0;
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
        }
        else {
            vehiclesOffSite = totalActiveVehiclesCount;
        }
        logger_1.default.info(`Vehicle site status: ${vehiclesOnSite} on-site, ${vehiclesOffSite} off-site`);
    }
    catch (error) {
        logger_1.default.error('Error calculating vehicle site status:', error);
        vehiclesOnSite = 0;
        vehiclesOffSite = 0;
    }
    const vehiclesByType = await vehicleRepository
        .createQueryBuilder('vehicle')
        .select('vehicle.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('vehicle.isActive = :isActive', { isActive: true })
        .groupBy('vehicle.type')
        .getRawMany();
    const response = {
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
VehicleController.getActiveVehicles = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    try {
        const vehicles = await vehicleRepository.find({
            where: {
                isActive: true,
                status: (0, typeorm_1.Not)('retired'),
            },
            select: ['id', 'licensePlate', 'make', 'model', 'type'],
            order: { licensePlate: 'ASC' },
        });
        const response = {
            success: true,
            message: 'Active vehicles for movements retrieved successfully',
            data: vehicles,
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Error retrieving active vehicles:', error);
        const response = {
            success: false,
            message: 'Error retrieving active vehicles',
        };
        res.status(500).json(response);
    }
});
//# sourceMappingURL=vehicleController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleMovementController = void 0;
const VehicleMovement_1 = require("../entities/VehicleMovement");
const Vehicle_1 = require("../entities/Vehicle");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../config/logger"));
const database_1 = __importDefault(require("../config/database"));
const typeorm_1 = require("typeorm");
class VehicleMovementController {
}
exports.VehicleMovementController = VehicleMovementController;
_a = VehicleMovementController;
VehicleMovementController.getAllMovements = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, vehicleId, area, movementType, status, driverName, startDate, endDate, search, sort = 'recordedAt', order = 'desc', } = req.query;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const movementRepository = dataSource.getRepository(VehicleMovement_1.VehicleMovement);
    const where = {};
    if (vehicleId && typeof vehicleId === 'string') {
        where.vehicleId = vehicleId;
    }
    if (area && typeof area === 'string') {
        where.area = (0, typeorm_1.Like)(`%${area}%`);
    }
    if (movementType && typeof movementType === 'string') {
        where.movementType = movementType;
    }
    if (status && typeof status === 'string') {
        where.status = status;
    }
    if (driverName && typeof driverName === 'string') {
        where.driverName = (0, typeorm_1.Like)(`%${driverName}%`);
    }
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.recordedAt = (0, typeorm_1.Between)(start, end);
    }
    let searchConditions = [];
    if (search && typeof search === 'string') {
        const searchTerm = search.trim();
        searchConditions = [
            { ...where, driverName: (0, typeorm_1.Like)(`%${searchTerm}%`) },
            { ...where, area: (0, typeorm_1.Like)(`%${searchTerm}%`) },
            { ...where, purpose: (0, typeorm_1.Like)(`%${searchTerm}%`) },
            { ...where, notes: (0, typeorm_1.Like)(`%${searchTerm}%`) },
        ];
    }
    const finalWhere = searchConditions.length > 0 ? searchConditions : where;
    const total = await movementRepository.count({
        where: finalWhere,
    });
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const movements = await movementRepository.find({
        where: finalWhere,
        relations: ['vehicle', 'recordedBy'],
        order: { [sort]: order },
        skip,
        take: limitNum,
    });
    const response = {
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
VehicleMovementController.getMovement = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const movementRepository = dataSource.getRepository(VehicleMovement_1.VehicleMovement);
    const movement = await movementRepository.findOne({
        where: { id },
        relations: ['vehicle', 'recordedBy'],
    });
    if (!movement) {
        const response = {
            success: false,
            message: 'Vehicle movement not found',
        };
        res.status(404).json(response);
        return;
    }
    const response = {
        success: true,
        message: 'Vehicle movement retrieved successfully',
        data: { movement },
    };
    res.status(200).json(response);
});
VehicleMovementController.recordMovement = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { vehicleId, area, movementType, mileage, driverName, driverPhone, driverLicense, purpose, notes, destination, recordedAt, } = req.body;
    if (!vehicleId || !area || !movementType || mileage === undefined || mileage === null || !driverName) {
        const response = {
            success: false,
            message: 'Vehicle ID, area, movement type, mileage, and driver name are required',
        };
        res.status(400).json(response);
        return;
    }
    if (!Object.values(VehicleMovement_1.MovementType).includes(movementType)) {
        const response = {
            success: false,
            message: 'Invalid movement type. Must be "entry" or "exit"',
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
    const movementRepository = dataSource.getRepository(VehicleMovement_1.VehicleMovement);
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const vehicle = await vehicleRepository.findOne({
        where: { id: vehicleId },
    });
    if (!vehicle) {
        const response = {
            success: false,
            message: 'Vehicle not found',
        };
        res.status(404).json(response);
        return;
    }
    if (!vehicle.isActive) {
        const response = {
            success: false,
            message: 'Vehicle is inactive and cannot be used for movements',
        };
        res.status(400).json(response);
        return;
    }
    if (!req.user?.id) {
        const response = {
            success: false,
            message: 'User authentication required',
        };
        res.status(401).json(response);
        return;
    }
    logger_1.default.info('Recording vehicle movement request payload', { payload: req.body });
    logger_1.default.info('Destination debug', {
        destinationProvided: Object.prototype.hasOwnProperty.call(req.body, 'destination'),
        destinationValue: req.body?.destination,
        destinationType: typeof req.body?.destination,
    });
    const movement = new VehicleMovement_1.VehicleMovement();
    movement.vehicleId = vehicleId;
    movement.area = area;
    movement.movementType = movementType;
    movement.mileage = parseFloat(mileage);
    movement.driverName = driverName;
    movement.driverPhone = driverPhone;
    movement.driverLicense = driverLicense;
    movement.purpose = purpose;
    movement.notes = notes;
    if (typeof destination === 'string') {
        const trimmed = destination.trim();
        movement.destination = trimmed.length > 0 ? trimmed : null;
    }
    else if (destination === null || destination === undefined) {
        movement.destination = null;
    }
    else {
        movement.destination = String(destination);
    }
    movement.recordedById = req.user.id;
    movement.recordedAt = recordedAt ? new Date(recordedAt) : new Date();
    movement.status = VehicleMovement_1.MovementStatus.COMPLETED;
    logger_1.default.info('About to save movement', { vehicleId: movement.vehicleId, destination: movement.destination });
    const savedMovement = await movementRepository.save(movement);
    const currentMileage = parseFloat(mileage);
    if (!vehicle.currentMileage || currentMileage > vehicle.currentMileage) {
        vehicle.currentMileage = currentMileage;
        await vehicleRepository.save(vehicle);
    }
    const movementWithRelations = await movementRepository.findOne({
        where: { id: savedMovement.id },
        relations: ['vehicle', 'recordedBy'],
    });
    logger_1.default.info('Vehicle movement recorded', {
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
    const response = {
        success: true,
        message: 'Vehicle movement recorded successfully',
        data: { movement: movementWithRelations },
    };
    res.status(201).json(response);
});
VehicleMovementController.updateMovement = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { area, movementType, mileage, driverName, driverPhone, driverLicense, purpose, notes, status, recordedAt, } = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const movementRepository = dataSource.getRepository(VehicleMovement_1.VehicleMovement);
    const movement = await movementRepository.findOne({
        where: { id },
        relations: ['vehicle'],
    });
    if (!movement) {
        const response = {
            success: false,
            message: 'Vehicle movement not found',
        };
        res.status(404).json(response);
        return;
    }
    if (area !== undefined)
        movement.area = area;
    if (movementType !== undefined)
        movement.movementType = movementType;
    if (mileage !== undefined)
        movement.mileage = parseFloat(mileage);
    if (driverName !== undefined)
        movement.driverName = driverName;
    if (driverPhone !== undefined)
        movement.driverPhone = driverPhone;
    if (driverLicense !== undefined)
        movement.driverLicense = driverLicense;
    if (purpose !== undefined)
        movement.purpose = purpose;
    if (notes !== undefined)
        movement.notes = notes;
    if (req.body.destination !== undefined) {
        const d = req.body.destination;
        if (typeof d === 'string') {
            const trimmed = d.trim();
            movement.destination = trimmed.length > 0 ? trimmed : null;
        }
        else if (d === null) {
            movement.destination = null;
        }
        else {
            movement.destination = String(d);
        }
    }
    if (status !== undefined)
        movement.status = status;
    if (recordedAt !== undefined)
        movement.recordedAt = new Date(recordedAt);
    const updatedMovement = await movementRepository.save(movement);
    const movementWithRelations = await movementRepository.findOne({
        where: { id: updatedMovement.id },
        relations: ['vehicle', 'recordedBy'],
    });
    logger_1.default.info('Vehicle movement updated', {
        movementId: updatedMovement.id,
        vehicleId: movement.vehicleId,
        updatedBy: req.user?.id,
    });
    const response = {
        success: true,
        message: 'Vehicle movement updated successfully',
        data: { movement: movementWithRelations },
    };
    res.status(200).json(response);
});
VehicleMovementController.deleteMovement = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const movementRepository = dataSource.getRepository(VehicleMovement_1.VehicleMovement);
    const movement = await movementRepository.findOne({
        where: { id },
    });
    if (!movement) {
        const response = {
            success: false,
            message: 'Vehicle movement not found',
        };
        res.status(404).json(response);
        return;
    }
    await movementRepository.remove(movement);
    logger_1.default.info('Vehicle movement deleted', {
        movementId: id,
        vehicleId: movement.vehicleId,
        deletedBy: req.user?.id,
    });
    const response = {
        success: true,
        message: 'Vehicle movement deleted successfully',
    };
    res.status(200).json(response);
});
VehicleMovementController.getMovementStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const movementRepository = dataSource.getRepository(VehicleMovement_1.VehicleMovement);
    const { date } = req.query;
    let targetDate;
    if (date && typeof date === 'string') {
        targetDate = new Date(date);
    }
    else {
        targetDate = new Date();
    }
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    logger_1.default.info(`Movement stats date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    logger_1.default.info(`Target date from query: ${date}, parsed as: ${targetDate.toISOString()}`);
    const totalMovements = await movementRepository.count({
        where: {
            recordedAt: (0, typeorm_1.Between)(startOfDay, endOfDay),
        },
    });
    const entriesCount = await movementRepository.count({
        where: {
            movementType: VehicleMovement_1.MovementType.ENTRY,
            recordedAt: (0, typeorm_1.Between)(startOfDay, endOfDay),
        },
    });
    const exitsCount = await movementRepository.count({
        where: {
            movementType: VehicleMovement_1.MovementType.EXIT,
            recordedAt: (0, typeorm_1.Between)(startOfDay, endOfDay),
        },
    });
    logger_1.default.info(`Movement stats for ${date || 'today'}: Total=${totalMovements}, Entries=${entriesCount}, Exits=${exitsCount}`);
    const movementsByArea = await movementRepository
        .createQueryBuilder('movement')
        .select('movement.area', 'area')
        .addSelect('COUNT(*)', 'count')
        .where('movement.recordedAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
        .groupBy('movement.area')
        .orderBy('count', 'DESC')
        .getRawMany();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMovements = await movementRepository.count({
        where: {
            recordedAt: (0, typeorm_1.Between)(sevenDaysAgo, new Date()),
        },
    });
    const response = {
        success: true,
        message: 'Vehicle movement statistics retrieved successfully',
        data: {
            totalMovements,
            entriesCount,
            exitsCount,
            recentMovements,
            todayMovements: totalMovements,
            movementsByArea,
        },
    };
    res.status(200).json(response);
});
VehicleMovementController.getVehicleMovements = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { vehicleId } = req.params;
    const { page = 1, limit = 10, movementType, startDate, endDate, sort = 'recordedAt', order = 'desc', } = req.query;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const movementRepository = dataSource.getRepository(VehicleMovement_1.VehicleMovement);
    const vehicleRepository = dataSource.getRepository(Vehicle_1.Vehicle);
    const vehicle = await vehicleRepository.findOne({
        where: { id: vehicleId },
    });
    if (!vehicle) {
        const response = {
            success: false,
            message: 'Vehicle not found',
        };
        res.status(404).json(response);
        return;
    }
    const where = { vehicleId };
    if (movementType && typeof movementType === 'string') {
        where.movementType = movementType;
    }
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.recordedAt = (0, typeorm_1.Between)(start, end);
    }
    const total = await movementRepository.count({ where });
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const movements = await movementRepository.find({
        where,
        relations: ['recordedBy'],
        order: { [sort]: order },
        skip,
        take: limitNum,
    });
    const response = {
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
//# sourceMappingURL=vehicleMovementController.js.map
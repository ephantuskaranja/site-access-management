import { Response } from 'express';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import database from '../config/database';
import { ExternalVehicleMovement } from '../entities/ExternalVehicleMovement';
import { MovementType, MovementStatus } from '../entities/VehicleMovement';

export class ExternalVehicleMovementController {
  /**
   * @desc    Record external vehicle entry or exit (non-company vehicle)
   * @route   POST /api/external-vehicle-movements
   * @access  Private (Security Guard/Admin)
   */
  static recordMovement = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { vehiclePlate, area, movementType, driverName, recordedAt } = req.body;

    // Basic validation
    if (!vehiclePlate || !area || !movementType || !driverName) {
      const response: ApiResponse = {
        success: false,
        message: 'Vehicle plate, area, movement type, and driver name are required',
      };
      res.status(400).json(response);
      return;
    }

    const type = String(movementType).toLowerCase();
    if (type !== MovementType.ENTRY && type !== MovementType.EXIT) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid movement type. Must be "entry" or "exit"',
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

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const repo = dataSource.getRepository(ExternalVehicleMovement);

    const movement = new ExternalVehicleMovement();
    const normalizedPlate = String(vehiclePlate).toUpperCase().replace(/\s+/g, '').trim();
    movement.vehiclePlate = normalizedPlate;
    movement.area = String(area).trim();
    movement.movementType = type;
    movement.driverName = String(driverName).trim();
    // External vehicles do not capture destination; always persist null
    movement.destination = null;
    movement.recordedById = req.user.id;
    movement.recordedAt = recordedAt ? new Date(recordedAt) : new Date();
    movement.status = MovementStatus.COMPLETED;

    const saved = await repo.save(movement);
    const withRelations = await repo.findOne({ where: { id: saved.id }, relations: ['recordedBy'] });

    logger.info('External vehicle movement recorded', {
      movementId: saved.id,
      vehiclePlate: movement.vehiclePlate,
      movementType: movement.movementType,
      area: movement.area,
      driverName: movement.driverName,
      destination: withRelations?.destination ?? movement.destination ?? null,
      recordedBy: req.user?.id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'External vehicle movement recorded successfully',
      data: { movement: withRelations },
    };
    res.status(201).json(response);
  });
}

import { Request, Response } from 'express';
import { Driver, DriverStatus } from '../entities/Driver';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import database from '../config/database';

export class DriverController {
  /**
   * @desc    Get all drivers (optionally filtered by status)
   * @route   GET /api/drivers
   * @access  Private (Admin/Logistics Manager)
   */
  static getAllDrivers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status } = req.query;

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const repo = dataSource.getRepository(Driver);

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Show most recently created drivers first
    const drivers = await repo.find({ where, order: { createdAt: 'DESC' } });

    const response: ApiResponse = {
      success: true,
      message: 'Drivers retrieved successfully',
      data: { drivers },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Create a new driver
   * @route   POST /api/drivers
   * @access  Private (Admin/Logistics Manager)
   */
  static createDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, status = DriverStatus.ACTIVE, passCode } = req.body;

    if (!name || !passCode || String(passCode).length !== 4) {
      const response: ApiResponse = {
        success: false,
        message: 'Name and a 4-digit pass code are required',
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

    const repo = dataSource.getRepository(Driver);
    const driver = repo.create({
      name: String(name).trim(),
      passCode: String(passCode).trim(),
      status: String(status || DriverStatus.ACTIVE).trim(),
    });

    const saved = await repo.save(driver);

    const response: ApiResponse = {
      success: true,
      message: 'Driver created successfully',
      data: { driver: saved },
    };

    res.status(201).json(response);
  });

  /**
   * @desc    Update driver details
   * @route   PUT /api/drivers/:id
   * @access  Private (Admin/Logistics Manager)
   */
  static updateDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, status, passCode } = req.body;

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const repo = dataSource.getRepository(Driver);
    const driver = await repo.findOne({ where: { id } });

    if (!driver) {
      const response: ApiResponse = {
        success: false,
        message: 'Driver not found',
      };
      res.status(404).json(response);
      return;
    }

    if (name !== undefined) driver.name = String(name).trim();
    if (status !== undefined) driver.status = String(status).trim();
    if (passCode !== undefined) driver.passCode = String(passCode).trim();

    const saved = await repo.save(driver);

    const response: ApiResponse = {
      success: true,
      message: 'Driver updated successfully',
      data: { driver: saved },
    };

    res.status(200).json(response);
  });
}

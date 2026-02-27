import { Request, Response } from 'express';
import { Driver, DriverStatus } from '../entities/Driver';
import { In } from 'typeorm';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import database from '../config/database';

type DriverPayload = {
  name: string;
  status: string;
  passCode: string;
};

function sanitize(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value).trim();
  return typeof value === 'string' ? value.trim() : '';
}

function buildDriverPayload(data: any): DriverPayload {
  const name = sanitize(data.name);
  const passCode = sanitize(data.passCode || data.passcode || data['pass_code']);
  const status = sanitize(data.status || DriverStatus.ACTIVE) || DriverStatus.ACTIVE;
  return { name, passCode, status };
}

function validateDriverPayload(payload: DriverPayload): string | null {
  if (!payload.name) return 'Name is required';
  if (!payload.passCode) return 'Pass code is required';
  if (!/^[0-9]{4}$/.test(payload.passCode)) return 'Pass code must be 4 digits';
  return null;
}

export class DriverController {
  /**
   * @desc    Get all drivers (optionally filtered by status)
   * @route   GET /api/drivers
   * @access  Private (Admin/Logistics Manager)
   */
  static getAllDrivers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status, page = '1', limit = '5', search } = req.query;

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

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 5);
    const qb = repo.createQueryBuilder('driver');
    qb.where('1 = 1');

    if (status && typeof status === 'string') {
      qb.andWhere('driver.status = :status', { status });
    }

    if (search && typeof search === 'string' && search.trim()) {
      qb.andWhere('driver.name LIKE :search', { search: `%${search.trim()}%` });
    }

    const total = await qb.getCount();

    // Show most recently created drivers first
    const drivers = await qb
      .orderBy('driver.createdAt', 'DESC')
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getMany();

    const response: ApiResponse = {
      success: true,
      message: 'Drivers retrieved successfully',
      data: {
        drivers,
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

  /**
   * @desc    Bulk upload drivers via Excel
   * @route   POST /api/drivers/bulk-upload
   * @access  Private (Admin/Logistics Manager)
   */
  static bulkUpload = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const file = (req as any).file;

    if (!file || !file.buffer) {
      const response: ApiResponse = { success: false, message: 'No file uploaded' };
      res.status(400).json(response);
      return;
    }

    let workbook: any;
    try {
      // Lazy require to avoid forcing dependency when unused
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const XLSX = require('xlsx');
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (error) {
      const response: ApiResponse = { success: false, message: 'Invalid Excel file' };
      res.status(400).json(response);
      return;
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      const response: ApiResponse = { success: false, message: 'No sheets found in Excel file' };
      res.status(400).json(response);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx');
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      const response: ApiResponse = { success: false, message: 'No rows found in Excel file' };
      res.status(400).json(response);
      return;
    }

    const parsed: DriverPayload[] = [];
    const rowErrors: string[] = [];
    const updateMessages: string[] = [];
    const seenNames = new Set<string>();

    rows.forEach((row, index) => {
      const payload = buildDriverPayload({
        name: row.name || row.Name || row['NAME'],
        passCode: row.passCode || row.PassCode || row['Pass Code'] || row['PASSCODE'],
        status: row.status || row.Status || row['STATUS'] || row['Status'],
      });

      const error = validateDriverPayload(payload);
      if (error) {
        rowErrors.push(`Row ${index + 2}: ${error}`);
        return;
      }

      const key = payload.name.toLowerCase();
      if (seenNames.has(key)) {
        rowErrors.push(`Row ${index + 2}: Duplicate name within file (${payload.name})`);
        return;
      }

      seenNames.add(key);
      parsed.push(payload);
    });

    if (!parsed.length) {
      const response: ApiResponse = { success: false, message: 'No valid rows to import', data: { errors: rowErrors } };
      res.status(400).json(response);
      return;
    }

    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = { success: false, message: 'Database connection not available' };
      res.status(500).json(response);
      return;
    }

    const repo = dataSource.getRepository(Driver);

    try {
      const existing = await repo.find({ where: { name: In(Array.from(seenNames)) } });
      const existingMap = new Map(existing.map(d => [d.name.toLowerCase(), d]));

      const toInsert: DriverPayload[] = [];
      const toUpdate: Driver[] = [];

      parsed.forEach((drv, idx) => {
        const found = existingMap.get(drv.name.toLowerCase());
        if (found) {
          found.name = drv.name || found.name;
          found.status = drv.status || found.status;
          found.passCode = drv.passCode || found.passCode;
          toUpdate.push(found);
          updateMessages.push(`Row ${idx + 2}: Updated ${found.name}`);
        } else {
          toInsert.push(drv);
        }
      });

      // If nothing to insert and nothing to update, then the file had no new data
      if (!toInsert.length && !toUpdate.length) {
        const response: ApiResponse = {
          success: false,
          message: 'No new drivers imported (duplicates found)',
          data: { errors: rowErrors }
        };
        res.status(400).json(response);
        return;
      }

      const withDefaults = toInsert.map(drv => ({
        name: drv.name,
        status: drv.status || DriverStatus.ACTIVE,
        passCode: drv.passCode,
      }));

      // Batch operations to avoid SQL Server parameter limits
      const columnsPerRow = withDefaults.length ? Object.keys(withDefaults[0]).length : 1;
      const maxSqlParams = 2000;
      const safeChunkSize = Math.max(1, Math.floor(maxSqlParams / columnsPerRow) - 1);

      const insertedDrivers: Driver[] = [];
      for (let i = 0; i < withDefaults.length; i += safeChunkSize) {
        const batch = withDefaults.slice(i, i + safeChunkSize);
        const batchSaved = await repo.save(batch);
        if (Array.isArray(batchSaved)) insertedDrivers.push(...batchSaved);
        else if (batchSaved) insertedDrivers.push(batchSaved as Driver);
      }

      const updatedDrivers: Driver[] = [];
      for (let i = 0; i < toUpdate.length; i += safeChunkSize) {
        const batch = toUpdate.slice(i, i + safeChunkSize);
        const batchSaved = await repo.save(batch);
        if (Array.isArray(batchSaved)) updatedDrivers.push(...batchSaved);
        else if (batchSaved) updatedDrivers.push(batchSaved as Driver);
      }

      const insertedCount = insertedDrivers.length;
      const updatedCount = updatedDrivers.length;
      const skipped = parsed.length - insertedCount - updatedCount;

      const response: ApiResponse<any> = {
        success: true,
        message: `Imported ${insertedCount}, updated ${updatedCount}${skipped > 0 ? `, skipped ${skipped}` : ''}`,
        data: {
          imported: insertedCount,
          updated: updatedCount,
          skipped,
          errors: rowErrors,
          messages: updateMessages,
        }
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = { success: false, message: 'Error importing drivers' };
      res.status(500).json(response);
    }
  });
}

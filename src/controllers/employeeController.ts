import { Request, Response } from 'express';
import { In, Not } from 'typeorm';
import { Employee } from '../entities/Employee';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import database from '../config/database';
import logger from '../config/logger';

type EmployeePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  isActive?: boolean;
};

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildEmployeePayload(data: any): EmployeePayload {
  return {
    firstName: sanitizeString(data.firstName),
    lastName: sanitizeString(data.lastName),
    email: sanitizeString(data.email).toLowerCase(),
    phone: sanitizeString(data.phone || ''),
    department: sanitizeString(data.department),
    position: sanitizeString(data.position || ''),
    isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
  };
}

function validateEmployeePayload(payload: EmployeePayload): string | null {
  if (!payload.firstName) return 'First name is required';
  if (!payload.lastName) return 'Last name is required';
  if (!payload.email) return 'Email is required';
  if (!payload.department) return 'Department is required';
  return null;
}

async function generateNextEmployeeId(employeeRepository: any): Promise<string> {
  // Generate sequential numeric ID with zero-padding
  const latest = await employeeRepository.createQueryBuilder('employee')
    .orderBy('employee.employeeId', 'DESC')
    .select(['employee.employeeId'])
    .getOne();

  const latestNum = latest && latest.employeeId
    ? parseInt(String(latest.employeeId).replace(/\D/g, ''), 10) || 0
    : 0;

  const nextNum = latestNum + 1;
  return `EMP-${String(nextNum).padStart(4, '0')}`;
}

export class EmployeeController {
  /**
   * @desc    Get all active employees
   * @route   GET /api/employees
   * @access  Private (Guard/Admin)
   */
  static getAllEmployees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

    const employeeRepository = dataSource.getRepository(Employee);

    try {
      const includeInactive = String((req.query.includeInactive || '')).toLowerCase() === 'true';

      const employees = await employeeRepository.find({
        where: includeInactive ? {} : { isActive: true },
        order: { firstName: 'ASC', lastName: 'ASC' },
        select: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'department', 'position', 'isActive', 'phone', 'createdAt', 'updatedAt']
      });

      const response: ApiResponse<any> = {
        success: true,
        message: 'Employees retrieved successfully',
        data: { employees },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error fetching employees:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error fetching employees',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Create new employee
   * @route   POST /api/employees
   * @access  Private (Admin only)
   */
  static createEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const payload = buildEmployeePayload(req.body);
    const validationError = validateEmployeePayload(payload);

    if (validationError) {
      const response: ApiResponse = { success: false, message: validationError };
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

    const employeeRepository = dataSource.getRepository(Employee);

    try {
      // Check if employee with same email already exists
      const existingEmployee = await employeeRepository.findOne({ where: { email: payload.email } });

      if (existingEmployee) {
        const response: ApiResponse = {
          success: false,
          message: 'Employee with this email already exists',
        };
        res.status(400).json(response);
        return;
      }

      const nextEmployeeId = await generateNextEmployeeId(employeeRepository);

      // Create new employee
      const employee = employeeRepository.create({ ...payload, employeeId: nextEmployeeId });
      const savedEmployee = await employeeRepository.save(employee);

      // Handle array return from save
      const employeeEntity = Array.isArray(savedEmployee) ? savedEmployee[0] : savedEmployee;

      logger.info(`New employee created: ${employeeEntity.fullName} (${employeeEntity.employeeId})`);

      const response: ApiResponse<any> = {
        success: true,
        message: 'Employee created successfully',
        data: { employee: employeeEntity },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating employee:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error creating employee',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Update employee
   * @route   PUT /api/employees/:id
   * @access  Private (Admin only)
   */
  static updateEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const payload = buildEmployeePayload(req.body);
    const validationError = validateEmployeePayload(payload);

    if (validationError) {
      const response: ApiResponse = { success: false, message: validationError };
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

    const employeeRepository = dataSource.getRepository(Employee);

    try {
      const employee = await employeeRepository.findOne({ where: { id } });
      if (!employee) {
        const response: ApiResponse = { success: false, message: 'Employee not found' };
        res.status(404).json(response);
        return;
      }

      // Check for duplicates on email/employeeId among other records
      const duplicate = await employeeRepository.findOne({
        where: [
          { email: payload.email, id: Not(id) }
        ]
      });

      if (duplicate) {
        const response: ApiResponse = {
          success: false,
          message: 'Another employee already uses this email or employee ID',
        };
        res.status(400).json(response);
        return;
      }

      employee.firstName = payload.firstName;
      employee.lastName = payload.lastName;
      employee.email = payload.email;
      employee.phone = payload.phone ?? '';
      employee.department = payload.department;
      employee.position = payload.position ?? '';
      employee.isActive = typeof payload.isActive === 'boolean' ? payload.isActive : employee.isActive;

      const savedEmployee = await employeeRepository.save(employee);
      const employeeEntity = Array.isArray(savedEmployee) ? savedEmployee[0] : savedEmployee;

      const response: ApiResponse<any> = {
        success: true,
        message: 'Employee updated successfully',
        data: { employee: employeeEntity },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error updating employee:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error updating employee',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Bulk upload employees via Excel
   * @route   POST /api/employees/bulk-upload
   * @access  Private (Admin only)
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
      logger.error('Failed to parse Excel file', error);
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

    const parsed: EmployeePayload[] = [];
    const rowErrors: string[] = [];
    const seenEmails = new Set<string>();

    rows.forEach((row, index) => {
      const payload = buildEmployeePayload({
        firstName: row.firstName || row.FirstName || row['First Name'] || row['first_name'],
        lastName: row.lastName || row.LastName || row['Last Name'] || row['last_name'],
        email: row.email || row.Email || row['E-mail'] || row['EMAIL'],
        phone: row.phone || row.Phone || row['Phone Number'] || row['phone_number'],
        department: row.department || row.Department || row['DEPARTMENT'],
        position: row.position || row.Position || row['POSITION'],
        isActive: typeof row.isActive === 'boolean'
          ? row.isActive
          : String(row.isActive || row.active || row.Active || '').toLowerCase() !== 'false',
      });

      const error = validateEmployeePayload(payload);
      if (error) {
        rowErrors.push(`Row ${index + 2}: ${error}`);
        return;
      }

      if (seenEmails.has(payload.email)) {
        rowErrors.push(`Row ${index + 2}: Duplicate email within file (${payload.email})`);
        return;
      }

      seenEmails.add(payload.email);
      parsed.push(payload);
    });

    if (!parsed.length) {
      const response: ApiResponse = { success: false, message: 'No valid rows to import', data: { errors: rowErrors } };
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

    const employeeRepository = dataSource.getRepository(Employee);

    try {
      // Find existing employees to avoid duplicates
      const existing = await employeeRepository.find({
        where: [
          { email: In(Array.from(seenEmails)) }
        ]
      });

      const existingEmails = new Set(existing.map(e => e.email.toLowerCase()));

      const toInsert = parsed.filter(emp => {
        if (existingEmails.has(emp.email.toLowerCase())) {
          rowErrors.push(`Skipped ${emp.email}: email already exists`);
          return false;
        }
        return true;
      });

      if (!toInsert.length) {
        const response: ApiResponse = {
          success: false,
          message: 'No new employees imported (duplicates found)',
          data: { errors: rowErrors }
        };
        res.status(400).json(response);
        return;
      }

      // Assign incremental employee IDs for this batch
      let currentMaxNum = 0;
      const latest = await employeeRepository.createQueryBuilder('employee')
        .orderBy('employee.employeeId', 'DESC')
        .select(['employee.employeeId'])
        .getOne();

      if (latest && latest.employeeId) {
        currentMaxNum = parseInt(String(latest.employeeId).replace(/\D/g, ''), 10) || 0;
      }

      const withIds = toInsert.map(emp => {
        currentMaxNum += 1;
        return { ...emp, employeeId: `EMP-${String(currentMaxNum).padStart(4, '0')}` };
      });

      const savedEmployees = await employeeRepository.save(withIds);
      const insertedCount = Array.isArray(savedEmployees) ? savedEmployees.length : 1;

      const response: ApiResponse<any> = {
        success: true,
        message: `Imported ${insertedCount} employee${insertedCount === 1 ? '' : 's'}`,
        data: {
          imported: insertedCount,
          skipped: parsed.length - insertedCount,
          errors: rowErrors,
        }
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error during employee bulk upload:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error importing employees',
      };
      res.status(500).json(response);
    }
  });
}
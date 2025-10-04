import { Request, Response } from 'express';
import { Employee } from '../entities/Employee';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import database from '../config/database';
import logger from '../config/logger';

export class EmployeeController {
  /**
   * @desc    Get all active employees
   * @route   GET /api/employees
   * @access  Private (Guard/Admin)
   */
  static getAllEmployees = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
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
      const employees = await employeeRepository.find({
        where: { isActive: true },
        order: { firstName: 'ASC', lastName: 'ASC' },
        select: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'department', 'position']
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
    const employeeData = req.body;

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
      // Check if employee with same email or employeeId already exists
      const existingEmployee = await employeeRepository.findOne({
        where: [
          { email: employeeData.email },
          { employeeId: employeeData.employeeId }
        ]
      });

      if (existingEmployee) {
        const response: ApiResponse = {
          success: false,
          message: 'Employee with this email or employee ID already exists',
        };
        res.status(400).json(response);
        return;
      }

      // Create new employee
      const employee = employeeRepository.create(employeeData);
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
}
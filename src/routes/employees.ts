import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { authenticate, requireGuard, requireReceptionist } from '../middleware/auth';

const router = Router();

// All employee routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all active employees
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           employeeId:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           department:
 *                             type: string
 *                           position:
 *                             type: string
 */
// Allow Admin, Guard, and Receptionist to fetch employees (needed for host selection)
router.get('/', requireReceptionist, EmployeeController.getAllEmployees);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create new employee
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - firstName
 *               - lastName
 *               - email
 *               - department
 *             properties:
 *               employeeId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Employee already exists or validation error
 */
router.post('/', requireGuard, EmployeeController.createEmployee);

export default router;
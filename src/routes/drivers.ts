import { Router } from 'express';
import multer from 'multer';
import { DriverController } from '../controllers/driverController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All driver routes require authentication
router.use(authenticate);

// Allow admin and logistics manager to manage drivers
const requireDriverManager = authorize(UserRole.ADMIN, UserRole.LOGISTICS_MANAGER);

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Drivers retrieved successfully
 */
router.get('/', requireDriverManager, DriverController.getAllDrivers);

/**
 * @swagger
 * /api/drivers:
 *   post:
 *     summary: Create new driver
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - passCode
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               passCode:
 *                 type: string
 *                 description: 4-digit verification code
 *     responses:
 *       201:
 *         description: Driver created successfully
 */
router.post('/', requireDriverManager, DriverController.createDriver);

// Bulk upload drivers via Excel (Admin/Logistics Manager)
router.post('/bulk-upload', requireDriverManager, upload.single('file'), DriverController.bulkUpload);

/**
 * @swagger
 * /api/drivers/{id}:
 *   put:
 *     summary: Update driver
 *     tags: [Drivers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Driver updated successfully
 */
router.put('/:id', requireDriverManager, DriverController.updateDriver);

export default router;

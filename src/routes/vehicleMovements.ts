import { Router } from 'express';
import { VehicleMovementController } from '../controllers/vehicleMovementController';
import { authenticate, requireAdmin, requireGuard } from '../middleware/auth';

const router = Router();

// All vehicle movement routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/vehicle-movements:
 *   get:
 *     summary: Get all vehicle movements with filtering and pagination
 *     tags: [Vehicle Movements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *       - in: query
 *         name: movementType
 *         schema:
 *           type: string
 *           enum: [entry, exit]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *       - in: query
 *         name: driverName
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: recordedAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Vehicle movements retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', requireGuard, VehicleMovementController.getAllMovements);

/**
 * @swagger
 * /api/vehicle-movements/stats:
 *   get:
 *     summary: Get vehicle movement statistics
 *     tags: [Vehicle Movements]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle movement statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', requireGuard, VehicleMovementController.getMovementStats);

/**
 * @swagger
 * /api/vehicle-movements/{id}:
 *   get:
 *     summary: Get single vehicle movement by ID
 *     tags: [Vehicle Movements]
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
 *         description: Vehicle movement retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle movement not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requireGuard, VehicleMovementController.getMovement);

/**
 * @swagger
 * /api/vehicle-movements:
 *   post:
 *     summary: Record vehicle entry or exit
 *     tags: [Vehicle Movements]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - area
 *               - movementType
 *               - mileage
 *               - driverName
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 description: ID of the vehicle
 *               area:
 *                 type: string
 *                 description: Area/site location (e.g., 'North site', 'Main gate')
 *               movementType:
 *                 type: string
 *                 enum: [entry, exit]
 *                 description: Type of movement
 *               mileage:
 *                 type: number
 *                 description: Current vehicle mileage reading
 *               driverName:
 *                 type: string
 *                 description: Name of the driver
 *               driverPhone:
 *                 type: string
 *                 description: Driver's phone number
 *               driverLicense:
 *                 type: string
 *                 description: Driver's license number
 *               purpose:
 *                 type: string
 *                 description: Purpose of the trip
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the movement was recorded (defaults to now)
 *     responses:
 *       201:
 *         description: Vehicle movement recorded successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.post('/', requireGuard, VehicleMovementController.recordMovement);

/**
 * @swagger
 * /api/vehicle-movements/{id}:
 *   put:
 *     summary: Update vehicle movement
 *     tags: [Vehicle Movements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               area:
 *                 type: string
 *               movementType:
 *                 type: string
 *                 enum: [entry, exit]
 *               mileage:
 *                 type: number
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *               driverLicense:
 *                 type: string
 *               purpose:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Vehicle movement updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Vehicle movement not found
 *       500:
 *         description: Server error
 */
router.put('/:id', requireAdmin, VehicleMovementController.updateMovement);

/**
 * @swagger
 * /api/vehicle-movements/{id}:
 *   delete:
 *     summary: Delete vehicle movement
 *     tags: [Vehicle Movements]
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
 *         description: Vehicle movement deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Vehicle movement not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requireAdmin, VehicleMovementController.deleteMovement);

export default router;
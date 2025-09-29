import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';
import { VehicleMovementController } from '../controllers/vehicleMovementController';
import { authenticate, requireAdmin, requireGuard } from '../middleware/auth';

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles with filtering and pagination
 *     tags: [Vehicles]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance, retired]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [car, truck, van, motorcycle, bus, other]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', requireGuard, VehicleController.getAllVehicles);

/**
 * @swagger
 * /api/vehicles/stats:
 *   get:
 *     summary: Get vehicle statistics
 *     tags: [Vehicles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', requireGuard, VehicleController.getVehicleStats);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get single vehicle by ID
 *     tags: [Vehicles]
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
 *         description: Vehicle retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requireGuard, VehicleController.getVehicle);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - licensePlate
 *             properties:
 *               licensePlate:
 *                 type: string
 *                 description: Vehicle license plate number
 *               make:
 *                 type: string
 *                 description: Vehicle manufacturer
 *               model:
 *                 type: string
 *                 description: Vehicle model
 *               year:
 *                 type: integer
 *                 description: Manufacturing year
 *               color:
 *                 type: string
 *                 description: Vehicle color
 *               type:
 *                 type: string
 *                 enum: [car, truck, van, motorcycle, bus, other]
 *                 default: car
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance, retired]
 *                 default: active
 *               department:
 *                 type: string
 *                 description: Department responsible for the vehicle
 *               assignedDriver:
 *                 type: string
 *                 description: Name of assigned driver
 *               currentMileage:
 *                 type: number
 *                 description: Current vehicle mileage
 *               notes:
 *                 type: string
 *                 description: Additional notes about the vehicle
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       409:
 *         description: Conflict - license plate already exists
 *       500:
 *         description: Server error
 */
router.post('/', requireAdmin, VehicleController.createVehicle);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
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
 *               licensePlate:
 *                 type: string
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               color:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [car, truck, van, motorcycle, bus, other]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance, retired]
 *               department:
 *                 type: string
 *               assignedDriver:
 *                 type: string
 *               currentMileage:
 *                 type: number
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Vehicle not found
 *       409:
 *         description: Conflict - license plate already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', requireAdmin, VehicleController.updateVehicle);

/**
 * @swagger
 * /api/vehicles/{vehicleId}/movements:
 *   get:
 *     summary: Get movements for a specific vehicle
 *     tags: [Vehicles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
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
 *         name: movementType
 *         schema:
 *           type: string
 *           enum: [entry, exit]
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
 *     responses:
 *       200:
 *         description: Vehicle movements retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.get('/:vehicleId/movements', requireGuard, VehicleMovementController.getVehicleMovements);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle (soft delete)
 *     tags: [Vehicles]
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
 *         description: Vehicle deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requireAdmin, VehicleController.deleteVehicle);

export default router;
import { Router } from 'express';
import { ExternalVehicleMovementController } from '../controllers/externalVehicleMovementController';
import { authenticate, requireGuard } from '../middleware/auth';

const router = Router();

// Require auth for all endpoints
router.use(authenticate);

/**
 * @swagger
 * /api/external-vehicle-movements:
 *   post:
 *     summary: Record external (non-company) vehicle entry or exit
 *     tags: [External Vehicle Movements]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehiclePlate
 *               - area
 *               - movementType
 *               - driverName
 *             properties:
 *               vehiclePlate:
 *                 type: string
 *                 description: License plate of the external vehicle
 *               area:
 *                 type: string
 *                 description: Area/site location
 *               movementType:
 *                 type: string
 *                 enum: [entry, exit]
 *                 description: Type of movement
 *               driverName:
 *                 type: string
 *                 description: Driver's name
 *               destination:
 *                 type: string
 *                 description: Destination (required for exit, ignored for entry)
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the movement was recorded (defaults to now)
 *     responses:
 *       201:
 *         description: External vehicle movement recorded successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', requireGuard, ExternalVehicleMovementController.recordMovement);

export default router;

import { Router } from 'express';
import { VisitorController } from '../controllers/visitorController';
import { authenticate, requireAdmin, requireGuard } from '../middleware/auth';

const router = Router();

// All visitor routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/visitors:
 *   get:
 *     summary: Get all visitors with filtering and pagination
 *     tags: [Visitors]
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
 *           enum: [pending, approved, rejected, checked_in, checked_out]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visitors retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', VisitorController.getAllVisitors);

/**
 * @swagger
 * /api/visitors/{id}:
 *   get:
 *     summary: Get visitor by ID
 *     tags: [Visitors]
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
 *         description: Visitor retrieved successfully
 *       404:
 *         description: Visitor not found
 */
router.get('/:id', VisitorController.getVisitorById);

/**
 * @swagger
 * /api/visitors:
 *   post:
 *     summary: Create new visitor
 *     tags: [Visitors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phone
 *               - idNumber
 *               - hostEmployee
 *               - hostDepartment
 *               - visitPurpose
 *               - expectedDate
 *               - expectedTime
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               idNumber:
 *                 type: string
 *               company:
 *                 type: string
 *               vehicleNumber:
 *                 type: string
 *               hostEmployee:
 *                 type: string
 *               hostDepartment:
 *                 type: string
 *               visitPurpose:
 *                 type: string
 *                 enum: [meeting, delivery, maintenance, interview, other]
 *               expectedDate:
 *                 type: string
 *                 format: date
 *               expectedTime:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Visitor created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', requireGuard, VisitorController.createVisitor);

/**
 * @swagger
 * /api/visitors/{id}:
 *   put:
 *     summary: Update visitor
 *     tags: [Visitors]
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
 *         description: Visitor updated successfully
 *       404:
 *         description: Visitor not found
 */
router.put('/:id', requireGuard, VisitorController.updateVisitor);

/**
 * @swagger
 * /api/visitors/{id}/approve:
 *   post:
 *     summary: Approve visitor
 *     tags: [Visitors]
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
 *         description: Visitor approved successfully
 *       400:
 *         description: Invalid visitor status
 *       404:
 *         description: Visitor not found
 */
router.post('/:id/approve', requireGuard, VisitorController.approveVisitor);

/**
 * @swagger
 * /api/visitors/{id}/reject:
 *   post:
 *     summary: Reject visitor
 *     tags: [Visitors]
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
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visitor rejected successfully
 *       400:
 *         description: Invalid visitor status or missing reason
 *       404:
 *         description: Visitor not found
 */
router.post('/:id/reject', requireGuard, VisitorController.rejectVisitor);

/**
 * @swagger
 * /api/visitors/{id}/checkin:
 *   post:
 *     summary: Check in visitor
 *     tags: [Visitors]
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
 *         description: Visitor checked in successfully
 *       400:
 *         description: Invalid visitor status
 *       404:
 *         description: Visitor not found
 */
router.post('/:id/checkin', requireGuard, VisitorController.checkInVisitor);

/**
 * @swagger
 * /api/visitors/{id}/checkout:
 *   post:
 *     summary: Check out visitor
 *     tags: [Visitors]
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
 *         description: Visitor checked out successfully
 *       400:
 *         description: Invalid visitor status
 *       404:
 *         description: Visitor not found
 */
router.post('/:id/checkout', requireGuard, VisitorController.checkOutVisitor);

/**
 * @swagger
 * /api/visitors/{id}/qrcode:
 *   get:
 *     summary: Get visitor QR code
 *     tags: [Visitors]
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
 *         description: QR code generated successfully
 *       400:
 *         description: QR code not available
 *       404:
 *         description: Visitor not found
 */
router.get('/:id/qrcode', VisitorController.getVisitorQRCode);

/**
 * @swagger
 * /api/visitors/{id}:
 *   delete:
 *     summary: Delete visitor (Admin only)
 *     tags: [Visitors]
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
 *         description: Visitor deleted successfully
 *       400:
 *         description: Cannot delete checked-in visitors
 *       404:
 *         description: Visitor not found
 */
router.delete('/:id', requireAdmin, VisitorController.deleteVisitor);

export default router;
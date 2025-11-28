import { Router } from 'express';
import { VisitorController } from '../controllers/visitorController';
import { authenticate, requireAdmin, requireGuard, requireReceptionist } from '../middleware/auth';

const router = Router();

// All visitor routes require authentication EXCEPT email approval
router.use((req, res, next) => {
  // Skip authentication for email approval endpoint
  if (req.path === '/approve-email') {
    return next();
  }
  return authenticate(req, res, next);
});

/**
 * @swagger
 * /api/visitors/approve-email:
 *   get:
 *     summary: Handle visitor approval/rejection from email links
 *     tags: [Visitors]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval token from email
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [approve, reject]
 *         description: Action to perform
 *     responses:
 *       200:
 *         description: HTML response with approval result
 *       400:
 *         description: Invalid request or action
 *       404:
 *         description: Visitor or token not found
 */
router.get('/approve-email', VisitorController.handleEmailApproval);

/**
 * @swagger
 * /api/visitors/ready-for-checkin:
 *   get:
 *     summary: Get approved visitors ready for check-in
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
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (defaults to today)
 *     responses:
 *       200:
 *         description: Approved visitors retrieved successfully
 */
router.get('/ready-for-checkin', requireGuard, VisitorController.getApprovedVisitors);

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
 *               autoApprove:
 *                 type: boolean
 *                 description: If true, visitor will be automatically approved upon creation
 *     responses:
 *       201:
 *         description: Visitor created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', requireReceptionist, VisitorController.createVisitor);

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
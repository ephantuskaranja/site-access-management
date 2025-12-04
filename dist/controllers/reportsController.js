"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Visitor_1 = require("../entities/Visitor");
const VehicleMovement_1 = require("../entities/VehicleMovement");
const User_1 = require("../entities/User");
const AccessLog_1 = require("../entities/AccessLog");
class ReportsController {
    async getVisitorReports(req, res) {
        try {
            const { startDate, endDate, reportType } = req.query;
            const ds = database_1.default.getDataSource();
            if (!ds) {
                const response = {
                    success: false,
                    message: 'Database connection failed',
                };
                res.status(500).json(response);
                return;
            }
            const visitorRepository = ds.getRepository(Visitor_1.Visitor);
            let query = visitorRepository.createQueryBuilder('visitor');
            if (startDate && endDate) {
                query = query.where('(visitor.actualCheckIn BETWEEN :startDate AND :endDate OR (visitor.actualCheckIn IS NULL AND visitor.createdAt BETWEEN :startDate AND :endDate))', {
                    startDate,
                    endDate: endDate + ' 23:59:59'
                });
            }
            const visitors = await query.getMany();
            let reportData = {};
            switch (reportType) {
                case 'daily':
                    reportData = this.generateDailyVisitorReport(visitors);
                    break;
                case 'weekly':
                    reportData = this.generateWeeklyVisitorReport(visitors);
                    break;
                case 'monthly':
                    reportData = this.generateMonthlyVisitorReport(visitors);
                    break;
                default:
                    reportData = this.generateGeneralVisitorReport(visitors);
            }
            const response = {
                success: true,
                message: 'Visitor report generated successfully',
                data: reportData,
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error generating visitor report:', error);
            const response = {
                success: false,
                message: 'Failed to generate visitor report',
            };
            res.status(500).json(response);
        }
    }
    async getVehicleMovementReports(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const ds = database_1.default.getDataSource();
            if (!ds) {
                const response = {
                    success: false,
                    message: 'Database connection failed',
                };
                res.status(500).json(response);
                return;
            }
            const movementRepository = ds.getRepository(VehicleMovement_1.VehicleMovement);
            let query = movementRepository.createQueryBuilder('movement')
                .leftJoinAndSelect('movement.vehicle', 'vehicle');
            if (startDate && endDate) {
                query = query.where('movement.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate: endDate + ' 23:59:59'
                });
            }
            const movements = await query.getMany();
            const reportData = this.generateVehicleMovementReport(movements);
            const response = {
                success: true,
                message: 'Vehicle movement report generated successfully',
                data: reportData,
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error generating vehicle movement report:', error);
            const response = {
                success: false,
                message: 'Failed to generate vehicle movement report',
            };
            res.status(500).json(response);
        }
    }
    async getAccessLogReports(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const ds = database_1.default.getDataSource();
            if (!ds) {
                const response = {
                    success: false,
                    message: 'Database connection failed',
                };
                res.status(500).json(response);
                return;
            }
            const accessLogRepository = ds.getRepository(AccessLog_1.AccessLog);
            let query = accessLogRepository.createQueryBuilder('log');
            if (startDate && endDate) {
                query = query.where('log.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate: endDate + ' 23:59:59'
                });
            }
            query = query.orderBy('log.createdAt', 'DESC');
            const logs = await query.getMany();
            const reportData = this.generateAccessLogReport(logs);
            const response = {
                success: true,
                message: 'Access log report generated successfully',
                data: reportData,
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error generating access log report:', error);
            const response = {
                success: false,
                message: 'Failed to generate access log report',
            };
            res.status(500).json(response);
        }
    }
    async getUserActivityReports(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const ds = database_1.default.getDataSource();
            if (!ds) {
                const response = {
                    success: false,
                    message: 'Database connection failed',
                };
                res.status(500).json(response);
                return;
            }
            const userRepository = ds.getRepository(User_1.User);
            const users = await userRepository.find({
                select: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'lastLogin', 'createdAt'],
                order: { createdAt: 'DESC' }
            });
            const accessLogRepository = ds.getRepository(AccessLog_1.AccessLog);
            let logQuery = accessLogRepository.createQueryBuilder('log');
            if (startDate && endDate) {
                logQuery = logQuery.where('log.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate: endDate + ' 23:59:59'
                });
            }
            const reportData = this.generateUserActivityReport(users);
            const response = {
                success: true,
                message: 'User activity report generated successfully',
                data: reportData,
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error generating user activity report:', error);
            const response = {
                success: false,
                message: 'Failed to generate user activity report',
            };
            res.status(500).json(response);
        }
    }
    async getSecurityReports(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const ds = database_1.default.getDataSource();
            if (!ds) {
                const response = {
                    success: false,
                    message: 'Database connection failed',
                };
                res.status(500).json(response);
                return;
            }
            const accessLogRepository = ds.getRepository(AccessLog_1.AccessLog);
            let query = accessLogRepository.createQueryBuilder('log')
                .where('log.action = :action1 OR log.action = :action2 OR log.action = :action3', {
                action1: 'login_failed',
                action2: 'access_denied',
                action3: 'suspicious_activity'
            });
            if (startDate && endDate) {
                query = query.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate: endDate + ' 23:59:59'
                });
            }
            const securityLogs = await query.orderBy('log.createdAt', 'DESC').getMany();
            const reportData = this.generateSecurityReport(securityLogs);
            const response = {
                success: true,
                message: 'Security report generated successfully',
                data: reportData,
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error generating security report:', error);
            const response = {
                success: false,
                message: 'Failed to generate security report',
            };
            res.status(500).json(response);
        }
    }
    generateDailyVisitorReport(visitors) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayVisitors = visitors.filter(v => {
            if (v.actualCheckIn) {
                const checkInDate = new Date(v.actualCheckIn);
                checkInDate.setHours(0, 0, 0, 0);
                return checkInDate.getTime() === today.getTime();
            }
            const visitDate = new Date(v.createdAt);
            visitDate.setHours(0, 0, 0, 0);
            return visitDate.getTime() === today.getTime();
        });
        return {
            date: today.toISOString().split('T')[0],
            totalVisitors: todayVisitors.length,
            checkedIn: todayVisitors.filter(v => v.status === 'checked_in').length,
            checkedOut: todayVisitors.filter(v => v.status === 'checked_out').length,
            pending: todayVisitors.filter(v => v.status === 'pending').length,
            approved: todayVisitors.filter(v => v.status === 'approved').length,
            visitors: todayVisitors.map(v => ({
                id: v.id,
                firstName: v.firstName,
                lastName: v.lastName,
                email: v.email,
                phone: v.phone,
                company: v.company,
                visitPurpose: v.visitPurpose,
                status: v.status,
                checkInTime: v.actualCheckIn,
                checkOutTime: v.actualCheckOut,
                createdAt: v.createdAt
            }))
        };
    }
    generateWeeklyVisitorReport(visitors) {
        const weekData = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dayVisitors = visitors.filter(v => {
                if (v.actualCheckIn) {
                    const checkInDate = new Date(v.actualCheckIn);
                    checkInDate.setHours(0, 0, 0, 0);
                    return checkInDate.getTime() === date.getTime();
                }
                const visitDate = new Date(v.createdAt);
                visitDate.setHours(0, 0, 0, 0);
                return visitDate.getTime() === date.getTime();
            });
            weekData.push({
                date: date.toISOString().split('T')[0],
                total: dayVisitors.length,
                checkedIn: dayVisitors.filter(v => v.status === 'checked_in').length,
                checkedOut: dayVisitors.filter(v => v.status === 'checked_out').length
            });
        }
        return { weeklyData: weekData };
    }
    generateMonthlyVisitorReport(visitors) {
        const monthData = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dayVisitors = visitors.filter(v => {
                if (v.actualCheckIn) {
                    const checkInDate = new Date(v.actualCheckIn);
                    checkInDate.setHours(0, 0, 0, 0);
                    return checkInDate.getTime() === date.getTime();
                }
                const visitDate = new Date(v.createdAt);
                visitDate.setHours(0, 0, 0, 0);
                return visitDate.getTime() === date.getTime();
            });
            monthData.push({
                date: date.toISOString().split('T')[0],
                total: dayVisitors.length
            });
        }
        return { monthlyData: monthData };
    }
    generateGeneralVisitorReport(visitors) {
        const statusCounts = {
            pending: 0,
            approved: 0,
            checked_in: 0,
            checked_out: 0,
            denied: 0
        };
        visitors.forEach(visitor => {
            statusCounts[visitor.status]++;
        });
        return {
            totalVisitors: visitors.length,
            statusBreakdown: statusCounts,
            recentVisitors: visitors.slice(0, 50).map(v => ({
                id: v.id,
                firstName: v.firstName,
                lastName: v.lastName,
                email: v.email,
                phone: v.phone,
                company: v.company,
                visitPurpose: v.visitPurpose,
                status: v.status,
                checkInTime: v.actualCheckIn,
                checkOutTime: v.actualCheckOut,
                createdAt: v.createdAt
            }))
        };
    }
    generateVehicleMovementReport(movements) {
        const movementCounts = {
            entry: 0,
            exit: 0
        };
        movements.forEach(movement => {
            movementCounts[movement.movementType]++;
        });
        const vehicleMovements = movements.reduce((acc, movement) => {
            const vehicleId = movement.vehicle?.id;
            if (vehicleId) {
                if (!acc[vehicleId]) {
                    acc[vehicleId] = {
                        vehicle: movement.vehicle,
                        movements: []
                    };
                }
                acc[vehicleId].movements.push(movement);
            }
            return acc;
        }, {});
        return {
            totalMovements: movements.length,
            movementBreakdown: movementCounts,
            vehicleMovements: Object.values(vehicleMovements),
            recentMovements: movements.slice(0, 20)
        };
    }
    generateAccessLogReport(logs) {
        const actionCounts = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        const visitorActivity = new Map();
        const employeeActivity = new Map();
        logs.forEach(log => {
            const timestamp = log.timestamp;
            if (log.visitorId) {
                const visitorId = log.visitorId;
                const visitorName = log.visitor ? `${log.visitor.firstName} ${log.visitor.lastName}` : `Visitor ${visitorId}`;
                if (!visitorActivity.has(visitorId)) {
                    visitorActivity.set(visitorId, { name: visitorName, lastActivity: timestamp });
                }
                const activity = visitorActivity.get(visitorId);
                activity.lastActivity = timestamp;
                if (log.action === 'check_in' || log.action === 'visitor_checkin') {
                    activity.checkInTime = timestamp;
                }
                else if (log.action === 'check_out' || log.action === 'visitor_checkout') {
                    activity.checkOutTime = timestamp;
                }
            }
            if (log.employeeId) {
                const employeeId = log.employeeId;
                const employeeName = log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : `Employee ${employeeId}`;
                if (!employeeActivity.has(employeeId)) {
                    employeeActivity.set(employeeId, { name: employeeName, lastActivity: timestamp });
                }
                const activity = employeeActivity.get(employeeId);
                activity.lastActivity = timestamp;
                if (log.action === 'check_in' || log.action === 'login') {
                    activity.checkInTime = timestamp;
                }
                else if (log.action === 'check_out' || log.action === 'logout') {
                    activity.checkOutTime = timestamp;
                }
            }
        });
        const visitorActivities = Array.from(visitorActivity.values()).map(activity => ({
            name: activity.name,
            checkInTime: activity.checkInTime,
            checkOutTime: activity.checkOutTime,
            lastActivity: activity.lastActivity
        }));
        const employeeActivities = Array.from(employeeActivity.values()).map(activity => ({
            name: activity.name,
            checkInTime: activity.checkInTime,
            checkOutTime: activity.checkOutTime,
            lastActivity: activity.lastActivity
        }));
        return {
            totalLogs: logs.length,
            actionBreakdown: actionCounts,
            visitorActivities: visitorActivities,
            employeeActivities: employeeActivities,
            recentLogs: logs.slice(0, 50)
        };
    }
    generateUserActivityReport(users) {
        const userActivity = users.map(user => {
            return {
                user: {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    role: user.role,
                    status: user.status
                },
                activityCount: 0,
                lastActivity: null,
                lastLogin: user.lastLogin
            };
        });
        return {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'active').length,
            userActivity: userActivity
        };
    }
    generateSecurityReport(logs) {
        return {
            totalIncidents: logs.length,
            incidentsByType: logs.reduce((acc, log) => {
                acc[log.action] = (acc[log.action] || 0) + 1;
                return acc;
            }, {}),
            recentIncidents: logs.slice(0, 20)
        };
    }
}
exports.ReportsController = ReportsController;
//# sourceMappingURL=reportsController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const User_1 = require("../entities/User");
const authService_1 = require("../services/authService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../config/logger"));
const database_1 = __importDefault(require("../config/database"));
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userData = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    const existingUser = await userRepository.findOne({
        where: { email: userData.email }
    });
    if (existingUser) {
        const response = {
            success: false,
            message: 'User already exists with this email',
        };
        res.status(400).json(response);
        return;
    }
    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    const userEntity = Array.isArray(savedUser) ? savedUser[0] : savedUser;
    const userForToken = {
        id: userEntity.id,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        email: userEntity.email,
        phone: userEntity.phone,
        role: userEntity.role,
        status: userEntity.status,
        employeeId: userEntity.employeeId || '',
        department: userEntity.department || '',
        loginAttempts: userEntity.loginAttempts,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
    };
    const { accessToken, refreshToken } = authService_1.AuthService.generateAuthTokens(userForToken);
    const userResponse = {
        id: userEntity.id,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        email: userEntity.email,
        phone: userEntity.phone,
        role: userEntity.role,
        status: userEntity.status,
        employeeId: userEntity.employeeId || '',
        department: userEntity.department || '',
        loginAttempts: userEntity.loginAttempts,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
    };
    const response = {
        success: true,
        message: 'User registered successfully',
        data: {
            accessToken: accessToken,
            refreshToken,
            user: userResponse,
        },
    };
    logger_1.default.info(`New user registered: ${userEntity.email}`);
    res.status(201).json(response);
});
AuthController.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    const user = await userRepository.findOne({
        where: { email },
        select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'status', 'password', 'loginAttempts', 'lockUntil', 'lastLogin', 'createdAt', 'updatedAt']
    });
    if (!user) {
        const response = {
            success: false,
            message: 'Invalid email or password',
        };
        res.status(401).json(response);
        return;
    }
    if (user.isLocked()) {
        const response = {
            success: false,
            message: 'Account temporarily locked due to too many failed login attempts',
        };
        res.status(423).json(response);
        return;
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 5) {
            user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await userRepository.save(user);
        const response = {
            success: false,
            message: 'Invalid email or password',
        };
        res.status(401).json(response);
        return;
    }
    if (user.loginAttempts && user.loginAttempts > 0) {
        user.loginAttempts = 0;
        delete user.lockUntil;
    }
    user.lastLogin = new Date();
    await userRepository.save(user);
    const { accessToken, refreshToken } = authService_1.AuthService.generateAuthTokens(user);
    const userResponse = user.toJSON();
    const response = {
        success: true,
        message: user.requirePasswordChange ? 'Login successful. Password change required.' : 'Login successful',
        data: {
            accessToken: accessToken,
            refreshToken,
            user: {
                ...userResponse,
                requirePasswordChange: user.requirePasswordChange
            },
        },
    };
    logger_1.default.info(`User logged in: ${user.email}${user.requirePasswordChange ? ' (password change required)' : ''}`);
    res.status(200).json(response);
});
AuthController.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        const response = {
            success: false,
            message: 'Refresh token is required',
        };
        res.status(400).json(response);
        return;
    }
    try {
        const decoded = authService_1.AuthService.verifyToken(refreshToken, require('../config').default.jwt.refreshSecret);
        const dataSource = database_1.default.getDataSource();
        if (!dataSource) {
            const response = {
                success: false,
                message: 'Database connection not available',
            };
            res.status(500).json(response);
            return;
        }
        const userRepository = dataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId }
        });
        if (!user) {
            const response = {
                success: false,
                message: 'Invalid refresh token',
            };
            res.status(401).json(response);
            return;
        }
        const { accessToken, refreshToken: newRefreshToken } = authService_1.AuthService.generateAuthTokens(user);
        const response = {
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: accessToken,
                refreshToken: newRefreshToken,
                user: user.toJSON(),
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            message: 'Invalid refresh token',
        };
        res.status(401).json(response);
    }
});
AuthController.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        const response = {
            success: false,
            message: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
    }
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    const user = await userRepository.findOne({
        where: { id: userId }
    });
    if (!user) {
        const response = {
            success: false,
            message: 'User not found',
        };
        res.status(404).json(response);
        return;
    }
    const response = {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
            user: user.toJSON(),
        },
    };
    res.status(200).json(response);
});
AuthController.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const updates = req.body;
    if (!userId) {
        const response = {
            success: false,
            message: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
    }
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    delete updates.password;
    delete updates.role;
    delete updates.loginAttempts;
    delete updates.lockUntil;
    const result = await userRepository.update(userId, updates);
    if (result.affected === 0) {
        const response = {
            success: false,
            message: 'User not found',
        };
        res.status(404).json(response);
        return;
    }
    const user = await userRepository.findOne({
        where: { id: userId }
    });
    const response = {
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: user.toJSON(),
        },
    };
    logger_1.default.info(`Profile updated for user: ${user.email}`);
    res.status(200).json(response);
});
AuthController.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!userId) {
        const response = {
            success: false,
            message: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
    }
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    const user = await userRepository.findOne({
        where: { id: userId },
        select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'status', 'password', 'createdAt', 'updatedAt']
    });
    if (!user) {
        const response = {
            success: false,
            message: 'User not found',
        };
        res.status(404).json(response);
        return;
    }
    const isCurrentPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isCurrentPasswordCorrect) {
        const response = {
            success: false,
            message: 'Current password is incorrect',
        };
        res.status(400).json(response);
        return;
    }
    user.password = newPassword;
    user.requirePasswordChange = false;
    await userRepository.save(user);
    const response = {
        success: true,
        message: 'Password changed successfully',
    };
    logger_1.default.info(`Password changed for user: ${user.email}`);
    res.status(200).json(response);
});
AuthController.logout = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const response = {
        success: true,
        message: 'Logged out successfully',
    };
    res.status(200).json(response);
});
AuthController.getAllUsers = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    try {
        const users = await userRepository.find({
            select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'status', 'lastLogin', 'createdAt', 'updatedAt'],
            order: { createdAt: 'DESC' }
        });
        const response = {
            success: true,
            message: 'Users retrieved successfully',
            data: users,
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Get all users error:', error);
        const response = {
            success: false,
            message: 'Failed to retrieve users',
        };
        res.status(500).json(response);
    }
});
AuthController.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    try {
        const user = await userRepository.findOne({
            where: { id: id },
            select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'employeeId', 'department', 'status', 'createdAt', 'updatedAt']
        });
        if (!user) {
            const response = {
                success: false,
                message: 'User not found',
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            message: 'User retrieved successfully',
            data: user,
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Get user by ID error:', error);
        const response = {
            success: false,
            message: 'Failed to retrieve user',
        };
        res.status(500).json(response);
    }
});
AuthController.updateUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    try {
        const user = await userRepository.findOne({
            where: { id: id }
        });
        if (!user) {
            const response = {
                success: false,
                message: 'User not found',
            };
            res.status(404).json(response);
            return;
        }
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await userRepository.findOne({
                where: { email: updateData.email }
            });
            if (existingUser) {
                const response = {
                    success: false,
                    message: 'Email already exists',
                };
                res.status(400).json(response);
                return;
            }
        }
        Object.assign(user, {
            firstName: updateData.firstName || user.firstName,
            lastName: updateData.lastName || user.lastName,
            email: updateData.email || user.email,
            phone: updateData.phone || user.phone,
            role: updateData.role || user.role,
            employeeId: updateData.employeeId || user.employeeId,
            department: updateData.department || user.department,
            status: updateData.status || user.status,
            updatedAt: new Date(),
        });
        const updatedUser = await userRepository.save(user);
        const { password, ...userWithoutPassword } = updatedUser;
        const response = {
            success: true,
            message: 'User updated successfully',
            data: userWithoutPassword,
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Update user by ID error:', error);
        const response = {
            success: false,
            message: 'Failed to update user',
        };
        res.status(500).json(response);
    }
});
AuthController.resetUserPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    const DEFAULT_PASSWORD = 'TempPass123!';
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const userRepository = dataSource.getRepository(User_1.User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
        const response = {
            success: false,
            message: 'User not found',
        };
        res.status(404).json(response);
        return;
    }
    user.password = DEFAULT_PASSWORD;
    user.requirePasswordChange = true;
    await userRepository.save(user);
    logger_1.default.info(`Password reset for user ${user.email} by admin ${req.user?.email}`);
    const response = {
        success: true,
        message: 'User password has been reset to default. User will be required to change password on next login.',
        data: {
            newPassword: DEFAULT_PASSWORD
        }
    };
    res.status(200).json(response);
});
//# sourceMappingURL=authController.js.map
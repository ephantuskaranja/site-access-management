import { Request, Response } from 'express';
import { User } from '../entities/User';
import { AuthService } from '../services/authService';
import { ApiResponse, AuthResponse, LoginCredentials, IUser } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import database from '../config/database';

export class AuthController {
  /**
   * @desc    Register a new user
   * @route   POST /api/auth/register
   * @access  Public (Admin only in production)
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData = req.body;

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ 
      where: { email: userData.email } 
    });
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User already exists with this email',
      };
      res.status(400).json(response);
      return;
    }

    // Create new user
    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);

    // Ensure we have a single user entity (TypeORM save can return array or single item)
    const userEntity = Array.isArray(savedUser) ? savedUser[0] : savedUser;

    // Generate tokens - convert entity to plain object
    const userForToken: IUser = {
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

    const { accessToken, refreshToken } = AuthService.generateAuthTokens(userForToken);

    // Remove password from response - create clean object
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

    const response: ApiResponse<AuthResponse> = {
      success: true,
      message: 'User registered successfully',
      data: {
        accessToken: accessToken,
        refreshToken,
        user: userResponse,
      },
    };

    logger.info(`New user registered: ${userEntity.email}`);
    res.status(201).json(response);
  });

  /**
   * @desc    Login user
   * @route   POST /api/auth/login
   * @access  Public
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password }: LoginCredentials = req.body;

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    // Find user with password included
    const user = await userRepository.findOne({ 
      where: { email },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'status', 'password', 'loginAttempts', 'lockUntil', 'lastLogin', 'createdAt', 'updatedAt']
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid email or password',
      };
      res.status(401).json(response);
      return;
    }

    // Check if account is locked
    if (user.isLocked()) {
      const response: ApiResponse = {
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts',
      };
      res.status(423).json(response);
      return;
    }

    // Check password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      // Handle failed login attempt
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await userRepository.save(user);
      
      const response: ApiResponse = {
        success: false,
        message: 'Invalid email or password',
      };
      res.status(401).json(response);
      return;
    }

    // Reset login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      user.loginAttempts = 0;
      delete user.lockUntil;
    }
    
    user.lastLogin = new Date();
    await userRepository.save(user);

    // Generate tokens
    const { accessToken, refreshToken } = AuthService.generateAuthTokens(user);

    // Remove password from response
    const userResponse = user.toJSON();

    const response: ApiResponse<AuthResponse> = {
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

    logger.info(`User logged in: ${user.email}${user.requirePasswordChange ? ' (password change required)' : ''}`);
    res.status(200).json(response);
  });

  /**
   * @desc    Refresh access token
   * @route   POST /api/auth/refresh
   * @access  Public
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const response: ApiResponse = {
        success: false,
        message: 'Refresh token is required',
      };
      res.status(400).json(response);
      return;
    }

    try {
      // Verify refresh token
      const decoded = AuthService.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET!);
      
      // Get database connection and user repository
      const dataSource = database.getDataSource();
      if (!dataSource) {
        const response: ApiResponse = {
          success: false,
          message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
      }

      const userRepository = dataSource.getRepository(User);

      // Find user
      const user = await userRepository.findOne({ 
        where: { id: decoded.userId } 
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid refresh token',
        };
        res.status(401).json(response);
        return;
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = AuthService.generateAuthTokens(user);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: accessToken,
          refreshToken: newRefreshToken,
          user: user.toJSON(),
        },
      };

      res.status(200).json(response);

    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid refresh token',
      };
      res.status(401).json(response);
    }
  });

  /**
   * @desc    Get current user profile
   * @route   GET /api/auth/profile
   * @access  Private
   */
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: user.toJSON(),
      },
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Update user profile
   * @route   PUT /api/auth/profile
   * @access  Private
   */
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.role;
    delete updates.loginAttempts;
    delete updates.lockUntil;

    const result = await userRepository.update(userId, updates);
    
    if (result.affected === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    // Get updated user
    const user = await userRepository.findOne({ 
      where: { id: userId } 
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user!.toJSON(),
      },
    };

    logger.info(`Profile updated for user: ${user!.email}`);
    res.status(200).json(response);
  });

  /**
   * @desc    Change password
   * @route   PUT /api/auth/change-password
   * @access  Private
   */
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    // Find user with password
    const user = await userRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'status', 'password', 'createdAt', 'updatedAt']
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isCurrentPasswordCorrect) {
      const response: ApiResponse = {
        success: false,
        message: 'Current password is incorrect',
      };
      res.status(400).json(response);
      return;
    }

    // Update password and remove forced change requirement
    user.password = newPassword;
    user.requirePasswordChange = false;
    await userRepository.save(user);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    logger.info(`Password changed for user: ${user.email}`);
    res.status(200).json(response);
  });

  /**
   * @desc    Logout user
   * @route   POST /api/auth/logout
   * @access  Private
   */
  static logout = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    res.status(200).json(response);
  });

  /**
   * @desc    Get all users (for admin dashboard)
   * @route   GET /api/auth/users
   * @access  Private (Admin only)
   */
  static getAllUsers = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
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

    const userRepository = dataSource.getRepository(User);

    try {
      // Get all users excluding password
      const users = await userRepository.find({
        select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'status', 'lastLogin', 'createdAt', 'updatedAt'],
        order: { createdAt: 'DESC' }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get all users error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve users',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Get user by ID
   * @route   GET /api/auth/users/:id
   * @access  Private (Admin only)
   */
  static getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({ 
        where: { id: id },
        select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'employeeId', 'department', 'status', 'createdAt', 'updatedAt']
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<IUser> = {
        success: true,
        message: 'User retrieved successfully',
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get user by ID error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve user',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Update user by ID
   * @route   PUT /api/auth/users/:id
   * @access  Private (Admin only)
   */
  static updateUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({ 
        where: { id: id }
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found',
        };
        res.status(404).json(response);
        return;
      }

      // Check if email is being changed and if it already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await userRepository.findOne({ 
          where: { email: updateData.email } 
        });
        if (existingUser) {
          const response: ApiResponse = {
            success: false,
            message: 'Email already exists',
          };
          res.status(400).json(response);
          return;
        }
      }

      // Update user fields
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

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      const response: ApiResponse<IUser> = {
        success: true,
        message: 'User updated successfully',
        data: userWithoutPassword,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update user by ID error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update user',
      };
      res.status(500).json(response);
    }
  });

  /**
   * @desc    Reset user password to default
   * @route   PUT /api/auth/users/:id/reset-password
   * @access  Private (Admin only)
   */
  static resetUserPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.params.id;
    const DEFAULT_PASSWORD = 'TempPass123!';

    // Get database connection and user repository
    const dataSource = database.getDataSource();
    if (!dataSource) {
      const response: ApiResponse = {
        success: false,
        message: 'Database connection not available',
      };
      res.status(500).json(response);
      return;
    }

    const userRepository = dataSource.getRepository(User);

    // Find user
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    // Reset password to default and mark for password change requirement
    user.password = DEFAULT_PASSWORD;
    user.requirePasswordChange = true;
    await userRepository.save(user);

    logger.info(`Password reset for user ${user.email} by admin ${req.user?.email}`);

    const response: ApiResponse = {
      success: true,
      message: 'User password has been reset to default. User will be required to change password on next login.',
      data: {
        newPassword: DEFAULT_PASSWORD
      }
    };
    res.status(200).json(response);
  });
}
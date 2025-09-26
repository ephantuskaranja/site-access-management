# Site Access Management System

A comprehensive site access management system built with Node.js, TypeScript, and Microsoft SQL Server for security guards to control movement in and out of company facilities.

## 🚀 Features

### Authentication & Authorization
- **Role-based Access Control**: Admin, Manager, Security Guard, Employee roles
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Password Security**: Bcrypt hashing with configurable rounds

### Visitor Management
- **Visitor Registration**: Complete visitor information capture
- **Approval Workflow**: Multi-level approval process for visitor access
- **QR Code Generation**: Automatic QR codes for approved visitors
- **Check-in/Check-out**: Real-time entry and exit tracking
- **Photo Management**: Visitor photo upload and storage

### Access Control
- **Real-time Monitoring**: Live tracking of site occupancy
- **Entry/Exit Logging**: Detailed access logs with timestamps
- **Security Alerts**: Automated notifications for security events
- **Access Rules**: Configurable access policies and restrictions

### Reporting & Analytics
- **Dashboard**: Real-time statistics and metrics
- **Access Reports**: Detailed visitor and access analytics
- **Audit Trail**: Complete activity logging
- **Export Options**: CSV/PDF report generation

## 🛠 Technology Stack

- **Backend**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: Microsoft SQL Server with TypeORM
- **Authentication**: JWT with refresh token rotation
- **Validation**: Joi schema validation
- **Real-time**: Socket.io for live updates
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston with file and console outputs
- **Image Processing**: Sharp for photo optimization
- **QR Codes**: QRCode library for visitor codes
- **Email**: Nodemailer for notifications

## 📋 Prerequisites

- Node.js 18.x or higher
- Microsoft SQL Server (2019+) or SQL Server Express
- npm or yarn package manager

## 🔧 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd site-access-management-system
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/site-access-management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=123 Main Street, City, State 12345
COMPANY_ADMIN_EMAIL=admin@company.com

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@company.com

# Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

```bash
# Seed the database with default users and settings
npm run seed
```

This will create:
- **Admin User**: `admin@company.com` / `Admin123!@#`
- **Security Guard**: `guard@company.com` / `Guard123!@#`  
- **Employee**: `employee@company.com` / `Employee123!@#`
- Default company settings

### 4. Start the Application

```bash
# Development mode with hot reload
npm run dev

# Production build and start
npm run build
npm start
```

The server will start on `http://localhost:3000`

### 5. Access the Application

- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 🔐 Default Users

After running the seeder, you can use these accounts:

### Admin Account
- **Email**: admin@company.com
- **Password**: Admin123!@#
- **Permissions**: Full system access

### Security Guard Account  
- **Email**: guard@company.com
- **Password**: Guard123!@#
- **Permissions**: Visitor management, check-in/out

### Employee Account
- **Email**: employee@company.com  
- **Password**: Employee123!@#
- **Permissions**: Basic visitor registration

## 🏗 Project Structure

```
src/
├── config/             # Configuration files
│   ├── index.ts        # Main config
│   ├── database.ts     # MongoDB connection
│   └── logger.ts       # Winston logger setup
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
│   ├── auth.ts         # Authentication middleware
│   ├── validation.ts   # Request validation
│   └── errorHandler.ts # Error handling
├── models/             # Mongoose models
│   ├── User.ts         # User model
│   ├── Visitor.ts      # Visitor model
│   ├── AccessLog.ts    # Access log model
│   └── Alert.ts        # Alert model
├── routes/             # Express routes
│   ├── auth.ts         # Authentication routes
│   ├── visitors.ts     # Visitor management
│   ├── users.ts        # User management
│   └── dashboard.ts    # Dashboard routes
├── services/           # Business logic
├── utils/              # Utility functions
│   ├── swagger.ts      # API documentation
│   ├── email.ts        # Email service
│   └── qrcode.ts       # QR code generation
├── types/              # TypeScript type definitions
└── server.ts           # Main server file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Visitors
- `GET /api/visitors` - Get all visitors (with pagination)
- `POST /api/visitors` - Register new visitor
- `GET /api/visitors/:id` - Get visitor details
- `PUT /api/visitors/:id` - Update visitor
- `POST /api/visitors/:id/approve` - Approve visitor
- `POST /api/visitors/:id/reject` - Reject visitor
- `POST /api/visitors/:id/checkin` - Check-in visitor
- `POST /api/visitors/:id/checkout` - Check-out visitor

### Access Logs
- `GET /api/access-logs` - Get access logs
- `POST /api/access-logs` - Create access log entry

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activities` - Get recent activities

## User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- Generate reports
- View all access logs

### Security Guard
- Visitor check-in/check-out
- Approve/reject visitors
- View visitor details
- Create access logs
- View alerts

### Employee
- Pre-register visitors
- View own visitor requests
- Update visitor details

### Visitor
- View own visit status
- Update personal information

## Development

### Running Tests

```bash
npm test
```

### Code Linting

```bash
npm run lint
npm run lint:fix
```

### Building for Production

```bash
npm run build
```

## Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Security**: Access and refresh tokens with expiration
- **Rate Limiting**: Configurable request rate limits
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: MongoDB native protection
- **CORS Protection**: Configurable CORS policy
- **Security Headers**: Helmet.js security headers
- **Account Lockout**: Protection against brute force attacks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email admin@yourcompany.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app for security guards
- [ ] Facial recognition integration
- [ ] Vehicle tracking system
- [ ] Advanced reporting dashboard
- [ ] Multi-tenant support
- [ ] API rate limiting per user
- [ ] Audit trail functionality
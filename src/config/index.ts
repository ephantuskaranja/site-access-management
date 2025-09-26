import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    type: 'mssql';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    logging: boolean;
    connectionTimeout: number;
    idleTimeout: number;
    maxConnections: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  security: {
    bcryptRounds: number;
    maxLoginAttempts: number;
    lockTime: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  upload: {
    maxFileSize: number;
    uploadDir: string;
  };
  logging: {
    level: string;
    file: string;
  };
  company: {
    name: string;
    address: string;
    adminEmail: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    type: "mssql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "1433", 10),
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "site_access",
    synchronize: process.env.DB_SYNCHRONIZE === "true",
    logging: process.env.DB_LOGGING === "true",
    connectionTimeout: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "15000",
      10
    ),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || "fallback-secret-key",
    expiresIn: process.env.JWT_EXPIRE || "7d",
    refreshSecret:
      process.env.REFRESH_TOKEN_SECRET || "fallback-refresh-secret",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE || "30d",
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
    lockTime: parseInt(process.env.LOCK_TIME || "30", 10) * 60 * 1000, // Convert to milliseconds
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "15", 10) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@company.com",
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10), // 5MB
    uploadDir: process.env.UPLOAD_DIR || "uploads",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "logs/app.log",
  },
  company: {
    name: process.env.COMPANY_NAME || "Company Name",
    address: process.env.COMPANY_ADDRESS || "Company Address",
    adminEmail: process.env.SYSTEM_ADMIN_EMAIL || "admin@company.com",
  },
};

// Validation
if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be defined in production');
}

if (!process.env.DB_PASSWORD && config.nodeEnv === 'production') {
  throw new Error('DB_PASSWORD must be defined in production');
}

export default config;
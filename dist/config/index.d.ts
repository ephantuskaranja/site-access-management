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
    session: {
        idleTimeoutMinutes: number;
    };
}
declare const config: Config;
export default config;

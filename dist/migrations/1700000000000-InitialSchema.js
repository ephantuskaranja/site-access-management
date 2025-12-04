"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1700000000000 = void 0;
class InitialSchema1700000000000 {
    constructor() {
        this.name = 'InitialSchema1700000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uniqueidentifier NOT NULL CONSTRAINT "DF_users_id" DEFAULT NEWID(),
        "firstName" nvarchar(50) NOT NULL,
        "lastName" nvarchar(50) NOT NULL,
        "email" nvarchar(100) NOT NULL,
        "phone" nvarchar(20) NOT NULL,
        "role" nvarchar(20) NOT NULL CONSTRAINT "DF_users_role" DEFAULT 'visitor',
        "status" nvarchar(20) NOT NULL CONSTRAINT "DF_users_status" DEFAULT 'active',
        "password" nvarchar(255),
        "employeeId" nvarchar(50),
        "department" nvarchar(100),
        "profileImage" nvarchar(255),
        "loginAttempts" int NOT NULL CONSTRAINT "DF_users_loginAttempts" DEFAULT 0,
        "lockUntil" datetime2,
        "lastLogin" datetime2,
        "createdAt" datetime2 NOT NULL CONSTRAINT "DF_users_createdAt" DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_users_updatedAt" DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_employeeId" UNIQUE ("employeeId")
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_employeeId" ON "users" ("employeeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role_status" ON "users" ("role", "status")`);
        await queryRunner.query(`
      CREATE TABLE "visitors" (
        "id" uniqueidentifier NOT NULL CONSTRAINT "DF_visitors_id" DEFAULT NEWID(),
        "firstName" nvarchar(50) NOT NULL,
        "lastName" nvarchar(50) NOT NULL,
        "email" nvarchar(100),
        "phone" nvarchar(20) NOT NULL,
        "idNumber" nvarchar(50) NOT NULL,
        "company" nvarchar(100),
        "vehicleNumber" nvarchar(20),
        "photo" nvarchar(255),
        "qrCode" nvarchar(255),
        "hostEmployee" nvarchar(100) NOT NULL,
        "hostDepartment" nvarchar(100) NOT NULL,
        "visitPurpose" nvarchar(50) NOT NULL,
        "expectedDate" date NOT NULL,
        "expectedTime" nvarchar(5) NOT NULL,
        "actualCheckIn" datetime2,
        "actualCheckOut" datetime2,
        "status" nvarchar(20) NOT NULL CONSTRAINT "DF_visitors_status" DEFAULT 'pending',
        "approvedById" uniqueidentifier,
        "rejectionReason" nvarchar(500),
        "notes" nvarchar(500),
        "createdAt" datetime2 NOT NULL CONSTRAINT "DF_visitors_createdAt" DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_visitors_updatedAt" DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_visitors_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_visitors_idNumber" UNIQUE ("idNumber"),
        CONSTRAINT "FK_visitors_approvedBy" FOREIGN KEY ("approvedById") REFERENCES "users"("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_visitors_phone" ON "visitors" ("phone")`);
        await queryRunner.query(`CREATE INDEX "IDX_visitors_status" ON "visitors" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_visitors_expectedDate" ON "visitors" ("expectedDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_visitors_hostEmployee" ON "visitors" ("hostEmployee")`);
        await queryRunner.query(`CREATE INDEX "IDX_visitors_hostDepartment" ON "visitors" ("hostDepartment")`);
        await queryRunner.query(`
      CREATE TABLE "access_logs" (
        "id" uniqueidentifier NOT NULL CONSTRAINT "DF_access_logs_id" DEFAULT NEWID(),
        "visitorId" uniqueidentifier,
        "employeeId" uniqueidentifier,
        "guardId" uniqueidentifier NOT NULL,
        "action" nvarchar(50) NOT NULL,
        "location" nvarchar(100) NOT NULL CONSTRAINT "DF_access_logs_location" DEFAULT 'Main Gate',
        "timestamp" datetime2 NOT NULL CONSTRAINT "DF_access_logs_timestamp" DEFAULT CURRENT_TIMESTAMP,
        "notes" nvarchar(500),
        "ipAddress" nvarchar(45),
        "userAgent" nvarchar(500),
        "createdAt" datetime2 NOT NULL CONSTRAINT "DF_access_logs_createdAt" DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_access_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_access_logs_visitor" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id"),
        CONSTRAINT "FK_access_logs_employee" FOREIGN KEY ("employeeId") REFERENCES "users"("id"),
        CONSTRAINT "FK_access_logs_guard" FOREIGN KEY ("guardId") REFERENCES "users"("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_access_logs_timestamp" ON "access_logs" ("timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_access_logs_visitor_timestamp" ON "access_logs" ("visitorId", "timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_access_logs_guard_timestamp" ON "access_logs" ("guardId", "timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_access_logs_action_timestamp" ON "access_logs" ("action", "timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_access_logs_location_timestamp" ON "access_logs" ("location", "timestamp")`);
        await queryRunner.query(`
      CREATE TABLE "alerts" (
        "id" uniqueidentifier NOT NULL CONSTRAINT "DF_alerts_id" DEFAULT NEWID(),
        "type" nvarchar(50) NOT NULL,
        "severity" nvarchar(20) NOT NULL,
        "title" nvarchar(200) NOT NULL,
        "message" nvarchar(1000) NOT NULL,
        "userId" uniqueidentifier,
        "isRead" bit NOT NULL CONSTRAINT "DF_alerts_isRead" DEFAULT 0,
        "actionRequired" bit NOT NULL CONSTRAINT "DF_alerts_actionRequired" DEFAULT 0,
        "metadata" ntext,
        "createdAt" datetime2 NOT NULL CONSTRAINT "DF_alerts_createdAt" DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_alerts_updatedAt" DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_alerts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alerts_user" FOREIGN KEY ("userId") REFERENCES "users"("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_user_createdAt" ON "alerts" ("userId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_type_createdAt" ON "alerts" ("type", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_severity_createdAt" ON "alerts" ("severity", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_isRead_createdAt" ON "alerts" ("isRead", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_actionRequired_createdAt" ON "alerts" ("actionRequired", "createdAt")`);
        await queryRunner.query(`
      CREATE TABLE "company_settings" (
        "id" uniqueidentifier NOT NULL CONSTRAINT "DF_company_settings_id" DEFAULT NEWID(),
        "companyName" nvarchar(100) NOT NULL,
        "address" nvarchar(500) NOT NULL,
        "phone" nvarchar(20) NOT NULL,
        "email" nvarchar(100) NOT NULL,
        "logo" nvarchar(255),
        "workingHours" ntext NOT NULL,
        "maxVisitorDuration" int NOT NULL CONSTRAINT "DF_company_settings_maxVisitorDuration" DEFAULT 480,
        "requirePreApproval" bit NOT NULL CONSTRAINT "DF_company_settings_requirePreApproval" DEFAULT 1,
        "allowMultipleEntries" bit NOT NULL CONSTRAINT "DF_company_settings_allowMultipleEntries" DEFAULT 0,
        "enableQRCode" bit NOT NULL CONSTRAINT "DF_company_settings_enableQRCode" DEFAULT 1,
        "enableEmailNotifications" bit NOT NULL CONSTRAINT "DF_company_settings_enableEmailNotifications" DEFAULT 1,
        "emergencyContact" nvarchar(20) NOT NULL,
        "updatedById" uniqueidentifier NOT NULL,
        "createdAt" datetime2 NOT NULL CONSTRAINT "DF_company_settings_createdAt" DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_company_settings_updatedAt" DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_company_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_company_settings_updatedBy" FOREIGN KEY ("updatedById") REFERENCES "users"("id")
      )
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "company_settings"`);
        await queryRunner.query(`DROP TABLE "alerts"`);
        await queryRunner.query(`DROP TABLE "access_logs"`);
        await queryRunner.query(`DROP TABLE "visitors"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
exports.InitialSchema1700000000000 = InitialSchema1700000000000;
//# sourceMappingURL=1700000000000-InitialSchema.js.map
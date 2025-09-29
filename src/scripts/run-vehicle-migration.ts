import { AppDataSource } from '../config/ormconfig';

async function runVehicleMigration() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      console.log('Creating vehicles table...');
      
      // Create vehicles table
      await queryRunner.query(`
        CREATE TABLE "vehicles" (
          "id" uniqueidentifier NOT NULL DEFAULT NEWID(),
          "licensePlate" nvarchar(20) NOT NULL,
          "make" nvarchar(50),
          "model" nvarchar(50),
          "year" int,
          "color" nvarchar(30),
          "type" nvarchar(20) NOT NULL DEFAULT 'car',
          "status" nvarchar(20) NOT NULL DEFAULT 'active',
          "department" nvarchar(100),
          "assignedDriver" nvarchar(100),
          "currentMileage" decimal(10,2),
          "notes" ntext,
          "isActive" bit NOT NULL DEFAULT 1,
          "createdAt" datetime2 NOT NULL DEFAULT getdate(),
          "updatedAt" datetime2 NOT NULL DEFAULT getdate(),
          CONSTRAINT "PK_vehicles" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_vehicles_licensePlate" UNIQUE ("licensePlate"),
          CONSTRAINT "CHK_vehicles_type" CHECK ("type" IN ('car', 'truck', 'van', 'motorcycle', 'bus', 'other')),
          CONSTRAINT "CHK_vehicles_status" CHECK ("status" IN ('active', 'inactive', 'maintenance', 'retired'))
        )
      `);

      console.log('Creating vehicle_movements table...');
      
      // Create vehicle_movements table
      await queryRunner.query(`
        CREATE TABLE "vehicle_movements" (
          "id" uniqueidentifier NOT NULL DEFAULT NEWID(),
          "vehicleId" uniqueidentifier NOT NULL,
          "area" nvarchar(100) NOT NULL,
          "movementType" nvarchar(20) NOT NULL,
          "status" nvarchar(20) NOT NULL DEFAULT 'completed',
          "mileage" decimal(10,2) NOT NULL,
          "driverName" nvarchar(100) NOT NULL,
          "driverPhone" nvarchar(20),
          "driverLicense" nvarchar(100),
          "purpose" ntext,
          "notes" ntext,
          "recordedById" uniqueidentifier NOT NULL,
          "recordedAt" datetime2 NOT NULL,
          "createdAt" datetime2 NOT NULL DEFAULT getdate(),
          "updatedAt" datetime2 NOT NULL DEFAULT getdate(),
          CONSTRAINT "PK_vehicle_movements" PRIMARY KEY ("id"),
          CONSTRAINT "CHK_vehicle_movements_movementType" CHECK ("movementType" IN ('entry', 'exit')),
          CONSTRAINT "CHK_vehicle_movements_status" CHECK ("status" IN ('pending', 'completed', 'cancelled')),
          CONSTRAINT "FK_vehicle_movements_vehicle" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_vehicle_movements_user" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE NO ACTION
        )
      `);

      console.log('Creating indexes for vehicles...');
      
      // Create indexes for vehicles
      await queryRunner.query(`CREATE INDEX "IDX_vehicles_licensePlate" ON "vehicles" ("licensePlate")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicles_status" ON "vehicles" ("status")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicles_type" ON "vehicles" ("type")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicles_isActive" ON "vehicles" ("isActive")`);

      console.log('Creating indexes for vehicle_movements...');
      
      // Create indexes for vehicle_movements
      await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_vehicleId" ON "vehicle_movements" ("vehicleId")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_area" ON "vehicle_movements" ("area")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_movementType" ON "vehicle_movements" ("movementType")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_status" ON "vehicle_movements" ("status")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_recordedAt" ON "vehicle_movements" ("recordedAt")`);
      await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_recordedById" ON "vehicle_movements" ("recordedById")`);

      console.log('✅ Vehicle management tables created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating vehicle tables:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
}

// Run the migration
runVehicleMigration();
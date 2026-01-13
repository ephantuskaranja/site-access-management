import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendVisitPurposeWithPersonal1700000000015 implements MigrationInterface {
  name = 'ExtendVisitPurposeWithPersonal1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find and drop any existing visitPurpose check constraint
    const constraints = await queryRunner.query(`
      SELECT name 
      FROM sys.check_constraints 
      WHERE parent_object_id = OBJECT_ID('visitors') 
      AND definition LIKE '%visitPurpose%'
    `);

    if (constraints.length > 0) {
      const constraintName = constraints[0].name;
      await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "${constraintName}"`);
    }

    // Recreate constraint including the new 'personal' purpose
    await queryRunner.query(`
      ALTER TABLE "visitors" 
      ADD CONSTRAINT "CHK_visitors_visitPurpose" 
      CHECK ("visitPurpose" IN (
        'meeting', 
        'delivery', 
        'maintenance', 
        'interview', 
        'pig_delivery', 
        'contract_works', 
        'pig_order', 
        'shop',
        'payment_collection',
        'personal',
        'other'
      ))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the extended constraint
    await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "CHK_visitors_visitPurpose"`);

    // Restore previous constraint (without 'personal')
    await queryRunner.query(`
      ALTER TABLE "visitors" 
      ADD CONSTRAINT "CHK_visitors_visitPurpose" 
      CHECK ("visitPurpose" IN (
        'meeting', 
        'delivery', 
        'maintenance', 
        'interview', 
        'pig_delivery', 
        'contract_works', 
        'pig_order', 
        'shop',
        'payment_collection',
        'other'
      ))
    `);
  }
}

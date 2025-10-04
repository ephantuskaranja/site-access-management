import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVisitPurposeEnum1700000000006 implements MigrationInterface {
  name = 'UpdateVisitPurposeEnum1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, find and drop the existing visit purpose check constraint
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

    // Add new constraint with updated visit purposes including the new ones
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
        'other'
      ))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new constraint
    await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "CHK_visitors_visitPurpose"`);
    
    // Restore original constraint (without the new visit purposes)
    await queryRunner.query(`
      ALTER TABLE "visitors" 
      ADD CONSTRAINT "CHK_visitors_visitPurpose_original" 
      CHECK ("visitPurpose" IN (
        'meeting', 
        'delivery', 
        'maintenance', 
        'interview', 
        'other'
      ))
    `);
  }
}
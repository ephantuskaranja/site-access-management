import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendVisitPurposeEnum1700000000007 implements MigrationInterface {
  name = 'ExtendVisitPurposeEnum1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find and drop all existing visit purpose check constraints on dbo.visitors
    const constraints: Array<{ name: string }> = await queryRunner.query(`
      SELECT name 
      FROM sys.check_constraints 
      WHERE parent_object_id = OBJECT_ID('dbo.visitors') 
      AND definition LIKE '%visitPurpose%'
    `);

    for (const row of constraints) {
      const constraintName = row.name;
      await queryRunner.query(`ALTER TABLE "dbo"."visitors" DROP CONSTRAINT "${constraintName}"`);
    }

    // Add new constraint including 'shop' and 'payment_collection'
    await queryRunner.query(`
      ALTER TABLE "dbo"."visitors" 
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the extended constraint
    await queryRunner.query(`ALTER TABLE "dbo"."visitors" DROP CONSTRAINT "CHK_visitors_visitPurpose"`);

    // Recreate prior constraint without the new values
    await queryRunner.query(`
      ALTER TABLE "dbo"."visitors" 
      ADD CONSTRAINT "CHK_visitors_visitPurpose_original" 
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
}

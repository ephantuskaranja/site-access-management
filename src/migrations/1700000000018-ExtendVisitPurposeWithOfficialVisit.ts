import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendVisitPurposeWithOfficialVisit1700000000018 implements MigrationInterface {
  name = 'ExtendVisitPurposeWithOfficialVisit1700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const constraints: Array<{ name: string }> = await queryRunner.query(`
      SELECT name
      FROM sys.check_constraints
      WHERE (
        parent_object_id = OBJECT_ID('visitors')
        OR parent_object_id = OBJECT_ID('dbo.visitors')
      )
      AND definition LIKE '%visitPurpose%'
    `);

    for (const row of constraints) {
      await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "${row.name}"`);
    }

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
        'official_visit',
        'personal',
        'other'
      ))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "CHK_visitors_visitPurpose"`);

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
}

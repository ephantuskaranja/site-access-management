import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteToVisitors1700000000020 implements MigrationInterface {
  name = 'AddSiteToVisitors1700000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "visitors" ADD "site" nvarchar(100)`);
    await queryRunner.query(`CREATE INDEX "IDX_visitors_site" ON "visitors" ("site")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_visitors_site" ON "visitors"`);
    await queryRunner.query(`ALTER TABLE "visitors" DROP COLUMN "site"`);
  }
}

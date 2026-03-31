import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixBrokenQRCodes1700000000021 implements MigrationInterface {
  name = 'FixBrokenQRCodes1700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Null out any QR codes that were generated with undefined id (VISITOR:undefined:...)
    // They will be regenerated on the next approval/save action.
    await queryRunner.query(`
      UPDATE "visitors"
      SET "qrCode" = NULL
      WHERE "qrCode" LIKE 'VISITOR:undefined:%'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally no rollback — bad data should not be restored.
  }
}

import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddVisitorFromLocation1700000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "visitors",
      new TableColumn({
        name: "visitorFromLocation",
        type: "nvarchar",
        length: "100",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("visitors", "visitorFromLocation");
  }
}

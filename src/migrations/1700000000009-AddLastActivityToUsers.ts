import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddLastActivityToUsers1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "lastActivity",
        type: "datetime2",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("users", "lastActivity");
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageAiMetrics1770700000000 implements MigrationInterface {
  name = 'AddMessageAiMetrics1770700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" ADD "aiMetrics" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "aiMetrics"`);
  }
}

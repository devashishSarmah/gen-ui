import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1738713600000 implements MigrationInterface {
  name = 'InitialSchema1738713600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    // Create conversations table
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "title" character varying(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastMessageAt" TIMESTAMP,
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_userId_lastMessageAt" ON "conversations" ("userId", "lastMessageAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "conversations"
      ADD CONSTRAINT "FK_conversations_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversationId" uuid NOT NULL,
        "role" character varying(20) NOT NULL,
        "content" text,
        "uiSchema" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_conversationId_createdAt" ON "messages" ("conversationId", "createdAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_conversationId"
      FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Create interaction_events table
    await queryRunner.query(`
      CREATE TABLE "interaction_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversationId" uuid NOT NULL,
        "messageId" uuid NOT NULL,
        "eventType" character varying(50) NOT NULL,
        "eventData" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interaction_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_interaction_events_conversationId_createdAt" ON "interaction_events" ("conversationId", "createdAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "interaction_events"
      ADD CONSTRAINT "FK_interaction_events_conversationId"
      FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "interaction_events"
      ADD CONSTRAINT "FK_interaction_events_messageId"
      FOREIGN KEY ("messageId") REFERENCES "messages"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Create state_snapshots table
    await queryRunner.query(`
      CREATE TABLE "state_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversationId" uuid NOT NULL,
        "snapshotData" jsonb NOT NULL,
        "eventSequenceNumber" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_state_snapshots_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_state_snapshots_conversationId_eventSequenceNumber" ON "state_snapshots" ("conversationId", "eventSequenceNumber")
    `);

    await queryRunner.query(`
      ALTER TABLE "state_snapshots"
      ADD CONSTRAINT "FK_state_snapshots_conversationId"
      FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Create ai_provider_configs table
    await queryRunner.query(`
      CREATE TABLE "ai_provider_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "providerName" character varying(100) NOT NULL,
        "capabilities" jsonb NOT NULL,
        "config" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_provider_configs_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (due to foreign key constraints)
    await queryRunner.query(`DROP TABLE "ai_provider_configs"`);
    await queryRunner.query(`DROP TABLE "state_snapshots"`);
    await queryRunner.query(`DROP TABLE "interaction_events"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

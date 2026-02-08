import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoUpdate1770569511809 implements MigrationInterface {
    name = 'AutoUpdate1770569511809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_userId"`);
        await queryRunner.query(`ALTER TABLE "state_snapshots" DROP CONSTRAINT "FK_state_snapshots_conversationId"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversationId"`);
        await queryRunner.query(`ALTER TABLE "interaction_events" DROP CONSTRAINT "FK_interaction_events_conversationId"`);
        await queryRunner.query(`ALTER TABLE "interaction_events" DROP CONSTRAINT "FK_interaction_events_messageId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversations_userId_lastMessageAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_state_snapshots_conversationId_eventSequenceNumber"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_messages_conversationId_createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_interaction_events_conversationId_createdAt"`);
        await queryRunner.query(`ALTER TABLE "interaction_events" ADD "eventSequenceNumber" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "interaction_events" ADD "streamId" character varying(255)`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_67899bc4893583c7b9e581957c" ON "conversations" ("userId", "lastMessageAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_bbd83c5be7d136f03f1a449e30" ON "state_snapshots" ("conversationId", "eventSequenceNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_751332fc6cc6fc576c6975cd07" ON "messages" ("conversationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_1eb680dcce91bd963d55f5cdfe" ON "interaction_events" ("conversationId", "eventSequenceNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_6da3c8e837f7a880b0f2aef4ca" ON "interaction_events" ("conversationId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_a9b3b5d51da1c75242055338b59" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "state_snapshots" ADD CONSTRAINT "FK_23ef6df172c4f12ae87979b0a0e" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interaction_events" ADD CONSTRAINT "FK_92af960cacce88548b6bbb30255" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interaction_events" ADD CONSTRAINT "FK_d037f7bbc2fd6b7b599619ad148" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interaction_events" DROP CONSTRAINT "FK_d037f7bbc2fd6b7b599619ad148"`);
        await queryRunner.query(`ALTER TABLE "interaction_events" DROP CONSTRAINT "FK_92af960cacce88548b6bbb30255"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`);
        await queryRunner.query(`ALTER TABLE "state_snapshots" DROP CONSTRAINT "FK_23ef6df172c4f12ae87979b0a0e"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_a9b3b5d51da1c75242055338b59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6da3c8e837f7a880b0f2aef4ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1eb680dcce91bd963d55f5cdfe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_751332fc6cc6fc576c6975cd07"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbd83c5be7d136f03f1a449e30"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_67899bc4893583c7b9e581957c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`ALTER TABLE "interaction_events" DROP COLUMN "streamId"`);
        await queryRunner.query(`ALTER TABLE "interaction_events" DROP COLUMN "eventSequenceNumber"`);
        await queryRunner.query(`CREATE INDEX "IDX_interaction_events_conversationId_createdAt" ON "interaction_events" ("conversationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_messages_conversationId_createdAt" ON "messages" ("conversationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_state_snapshots_conversationId_eventSequenceNumber" ON "state_snapshots" ("conversationId", "eventSequenceNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_conversations_userId_lastMessageAt" ON "conversations" ("userId", "lastMessageAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "interaction_events" ADD CONSTRAINT "FK_interaction_events_messageId" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interaction_events" ADD CONSTRAINT "FK_interaction_events_conversationId" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversationId" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "state_snapshots" ADD CONSTRAINT "FK_state_snapshots_conversationId" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

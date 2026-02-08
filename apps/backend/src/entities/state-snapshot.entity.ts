import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('state_snapshots')
@Index(['conversationId', 'eventSequenceNumber'])
export class StateSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  conversationId!: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @Column({ type: 'jsonb', nullable: false })
  snapshotData!: any;

  @Column({ type: 'integer', nullable: false })
  eventSequenceNumber!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}

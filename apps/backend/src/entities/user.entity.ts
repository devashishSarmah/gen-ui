import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', length: 50, default: 'local' })
  provider!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index()
  githubId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index()
  googleId?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}

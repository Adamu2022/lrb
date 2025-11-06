import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'action', type: 'varchar', length: 10 })
  action: AuditAction;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: number;

  @Column({ name: 'changes', type: 'jsonb', nullable: true })
  changes: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
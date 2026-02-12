import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../shared/ds-icon.component';

export interface FlowNode {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  type?: 'start' | 'end' | 'process' | 'decision';
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

@Component({
  selector: 'app-flow-diagram',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flow-diagram">
      <div class="flow-container">
        <div *ngFor="let node of nodes; let i = index; let last = last" class="flow-item">
          <div 
            class="flow-node"
            [class.start]="node.type === 'start'"
            [class.end]="node.type === 'end'"
            [class.process]="node.type === 'process' || !node.type"
            [class.decision]="node.type === 'decision'"
          >
            <div class="node-icon" *ngIf="node.icon"><ds-icon [name]="node.icon" [size]="18"></ds-icon></div>
            <div class="node-content">
              <div class="node-label">{{ node.label }}</div>
              <div class="node-description" *ngIf="node.description">{{ node.description }}</div>
            </div>
          </div>
          <div class="flow-arrow" *ngIf="!last">
            <div class="arrow-line"></div>
            <div class="arrow-head">↓</div>
            <div class="arrow-label" *ngIf="getConnectionLabel(node.id)">
              {{ getConnectionLabel(node.id) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flow-diagram {
      width: 100%;
      overflow-x: auto;
      padding: 1rem;
    }

    .flow-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      min-width: min-content;
    }

    .flow-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 400px;
    }

    .flow-node {
      width: 100%;
      background: var(--ds-surface-glass);
      backdrop-filter: blur(32px) saturate(180%);
      border: 2px solid var(--ds-border);
      padding: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: var(--ds-shadow-medium);
    }

    .flow-node::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0, 255, 245, 0.05), rgba(91, 74, 255, 0.05));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .flow-node:hover {
      transform: scale(1.02);
      border-color: var(--ds-border-glow);
      box-shadow: 0 12px 36px rgba(0, 255, 245, 0.25);
    }

    .flow-node:hover::before {
      opacity: 1;
    }

    .flow-node.start {
      border-radius: var(--ds-radius-pill);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
      border-color: rgba(16, 185, 129, 0.4);
    }

    .flow-node.end {
      border-radius: var(--ds-radius-pill);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
      border-color: rgba(239, 68, 68, 0.4);
    }

    .flow-node.process {
      border-radius: var(--ds-radius-lg);
    }

    .flow-node.decision {
      border-radius: var(--ds-radius-md);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
      border-color: rgba(245, 158, 11, 0.4);
    }

    .node-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--ds-radius-lg);
      background: linear-gradient(135deg, rgba(0, 255, 245, 0.2), rgba(91, 74, 255, 0.2));
      border: 1px solid var(--ds-border-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.2);
      position: relative;
      z-index: 1;
    }

    .node-content {
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .node-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ds-text-primary);
      margin-bottom: 0.375rem;
      letter-spacing: 0.01em;
    }

    .node-description {
      font-size: 0.775rem;
      color: var(--ds-text-secondary);
      line-height: 1.5;
      opacity: 0.9;
    }

    .flow-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      margin: 0.625rem 0;
    }

    .arrow-line {
      width: 3px;
      height: 24px;
      background: linear-gradient(180deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      box-shadow: 0 0 12px rgba(0, 255, 245, 0.4);
      border-radius: 2px;
    }

    .arrow-head {
      font-size: 1.125rem;
      color: var(--ds-accent-teal);
      text-shadow: 0 0 12px currentColor;
      margin-top: -8px;
      animation: bounce 2s ease-in-out infinite;
    }

    .arrow-label {
      position: absolute;
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-left: 1rem;
      padding: 0.375rem 0.875rem;
      background: var(--ds-surface-glass-strong);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ds-text-secondary);
      white-space: nowrap;
      box-shadow: var(--ds-shadow-soft);
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(6px);
      }
    }
  `]
})
export class FlowDiagramComponent {
  @Input() nodes: FlowNode[] = [];
  @Input() connections: FlowConnection[] = [];

  getConnectionLabel(fromId: string): string | undefined {
    const connection = this.connections.find(c => c.from === fromId);
    return connection?.label;
  }
}

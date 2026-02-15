import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../shared/ds-icon.component';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: string;
  status?: 'completed' | 'active' | 'pending' | 'error';
  metadata?: Record<string, any>;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline" [class.vertical]="orientation === 'vertical'" [class.horizontal]="orientation === 'horizontal'">
      <div 
        *ngFor="let item of items; let i = index; let last = last"
        class="timeline-item clickable"
        [class.completed]="item.status === 'completed'"
        [class.active]="item.status === 'active'"
        [class.pending]="item.status === 'pending'"
        [class.error]="item.status === 'error'"
        [class.selected]="selectedIndex === i"
        (click)="onItemClick(i, item)"
      >
        <div class="timeline-marker">
          <div class="timeline-icon" *ngIf="item.icon"><ds-icon [name]="item.icon" [size]="16"></ds-icon></div>
          <div class="timeline-dot" *ngIf="!item.icon"></div>
        </div>
        <div class="timeline-connector" *ngIf="!last"></div>
        <div class="timeline-content">
          <h4 class="timeline-title">{{ item.title }}</h4>
          <p class="timeline-description" *ngIf="item.description">{{ item.description }}</p>
          <span class="timeline-timestamp" *ngIf="item.timestamp">{{ item.timestamp }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline {
      display: flex;
      position: relative;
    }

    .timeline.vertical {
      flex-direction: column;
      gap: 0;
    }

    .timeline.horizontal {
      flex-direction: row;
      align-items: flex-start;
      gap: 0;
      overflow-x: auto;
      padding: 1rem 0;
    }

    .timeline-item {
      position: relative;
      display: flex;
      gap: 0.875rem;
      padding-bottom: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .timeline-item.clickable:hover .timeline-content {
      border-color: var(--ds-border-glow);
      box-shadow: 0 4px 16px rgba(0, 255, 245, 0.15);
    }

    .timeline-item.clickable:hover .timeline-dot {
      transform: scale(1.2);
      box-shadow: 0 0 16px rgba(0, 255, 245, 0.4);
    }

    .timeline-item.selected .timeline-content {
      border-color: var(--ds-border-glow);
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.2);
      transform: translateX(4px);
    }

    .timeline.horizontal .timeline-item.selected .timeline-content {
      transform: translateY(-4px);
    }

    .timeline-item.selected .timeline-dot {
      background: var(--ds-accent-teal);
      border-color: var(--ds-accent-teal);
      box-shadow: 0 0 24px var(--ds-accent-teal);
    }

    .timeline-item.selected .timeline-icon {
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.5), 0 0 0 4px rgba(0, 255, 245, 0.2);
    }

    .timeline.horizontal .timeline-item {
      flex-direction: column;
      align-items: center;
      padding-bottom: 0;
      padding-right: 2rem;
      min-width: 160px;
    }

    .timeline-marker {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timeline-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.3), 0 0 0 4px rgba(0, 255, 245, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--ds-surface-glass);
      border: 2px solid var(--ds-border);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .timeline-item.completed .timeline-icon {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
    }

    .timeline-item.completed .timeline-dot {
      background: #10b981;
      border-color: #10b981;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.5);
    }

    .timeline-item.active .timeline-icon {
      animation: pulse-active 2s ease-in-out infinite;
    }

    .timeline-item.active .timeline-dot {
      background: var(--ds-accent-teal);
      border-color: var(--ds-accent-teal);
      box-shadow: 0 0 24px var(--ds-accent-teal);
      animation: pulse-active 2s ease-in-out infinite;
    }

    .timeline-item.pending .timeline-dot {
      background: transparent;
      border-color: var(--ds-border);
    }

    .timeline-item.error .timeline-icon {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
    }

    .timeline-item.error .timeline-dot {
      background: #ef4444;
      border-color: #ef4444;
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
    }

    .timeline-connector {
      position: absolute;
      background: var(--ds-border);
      transition: all 0.3s ease;
    }

    .timeline.vertical .timeline-connector {
      left: 15px;
      top: 32px;
      bottom: -1.5rem;
      width: 2px;
    }

    .timeline.horizontal .timeline-connector {
      top: 15px;
      left: 32px;
      right: -2rem;
      height: 2px;
    }

    .timeline-item.completed .timeline-connector {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      box-shadow: 0 0 12px rgba(0, 255, 245, 0.3);
    }

    .timeline-content {
      flex: 1;
      background: var(--ds-surface-glass);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      padding: 0.75rem;
      box-shadow: var(--ds-shadow-soft);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .timeline.horizontal .timeline-content {
      margin-top: 1rem;
      min-height: 80px;
    }

    .timeline-item.active .timeline-content {
      border-color: var(--ds-border-glow);
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.2);
      transform: translateX(4px);
    }

    .timeline.horizontal .timeline-item.active .timeline-content {
      transform: translateY(-4px);
    }

    .timeline-title {
      margin: 0 0 0.25rem;
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--ds-text-primary);
      letter-spacing: 0.01em;
    }

    .timeline-description {
      margin: 0 0 0.5rem;
      font-size: 0.775rem;
      color: var(--ds-text-secondary);
      line-height: 1.6;
    }

    .timeline-timestamp {
      font-size: 0.75rem;
      color: var(--ds-text-secondary);
      opacity: 0.8;
      font-weight: 500;
    }

    @keyframes pulse-active {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 24px currentColor;
      }
      50% {
        transform: scale(1.1);
        box-shadow: 0 0 32px currentColor, 0 0 48px currentColor;
      }
    }
  `]
})
export class TimelineComponent {
  @Input() items: TimelineItem[] = [];
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() selectedIndex = -1;
  @Output() itemClick = new EventEmitter<{ index: number; item: TimelineItem }>();

  onItemClick(index: number, item: TimelineItem): void {
    this.selectedIndex = index;
    this.itemClick.emit({ index, item });
  }
}

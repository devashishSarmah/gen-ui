import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../shared/ds-icon.component';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-card" [class.elevated]="elevated">
      <div class="stats-icon" *ngIf="icon"><ds-icon [name]="icon" [size]="24"></ds-icon></div>
      <div class="stats-content">
        <div class="stats-label">{{ label }}</div>
        <div class="stats-value">{{ value }}</div>
        <div class="stats-change" *ngIf="change !== undefined" [class.positive]="change > 0" [class.negative]="change < 0">
          <span class="change-icon">{{ change > 0 ? '↑' : '↓' }}</span>
          <span class="change-value">{{ Math.abs(change) }}%</span>
        </div>
        <div class="stats-description" *ngIf="description">{{ description }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      flex: 1 1 0;
      min-width: 160px;
    }

    .stats-card {
      background: var(--ds-surface-glass);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      padding: 0.875rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .stats-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0, 255, 245, 0.05), rgba(91, 74, 255, 0.05));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .stats-card:hover {
      transform: translateY(-2px);
      border-color: var(--ds-border-glow);
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.15);
    }

    .stats-card:hover::before {
      opacity: 1;
    }

    .stats-card.elevated {
      box-shadow: var(--ds-shadow-medium);
    }

    .stats-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--ds-radius-lg);
      background: linear-gradient(135deg, rgba(0, 255, 245, 0.15), rgba(91, 74, 255, 0.15));
      border: 1px solid var(--ds-border-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 255, 245, 0.15);
      position: relative;
      z-index: 1;
    }

    .stats-content {
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .stats-label {
      font-size: 0.75rem;
      color: var(--ds-text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .stats-value {
      font-size: 1.35rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.2;
      margin-bottom: 0.25rem;
    }

    .stats-change {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.15rem 0.5rem;
      border-radius: var(--ds-radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .stats-change.positive {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .stats-change.negative {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .change-icon {
      font-size: 1rem;
    }

    .stats-description {
      font-size: 0.8rem;
      color: var(--ds-text-secondary);
      line-height: 1.5;
      opacity: 0.9;
    }
  `]
})
export class StatsCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() change?: number;
  @Input() description?: string;
  @Input() icon?: string;
  @Input() elevated = true;

  Math = Math;
}

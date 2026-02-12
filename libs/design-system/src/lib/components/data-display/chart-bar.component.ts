import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MetricData {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-chart-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-container">
      <h3 class="chart-title" *ngIf="title">{{ title }}</h3>
      <div class="chart-bars">
        <div *ngFor="let item of data; let i = index" class="bar-item">
          <div class="bar-info">
            <span class="bar-label">{{ item.label }}</span>
            <span class="bar-value">{{ item.value }}</span>
          </div>
          <div class="bar-track">
            <div 
              class="bar-fill" 
              [style.width.%]="getPercentage(item.value)"
              [style.background]="item.color || getGradient(i)"
            >
              <span class="bar-glow"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: var(--ds-surface-glass);
      backdrop-filter: blur(32px) saturate(180%);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      padding: 1rem;
      box-shadow: var(--ds-shadow-medium);
    }

    .chart-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--ds-text-primary);
      margin: 0 0 0.875rem;
      letter-spacing: 0.01em;
    }

    .chart-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .bar-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .bar-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bar-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ds-text-primary);
    }

    .bar-value {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--ds-accent-teal);
    }

    .bar-track {
      height: 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--ds-radius-lg);
      overflow: hidden;
      position: relative;
      border: 1px solid var(--ds-border);
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .bar-fill {
      height: 100%;
      position: relative;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: var(--ds-radius-lg);
      box-shadow: 0 4px 16px rgba(0, 255, 245, 0.3);
    }

    .bar-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      animation: shimmer 2.5s infinite;
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `]
})
export class ChartBarComponent {
  @Input() title?: string;
  @Input() data: MetricData[] = [];

  private maxValue = 0;

  ngOnInit() {
    this.maxValue = Math.max(...this.data.map(d => d.value));
  }

  getPercentage(value: number): number {
    return this.maxValue > 0 ? (value / this.maxValue) * 100 : 0;
  }

  getGradient(index: number): string {
    const gradients = [
      'linear-gradient(90deg, #00fff5, #5b4aff)',
      'linear-gradient(90deg, #10b981, #059669)',
      'linear-gradient(90deg, #f59e0b, #d97706)',
      'linear-gradient(90deg, #ef4444, #dc2626)',
      'linear-gradient(90deg, #3b82f6, #2563eb)',
      'linear-gradient(90deg, #8b5cf6, #6d28d9)',
    ];
    return gradients[index % gradients.length];
  }
}

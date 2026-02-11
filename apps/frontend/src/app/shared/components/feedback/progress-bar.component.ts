import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-container">
      <div class="progress-header" *ngIf="label || showValue">
        <span class="progress-label" *ngIf="label">{{ label }}</span>
        <span class="progress-value" *ngIf="showValue">{{ value }}%</span>
      </div>
      <div class="progress-bar" [class.animated]="animated" [class.striped]="striped">
        <div 
          class="progress-fill"
          [style.width.%]="value"
          [class.success]="variant === 'success'"
          [class.warning]="variant === 'warning'"
          [class.error]="variant === 'error'"
          [class.primary]="variant === 'primary'"
        >
          <span class="progress-glow"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .progress-container {
      width: 100%;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.625rem;
    }

    .progress-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ds-text-primary);
      letter-spacing: 0.01em;
    }

    .progress-value {
      font-size: 0.875rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .progress-bar {
      height: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--ds-radius-pill);
      overflow: hidden;
      position: relative;
      border: 1px solid var(--ds-border);
    }

    .progress-fill {
      height: 100%;
      position: relative;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: var(--ds-radius-pill);
      overflow: hidden;
    }

    .progress-fill.primary {
      background: linear-gradient(90deg, var(--ds-accent-teal), var(--ds-accent-indigo));
    }

    .progress-fill.success {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .progress-fill.warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .progress-fill.error {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .progress-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }

    .progress-bar.striped .progress-fill::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 20px 20px;
    }

    .progress-bar.striped.animated .progress-fill::before {
      animation: stripes 1s linear infinite;
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    @keyframes stripes {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 20px 20px;
      }
    }
  `]
})
export class ProgressBarComponent {
  @Input() value = 0; // 0-100
  @Input() label?: string;
  @Input() variant: 'primary' | 'success' | 'warning' | 'error' = 'primary';
  @Input() showValue = true;
  @Input() striped = false;
  @Input() animated = false;
}

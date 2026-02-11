import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-ring" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
        <defs>
          <linearGradient [attr.id]="'gradient-' + uniqueId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00fff5;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#5b4aff;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background circle -->
        <circle
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          [attr.stroke]="'rgba(255, 255, 255, 0.1)'"
          [attr.stroke-width]="strokeWidth"
        />
        
        <!-- Progress circle -->
        <circle
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          [attr.stroke]="'url(#gradient-' + uniqueId + ')'"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          stroke-linecap="round"
          transform-origin="center"
          [attr.transform]="'rotate(-90 ' + center + ' ' + center + ')'"
          class="progress-circle"
        />
      </svg>
      
      <div class="progress-content">
        <div class="progress-icon" *ngIf="icon">{{ icon }}</div>
        <div class="progress-value" *ngIf="showValue">{{ value }}%</div>
        <div class="progress-label" *ngIf="label">{{ label }}</div>
      </div>
    </div>
  `,
  styles: [`
    .progress-ring {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    svg {
      transform: scaleY(-1);
    }

    .progress-circle {
      transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 0 12px rgba(0, 255, 245, 0.5));
    }

    .progress-content {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.25rem;
    }

    .progress-icon {
      font-size: 2rem;
      animation: float 3s ease-in-out infinite;
    }

    .progress-value {
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }

    .progress-label {
      font-size: 0.75rem;
      color: var(--ds-text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }
  `]
})
export class ProgressRingComponent {
  @Input() value = 0; // 0-100
  @Input() size = 120;
  @Input() strokeWidth = 8;
  @Input() label?: string;
  @Input() icon?: string;
  @Input() showValue = true;

  uniqueId = Math.random().toString(36).substring(7);

  get center(): number {
    return this.size / 2;
  }

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get dashOffset(): number {
    return this.circumference - (this.value / 100) * this.circumference;
  }
}

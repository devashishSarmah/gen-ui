import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../shared/ds-icon.component';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      *ngIf="visible"
      class="alert"
      [class.success]="variant === 'success'"
      [class.warning]="variant === 'warning'"
      [class.error]="variant === 'error'"
      [class.info]="variant === 'info'"
      role="alert"
    >
      <div class="alert-icon" *ngIf="icon"><ds-icon [name]="icon" [size]="20"></ds-icon></div>
      <div class="alert-content">
        <div class="alert-title" *ngIf="title">{{ title }}</div>
        <div class="alert-message">{{ message }}</div>
        <div class="alert-description" *ngIf="description">{{ description }}</div>
      </div>
      <button 
        *ngIf="dismissible" 
        class="alert-close" 
        (click)="dismiss()"
        type="button"
        aria-label="Dismiss alert"
      >×</button>
    </div>
  `,
  styles: [`
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.75rem;
      border-radius: var(--ds-radius-lg);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .alert.success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
      border-color: rgba(16, 185, 129, 0.3);
      color: #10b981;
    }

    .alert.warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
      border-color: rgba(245, 158, 11, 0.3);
      color: #f59e0b;
    }

    .alert.error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    .alert.info {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
      border-color: rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }

    .alert-icon {
      font-size: 1rem;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .alert-content {
      flex: 1;
    }

    .alert-title {
      font-size: 0.825rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      letter-spacing: 0.01em;
    }

    .alert-message {
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      opacity: 0.95;
    }

    .alert-description {
      font-size: 0.75rem;
      opacity: 0.85;
      line-height: 1.5;
    }

    .alert-close {
      background: none;
      border: none;
      color: currentColor;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      margin-top: -0.25rem;
      opacity: 0.7;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .alert-close:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class AlertComponent {
  @Input() title?: string;
  @Input() message = '';
  @Input() description?: string;
  @Input() icon?: string;
  @Input() variant: 'success' | 'warning' | 'error' | 'info' = 'info';
  @Input() dismissible = true;
  @Input() visible = true;
  @Output() dismissed = new EventEmitter<void>();

  dismiss() {
    this.visible = false;
    this.dismissed.emit();
  }
}

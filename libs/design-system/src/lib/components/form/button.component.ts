import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading ? 'true' : null"
      [attr.aria-label]="ariaLabel || label"
      (click)="onClick()"
      [class]="'button button-' + variant + ' button-size-' + size"
      [class.button-full]="fullWidth"
    >
      <span *ngIf="loading" class="button-spinner"></span>
      <ng-content></ng-content>
      {{ label }}
    </button>
  `,
  styles: [
    `
      .button {
        padding: var(--ds-btn-padding-y, 0.55rem) var(--ds-btn-padding-x, 1rem);
        border: 1px solid transparent;
        border-radius: var(--ds-btn-radius, 12px);
        font-size: var(--ds-btn-font-size, 0.875rem);
        cursor: pointer;
        font-weight: 600;
        letter-spacing: 0.01em;
        transition: all 0.25s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        justify-content: center;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        backdrop-filter: blur(20px) saturate(180%);
        box-shadow: var(--ds-shadow-input);
        position: relative;
        overflow: hidden;
      }

      .button-full {
        width: 100%;
      }

      .button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--ds-shadow-soft);
      }

      .button:active:not(:disabled) {
        transform: translateY(0);
      }

      .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .button:focus-visible {
        outline: none;
        box-shadow: var(--ds-input-focus-ring);
      }

      .button-primary {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        color: #0a0b0f;
        border: none;
        box-shadow: 0 4px 20px rgba(0, 255, 245, 0.2);
      }

      .button-primary:hover:not(:disabled) {
        box-shadow: 0 8px 28px rgba(0, 255, 245, 0.3);
      }

      .button-secondary {
        background: rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(12px);
        border: 1px solid var(--ds-border);
      }

      .button-secondary:hover:not(:disabled) {
        border-color: var(--ds-border-strong);
        background: rgba(255, 255, 255, 0.1);
      }

      .button-danger {
        background: linear-gradient(135deg, #ff4d7d, #ff2d6f);
        color: #ffffff;
        border: none;
        box-shadow: 0 4px 20px rgba(255, 77, 125, 0.2);
      }

      .button-success {
        background: linear-gradient(135deg, #2eff8b, var(--ds-accent-teal));
        color: #0a0b0f;
        border: none;
        box-shadow: 0 4px 20px rgba(46, 255, 139, 0.2);
      }

      .button-size-small {
        padding: 0.35rem 0.75rem;
        font-size: var(--ds-text-sm);
      }

      .button-size-large {
        padding: 0.75rem 1.5rem;
        font-size: var(--ds-text-lg, 1rem);
      }

      .button-spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(10, 11, 15, 0.2);
        border-radius: 50%;
        border-top-color: rgba(10, 11, 15, 0.7);
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() label = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() fullWidth = false;
  @Input() ariaLabel = '';

  @Output() btnClick = new EventEmitter<void>();

  onClick() {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit();
    }
  }
}

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
    >
      <span *ngIf="loading" class="button-spinner"></span>
      {{ label }}
    </button>
  `,
  styles: [
    `
      .button {
        padding: 0.75rem 1.75rem;
        border: 1px solid transparent;
        border-radius: var(--ds-radius-pill);
        font-size: 0.95rem;
        cursor: pointer;
        font-weight: 600;
        letter-spacing: 0.02em;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        backdrop-filter: blur(20px) saturate(180%);
        box-shadow: var(--ds-shadow-soft), 0 0 0 1px rgba(255, 255, 255, 0.08);
        position: relative;
        overflow: hidden;
      }

      .button::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .button:hover:not(:disabled)::before {
        opacity: 1;
      }

      .button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--ds-shadow-medium), var(--ds-shadow-glow-sm);
        border-color: var(--ds-border-glow);
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
        box-shadow: 0 0 0 3px rgba(0, 255, 245, 0.4), 0 0 24px rgba(0, 255, 245, 0.2);
      }

      .button-primary {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        color: #0a0b0f;
        border: none;
        box-shadow: 0 8px 24px rgba(0, 255, 245, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
      }

      .button-primary:hover:not(:disabled) {
        box-shadow: 0 12px 32px rgba(0, 255, 245, 0.4), 0 0 48px rgba(91, 74, 255, 0.3);
      }

      .button-secondary {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(24px) saturate(180%);
        border: 1px solid var(--ds-border-strong);
      }

      .button-danger {
        background: linear-gradient(135deg, #ff4d7d, #ff2d6f);
        color: #ffffff;
        border: none;
        box-shadow: 0 8px 24px rgba(255, 77, 125, 0.3);
      }

      .button-success {
        background: linear-gradient(135deg, #2eff8b, var(--ds-accent-teal));
        color: #0a0b0f;
        border: none;
        box-shadow: 0 8px 24px rgba(46, 255, 139, 0.3);
      }

      .button-size-small {
        padding: 0.35rem 0.9rem;
        font-size: 0.8rem;
      }

      .button-size-large {
        padding: 0.85rem 2rem;
        font-size: 1rem;
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
  @Input() label = 'Button';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() ariaLabel = '';

  @Output() click = new EventEmitter<void>();

  onClick() {
    this.click.emit();
  }
}

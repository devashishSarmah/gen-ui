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
        padding: 0.65rem 1.5rem;
        border: 1px solid transparent;
        border-radius: 999px;
        font-size: 0.95rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        box-shadow: var(--ds-shadow-soft);
      }

      .button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--ds-shadow-soft), var(--ds-shadow-glow);
      }

      .button:active:not(:disabled) {
        transform: translateY(0);
      }

      .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(8, 255, 243, 0.5), 0 0 0 5px rgba(8, 255, 243, 0.15);
      }

      .button-primary {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        color: #0a0b0f;
        border: none;
      }

      .button-secondary {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--ds-border-strong);
      }

      .button-danger {
        background: linear-gradient(135deg, #ff5c5c, #ff2d6f);
        color: #0a0b0f;
        border: none;
      }

      .button-success {
        background: linear-gradient(135deg, #2eff8b, #08fff3);
        color: #0a0b0f;
        border: none;
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

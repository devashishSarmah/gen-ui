import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
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
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
      }

      .button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .button:active:not(:disabled) {
        transform: translateY(0);
      }

      .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .button-primary {
        background-color: #2196f3;
        color: white;
      }

      .button-primary:hover:not(:disabled) {
        background-color: #1976d2;
      }

      .button-secondary {
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }

      .button-secondary:hover:not(:disabled) {
        background-color: #eeeeee;
      }

      .button-danger {
        background-color: #d32f2f;
        color: white;
      }

      .button-danger:hover:not(:disabled) {
        background-color: #b71c1c;
      }

      .button-success {
        background-color: #388e3c;
        color: white;
      }

      .button-success:hover:not(:disabled) {
        background-color: #2e7d32;
      }

      .button-size-small {
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
      }

      .button-size-large {
        padding: 0.75rem 1.5rem;
        font-size: 1.125rem;
      }

      .button-spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
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

  @Output() click = new EventEmitter<void>();

  onClick() {
    this.click.emit();
  }
}

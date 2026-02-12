import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="input-wrapper">
      <label *ngIf="label" [for]="id" class="input-label">{{ label }}</label>
      <input
        [id]="id"
        [type]="type"
        [(ngModel)]="value"
        (change)="onChange()"
        (blur)="onBlur()"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [pattern]="pattern"
        [attr.aria-label]="label || ariaLabel"
        [attr.aria-required]="required ? 'true' : null"
        [attr.aria-invalid]="error ? 'true' : null"
        [attr.aria-describedby]="describedBy"
        class="input-field"
      />
      <span *ngIf="error" [id]="errorId" class="input-error">{{ error }}</span>
    </div>
  `,
  styles: [
    `
      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .input-label {
        font-weight: 600;
        font-size: 0.875rem;
        letter-spacing: 0.02em;
        color: var(--ds-text-secondary);
      }
      .input-field {
        padding: 0.875rem 1.5rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-pill);
        font-size: 0.95rem;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        backdrop-filter: blur(20px) saturate(180%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.06);
      }
      .input-field::placeholder {
        color: var(--ds-text-secondary);
        opacity: 0.6;
      }
      .input-field:hover:not(:disabled) {
        border-color: var(--ds-border-strong);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
      }
      .input-field:focus {
        outline: none;
        border-color: var(--ds-border-glow);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(0, 255, 245, 0.2), 0 0 32px rgba(0, 255, 245, 0.15);
      }
      .input-field:disabled {
        background-color: rgba(255, 255, 255, 0.03);
        cursor: not-allowed;
        opacity: 0.6;
      }
      .input-error {
        color: #ff7485;
        font-size: 0.75rem;
        font-weight: 500;
      }
    `,
  ],
})
export class InputComponent {
  @Input() id = 'input-' + Math.random().toString(36).substr(2, 9);
  @Input() type = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() pattern = '';
  @Input() error = '';
  @Input() value = '';
  @Input() ariaLabel = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() change = new EventEmitter<string>();
  @Output() blur = new EventEmitter<void>();

  onChange() {
    this.valueChange.emit(this.value);
    this.change.emit(this.value);
  }

  onBlur() {
    this.blur.emit();
  }

  get errorId(): string {
    return `${this.id}-error`;
  }

  get describedBy(): string | null {
    if (this.error) {
      return this.errorId;
    }
    return null;
  }
}

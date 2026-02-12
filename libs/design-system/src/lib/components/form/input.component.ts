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
        (ngModelChange)="onChange()"
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
        gap: var(--ds-space-2, 0.4rem);
      }
      .input-label {
        font-weight: 500;
        font-size: var(--ds-text-sm, 0.8rem);
        letter-spacing: 0.01em;
        color: var(--ds-text-secondary);
      }
      .input-field {
        padding: var(--ds-input-padding-y, 0.55rem) var(--ds-input-padding-x, 1rem);
        border: 1px solid var(--ds-input-border, rgba(255, 255, 255, 0.08));
        border-radius: var(--ds-input-radius, 12px);
        font-size: var(--ds-input-font-size, 0.875rem);
        color: var(--ds-text-primary);
        background: var(--ds-input-bg, rgba(255, 255, 255, 0.04));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        transition: all 0.25s ease;
        box-shadow: var(--ds-shadow-input, 0 2px 8px rgba(0, 0, 0, 0.15));
      }
      .input-field::placeholder {
        color: var(--ds-text-secondary);
        opacity: 0.5;
      }
      .input-field:hover:not(:disabled) {
        border-color: var(--ds-input-border-hover, rgba(255, 255, 255, 0.14));
      }
      .input-field:focus {
        outline: none;
        border-color: var(--ds-input-border-focus, rgba(0, 255, 245, 0.35));
        box-shadow: var(--ds-input-focus-ring, 0 0 0 3px rgba(0, 255, 245, 0.08), 0 4px 16px rgba(0, 0, 0, 0.2));
      }
      .input-field:disabled {
        background-color: rgba(255, 255, 255, 0.03);
        cursor: not-allowed;
        opacity: 0.6;
      }
      .input-error {
        color: var(--ds-error, #ff7485);
        font-size: var(--ds-text-xs, 0.7rem);
        font-weight: 500;
        margin-top: 0.15rem;
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

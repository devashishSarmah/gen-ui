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
        gap: 0.5rem;
      }
      .input-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ds-text-secondary);
      }
      .input-field {
        padding: 0.75rem 1.25rem;
        border: 1px solid var(--ds-border);
        border-radius: 999px;
        font-size: 0.95rem;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .input-field:focus {
        outline: none;
        border-color: rgba(8, 255, 243, 0.6);
        box-shadow: 0 0 0 3px rgba(8, 255, 243, 0.15);
      }
      .input-field:disabled {
        background-color: rgba(255, 255, 255, 0.04);
        cursor: not-allowed;
        opacity: 0.7;
      }
      .input-error {
        color: #ff7485;
        font-size: 0.75rem;
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

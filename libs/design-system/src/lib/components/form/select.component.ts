import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="select-wrapper">
      <label *ngIf="label" [for]="id" class="select-label">{{ label }}</label>
      <select
        [id]="id"
        [(ngModel)]="value"
        (change)="onChange()"
        (blur)="onBlur()"
        [disabled]="disabled"
        [required]="required"
        [attr.aria-label]="label || ariaLabel"
        [attr.aria-required]="required ? 'true' : null"
        [attr.aria-invalid]="error ? 'true' : null"
        [attr.aria-describedby]="describedBy"
        class="select-field"
      >
        <option *ngIf="placeholder" value="">{{ placeholder }}</option>
        <option *ngFor="let option of options" [value]="option.value">
          {{ option.label }}
        </option>
      </select>
      <span *ngIf="error" [id]="errorId" class="select-error">{{ error }}</span>
    </div>
  `,
  styles: [
    `
      .select-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .select-label {
        font-weight: 600;
        font-size: 0.8rem;
        letter-spacing: 0.02em;
        color: var(--ds-text-secondary);
      }
      .select-field {
        padding: 0.55rem 1rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-pill);
        font-size: 0.85rem;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        backdrop-filter: blur(20px) saturate(180%);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.06);
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300fff5' d='M3.35 4.48a.56.56 0 0 1 .8 0L6 6.33l1.85-1.85a.56.56 0 1 1 .8.8l-2.25 2.24a.56.56 0 0 1-.8 0L3.35 5.27a.56.56 0 0 1 0-.8Z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1.25rem center;
        padding-right: 3rem;
      }
      .select-field:hover:not(:disabled) {
        border-color: var(--ds-border-strong);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
      }
      .select-field:focus {
        outline: none;
        border-color: var(--ds-border-glow);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(0, 255, 245, 0.2), 0 0 32px rgba(0, 255, 245, 0.15);
      }
      .select-field:disabled {
        background-color: rgba(255, 255, 255, 0.03);
        cursor: not-allowed;
        opacity: 0.6;
      }
      .select-error {
        color: #ff7485;
        font-size: 0.75rem;
        font-weight: 500;
      }
    `,
  ],
})
export class SelectComponent {
  @Input() id = 'select-' + Math.random().toString(36).substr(2, 9);
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error = '';
  @Input() options: SelectOption[] = [];
  @Input() value: any = '';
  @Input() ariaLabel = '';

  @Output() valueChange = new EventEmitter<any>();
  @Output() change = new EventEmitter<any>();
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

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
        gap: 0.5rem;
      }
      .select-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ds-text-secondary);
      }
      .select-field {
        padding: 0.75rem 1.25rem;
        border: 1px solid var(--ds-border);
        border-radius: 999px;
        font-size: 0.95rem;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .select-field:focus {
        outline: none;
        border-color: rgba(8, 255, 243, 0.6);
        box-shadow: 0 0 0 3px rgba(8, 255, 243, 0.15);
      }
      .select-field:disabled {
        background-color: rgba(255, 255, 255, 0.04);
        cursor: not-allowed;
        opacity: 0.7;
      }
      .select-error {
        color: #ff7485;
        font-size: 0.75rem;
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

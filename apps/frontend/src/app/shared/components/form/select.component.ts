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
        class="select-field"
      >
        <option *ngIf="placeholder" value="">{{ placeholder }}</option>
        <option *ngFor="let option of options" [value]="option.value">
          {{ option.label }}
        </option>
      </select>
      <span *ngIf="error" class="select-error">{{ error }}</span>
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
      }
      .select-field {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
      }
      .select-field:focus {
        outline: none;
        border-color: #2196f3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
      .select-field:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
      .select-error {
        color: #d32f2f;
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
}

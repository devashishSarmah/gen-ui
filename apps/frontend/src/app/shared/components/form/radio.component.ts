import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface RadioOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div
      class="radio-wrapper"
      role="radiogroup"
      [attr.aria-labelledby]="groupLabel ? groupLabelId : null"
      [attr.aria-label]="!groupLabel ? ariaLabel : null"
      [attr.aria-describedby]="describedBy"
    >
      <label *ngIf="groupLabel" [id]="groupLabelId" class="radio-group-label">
        {{ groupLabel }}
      </label>
      <div *ngFor="let option of options" class="radio-option">
        <input
          type="radio"
          [id]="id + '-' + option.value"
          [name]="groupName"
          [value]="option.value"
          [(ngModel)]="value"
          (change)="onChange()"
          [disabled]="disabled"
          [attr.aria-checked]="value === option.value ? 'true' : 'false'"
          class="radio-input"
        />
        <label [for]="id + '-' + option.value" class="radio-label">
          {{ option.label }}
        </label>
      </div>
      <span *ngIf="error" [id]="errorId" class="radio-error">{{ error }}</span>
    </div>
  `,
  styles: [
    `
      .radio-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .radio-group-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ds-text-secondary);
      }
      .radio-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .radio-input {
        cursor: pointer;
        width: 1.1rem;
        height: 1.1rem;
        accent-color: var(--ds-accent-teal);
      }
      .radio-label {
        cursor: pointer;
        font-size: 0.9rem;
        color: var(--ds-text-primary);
      }
      .radio-input:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .radio-error {
        color: #ff7485;
        font-size: 0.75rem;
      }
    `,
  ],
})
export class RadioComponent {
  @Input() id = 'radio-' + Math.random().toString(36).substr(2, 9);
  @Input() groupLabel = '';
  @Input() disabled = false;
  @Input() error = '';
  @Input() options: RadioOption[] = [];
  @Input() value: any = '';
  @Input() ariaLabel = '';
  @Input() name = '';

  @Output() valueChange = new EventEmitter<any>();
  @Output() change = new EventEmitter<any>();

  onChange() {
    this.valueChange.emit(this.value);
    this.change.emit(this.value);
  }

  get groupLabelId(): string {
    return `${this.id}-label`;
  }

  get groupName(): string {
    return this.name || this.id;
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

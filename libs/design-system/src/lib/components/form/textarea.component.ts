import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="textarea-wrapper">
      <label *ngIf="label" [for]="id" class="textarea-label">{{ label }}</label>
      <textarea
        [id]="id"
        [(ngModel)]="value"
        (change)="onChange()"
        (blur)="onBlur()"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [rows]="rows"
        [cols]="cols"
        [attr.aria-label]="label || ariaLabel"
        [attr.aria-required]="required ? 'true' : null"
        [attr.aria-invalid]="error ? 'true' : null"
        [attr.aria-describedby]="describedBy"
        class="textarea-field"
      ></textarea>
      <span *ngIf="error" [id]="errorId" class="textarea-error">{{ error }}</span>
      <span *ngIf="maxLength" [id]="counterId" class="textarea-counter">
        {{ value.length }} / {{ maxLength }}
      </span>
    </div>
  `,
  styles: [
    `
      .textarea-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .textarea-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ds-text-secondary);
      }
      .textarea-field {
        padding: 0.75rem 1.25rem;
        border: 1px solid var(--ds-border);
        border-radius: 18px;
        font-size: 0.95rem;
        font-family: inherit;
        resize: vertical;
        color: var(--ds-text-primary);
        background: var(--ds-surface-glass);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .textarea-field:focus {
        outline: none;
        border-color: rgba(8, 255, 243, 0.6);
        box-shadow: 0 0 0 3px rgba(8, 255, 243, 0.15);
      }
      .textarea-field:disabled {
        background-color: rgba(255, 255, 255, 0.04);
        cursor: not-allowed;
        opacity: 0.7;
      }
      .textarea-error {
        color: #ff7485;
        font-size: 0.75rem;
      }
      .textarea-counter {
        font-size: 0.75rem;
        color: var(--ds-text-secondary);
        text-align: right;
      }
    `,
  ],
})
export class TextareaComponent {
  @Input() id = 'textarea-' + Math.random().toString(36).substr(2, 9);
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() rows = 4;
  @Input() cols = 50;
  @Input() maxLength = 0;
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

  get counterId(): string {
    return `${this.id}-counter`;
  }

  get describedBy(): string | null {
    const ids = [] as string[];
    if (this.error) {
      ids.push(this.errorId);
    }
    if (this.maxLength) {
      ids.push(this.counterId);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  }
}

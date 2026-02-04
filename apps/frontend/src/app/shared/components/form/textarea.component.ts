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
        class="textarea-field"
      ></textarea>
      <span *ngIf="error" class="textarea-error">{{ error }}</span>
      <span *ngIf="maxLength" class="textarea-counter">
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
      }
      .textarea-field {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
      }
      .textarea-field:focus {
        outline: none;
        border-color: #2196f3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
      .textarea-field:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
      .textarea-error {
        color: #d32f2f;
        font-size: 0.75rem;
      }
      .textarea-counter {
        font-size: 0.75rem;
        color: #999;
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
}

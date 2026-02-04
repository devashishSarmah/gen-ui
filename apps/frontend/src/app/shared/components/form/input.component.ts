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
        class="input-field"
      />
      <span *ngIf="error" class="input-error">{{ error }}</span>
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
      }
      .input-field {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
      }
      .input-field:focus {
        outline: none;
        border-color: #2196f3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
      .input-field:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
      .input-error {
        color: #d32f2f;
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

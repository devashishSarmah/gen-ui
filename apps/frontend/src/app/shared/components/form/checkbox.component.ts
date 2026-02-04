import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="checkbox-wrapper">
      <input
        type="checkbox"
        [id]="id"
        [(ngModel)]="checked"
        (change)="onChange()"
        (blur)="onBlur()"
        [disabled]="disabled"
        class="checkbox-input"
      />
      <label *ngIf="label" [for]="id" class="checkbox-label">{{ label }}</label>
      <span *ngIf="error" class="checkbox-error">{{ error }}</span>
    </div>
  `,
  styles: [
    `
      .checkbox-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
      .checkbox-input {
        cursor: pointer;
        width: 1rem;
        height: 1rem;
      }
      .checkbox-label {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
      }
      .checkbox-input:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .checkbox-error {
        color: #d32f2f;
        font-size: 0.75rem;
      }
    `,
  ],
})
export class CheckboxComponent {
  @Input() id = 'checkbox-' + Math.random().toString(36).substr(2, 9);
  @Input() label = '';
  @Input() disabled = false;
  @Input() error = '';
  @Input() checked = false;

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() change = new EventEmitter<boolean>();
  @Output() blur = new EventEmitter<void>();

  onChange() {
    this.checkedChange.emit(this.checked);
    this.change.emit(this.checked);
  }

  onBlur() {
    this.blur.emit();
  }
}

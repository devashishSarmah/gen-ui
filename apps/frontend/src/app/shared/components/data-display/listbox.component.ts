import { Component, Input, ChangeDetectionStrategy, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Listbox, Option } from '@angular/aria/listbox';

export interface ListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
}

@Component({
  selector: 'app-listbox',
  standalone: true,
  imports: [CommonModule, Listbox, Option],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="listbox-wrapper">
      <label *ngIf="label" class="listbox-label" [id]="labelId">{{ label }}</label>
      <ul
        ngListbox
        [(values)]="selectedValues"
        [multi]="multi"
        [orientation]="orientation"
        [selectionMode]="selectionMode"
        [disabled]="disabled"
        [wrap]="wrap"
        [attr.aria-labelledby]="label ? labelId : null"
        class="listbox-list"
      >
        <li
          *ngFor="let option of options"
          ngOption
          [value]="option.value"
          [label]="option.label"
          [disabled]="option.disabled ?? false"
          class="listbox-option"
        >
          <span *ngIf="option.icon" class="listbox-option-icon" aria-hidden="true">
            {{ option.icon }}
          </span>
          <div class="listbox-option-content">
            <span class="listbox-option-label">{{ option.label }}</span>
            <span *ngIf="option.description" class="listbox-option-desc">
              {{ option.description }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .listbox-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .listbox-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ds-text-secondary);
      }

      .listbox-list {
        list-style: none;
        padding: 0.25rem;
        margin: 0;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        background: var(--ds-surface-glass);
        backdrop-filter: blur(14px);
        max-height: 280px;
        overflow-y: auto;
      }

      :host ::ng-deep [ngOption] {
        padding: 0.75rem 1rem;
        border-radius: var(--ds-radius-sm, 8px);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: background-color 0.15s ease;
        color: var(--ds-text-primary);
        font-size: 0.9rem;
      }

      :host ::ng-deep [ngOption]:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      :host ::ng-deep [ngOption][aria-selected='true'] {
        background: linear-gradient(
          135deg,
          rgba(8, 255, 243, 0.12) 0%,
          rgba(77, 58, 255, 0.12) 100%
        );
        color: var(--ds-accent-teal);
      }

      :host ::ng-deep [ngOption]:focus-visible,
      :host ::ng-deep [ngOption][data-active='true'] {
        outline: none;
        box-shadow: 0 0 0 2px rgba(8, 255, 243, 0.4);
      }

      :host ::ng-deep [ngOption][aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .listbox-option-icon {
        font-size: 1.25rem;
        min-width: 1.5rem;
        text-align: center;
      }

      .listbox-option-content {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .listbox-option-label {
        font-weight: 500;
      }

      .listbox-option-desc {
        font-size: 0.8rem;
        color: var(--ds-text-secondary);
      }
    `,
  ],
})
export class ListboxComponent {
  @Input() options: ListboxOption[] = [];
  @Input() label = '';
  @Input() multi = false;
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() selectionMode: 'follow' | 'explicit' = 'explicit';
  @Input() disabled = false;
  @Input() wrap = true;

  selectedValues = model<string[]>([]);

  get labelId(): string {
    return `listbox-label-${Math.random().toString(36).slice(2, 9)}`;
  }
}

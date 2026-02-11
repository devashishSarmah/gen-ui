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
        gap: 0.75rem;
      }

      .listbox-label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--ds-text-primary);
        letter-spacing: 0.02em;
      }

      .listbox-list {
        list-style: none;
        padding: 0.5rem;
        margin: 0;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-xl);
        background: var(--ds-surface-glass-strong);
        backdrop-filter: blur(32px) saturate(180%);
        max-height: 320px;
        overflow-y: auto;
        box-shadow: var(--ds-shadow-medium), 0 0 0 1px rgba(255, 255, 255, 0.06);
      }

      :host ::ng-deep [ngOption] {
        padding: 1rem 1.25rem;
        border-radius: var(--ds-radius-lg);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--ds-text-primary);
        font-size: 0.9rem;
        position: relative;
        margin-bottom: 0.25rem;
      }

      :host ::ng-deep [ngOption]::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        border-radius: 0 var(--ds-radius-sm) var(--ds-radius-sm) 0;
        background: transparent;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host ::ng-deep [ngOption]:hover {
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.08), rgba(91, 74, 255, 0.08));
        transform: translateX(4px);
        box-shadow: inset 0 0 0 1px rgba(0, 255, 245, 0.12);
      }

      :host ::ng-deep [ngOption]:hover::before {
        background: linear-gradient(180deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        box-shadow: 0 0 8px var(--ds-accent-teal);
      }

      :host ::ng-deep [ngOption][aria-selected='true'] {
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.15), rgba(91, 74, 255, 0.15));
        border: 1px solid var(--ds-border-glow);
        box-shadow: 0 4px 16px rgba(0, 255, 245, 0.2), 0 0 24px rgba(91, 74, 255, 0.15);
      }

      :host ::ng-deep [ngOption][aria-selected='true']::before {
        background: linear-gradient(180deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        box-shadow: 0 0 12px var(--ds-accent-teal);
      }

      :host ::ng-deep [ngOption][aria-selected='true'] .listbox-option-label {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 700;
        filter: drop-shadow(0 0 8px rgba(0, 255, 245, 0.4));
      }

      :host ::ng-deep [ngOption]:focus-visible,
      :host ::ng-deep [ngOption][data-active='true'] {
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 255, 245, 0.3), 0 0 24px rgba(0, 255, 245, 0.2);
      }

      :host ::ng-deep [ngOption][aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none !important;
      }

      :host ::ng-deep [ngOption][aria-disabled='true']:hover {
        background: transparent;
        box-shadow: none;
      }

      .listbox-option-icon {
        font-size: 1.5rem;
        min-width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.1), rgba(91, 74, 255, 0.1));
        border-radius: var(--ds-radius-md);
        border: 1px solid rgba(0, 255, 245, 0.2);
        box-shadow: 0 4px 12px rgba(0, 255, 245, 0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host ::ng-deep [ngOption]:hover .listbox-option-icon {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 255, 245, 0.3), 0 0 24px rgba(91, 74, 255, 0.2);
        border-color: var(--ds-accent-teal);
      }

      :host ::ng-deep [ngOption][aria-selected='true'] .listbox-option-icon {
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.2), rgba(91, 74, 255, 0.2));
        border-color: var(--ds-accent-teal);
        box-shadow: 0 6px 20px rgba(0, 255, 245, 0.3), 0 0 32px rgba(91, 74, 255, 0.25);
      }

      .listbox-option-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
      }

      .listbox-option-label {
        font-weight: 600;
        letter-spacing: 0.01em;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .listbox-option-desc {
        font-size: 0.8rem;
        color: var(--ds-text-secondary);
        line-height: 1.4;
        opacity: 0.9;
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

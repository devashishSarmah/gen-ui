import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AccordionGroup,
  AccordionTrigger,
  AccordionPanel,
  AccordionContent,
} from '@angular/aria/accordion';

export interface AccordionItem {
  id: string;
  title: string;
  content?: string;
  contentTemplate?: any;
  disabled?: boolean;
  expanded?: boolean;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule, AccordionGroup, AccordionTrigger, AccordionPanel, AccordionContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      ngAccordionGroup
      [multiExpandable]="multiExpandable"
      [wrap]="wrap"
      class="accordion-wrapper"
    >
      <div *ngFor="let item of items" class="accordion-item">
        <h3 class="accordion-heading">
          <button
            ngAccordionTrigger
            [panelId]="item.id"
            [disabled]="item.disabled ?? false"
            [expanded]="item.expanded ?? false"
            (expandedChange)="onPanelToggle(item, $event)"
            class="accordion-trigger"
          >
            <span class="accordion-trigger-text">{{ item.title }}</span>
            <span class="accordion-trigger-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.47 5.97a.75.75 0 0 1 1.06 0L8 8.44l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z"/>
              </svg>
            </span>
          </button>
        </h3>
        <div ngAccordionPanel [panelId]="item.id" class="accordion-panel">
          <ng-template ngAccordionContent>
            <div class="accordion-content">
              <ng-container *ngIf="item.contentTemplate; else textContent">
                <ng-container *ngTemplateOutlet="item.contentTemplate"></ng-container>
              </ng-container>
              <ng-template #textContent>
                {{ item.content }}
              </ng-template>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .accordion-wrapper {
        width: 100%;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-xl);
        overflow: hidden;
        background: var(--ds-surface-glass);
        backdrop-filter: blur(24px) saturate(180%);
        box-shadow: var(--ds-shadow-soft), 0 0 0 1px rgba(255, 255, 255, 0.06);
      }

      .accordion-item {
        border-bottom: 1px solid var(--ds-border);
        transition: background-color 0.3s ease;
      }

      .accordion-item:last-child {
        border-bottom: none;
      }

      .accordion-item:hover {
        background-color: rgba(255, 255, 255, 0.03);
      }

      .accordion-heading {
        margin: 0;
      }

      .accordion-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.875rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--ds-text-primary);
        font-size: 0.825rem;
        font-weight: 600;
        text-align: left;
        transition: all 0.3s ease;
      }

      .accordion-trigger:hover {
        background: linear-gradient(90deg, rgba(0, 255, 245, 0.05), transparent);
      }

      .accordion-trigger:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 2px rgba(0, 255, 245, 0.4), inset 0 0 24px rgba(0, 255, 245, 0.1);
      }

      :host ::ng-deep [ngAccordionTrigger][aria-expanded='true'] .accordion-trigger {
        background: linear-gradient(90deg, rgba(0, 255, 245, 0.08), transparent);
      }

      :host ::ng-deep [ngAccordionTrigger][aria-expanded='true'] .accordion-trigger-icon {
        transform: rotate(180deg);
        color: var(--ds-accent-teal);
      }

      :host ::ng-deep [ngAccordionTrigger][aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .accordion-trigger-icon {
        display: flex;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--ds-text-secondary);
        filter: drop-shadow(0 0 8px rgba(0, 255, 245, 0.3));
      }

      .accordion-content {
        padding: 0 0.875rem 0.875rem;
        color: var(--ds-text-secondary);
        font-size: 0.8rem;
        line-height: 1.7;
        animation: accordionOpen 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes accordionOpen {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class AccordionComponent {
  @Input() items: AccordionItem[] = [];
  @Input() multiExpandable = true;
  @Input() wrap = false;

  @Output() panelToggle = new EventEmitter<{ id: string; title: string; expanded: boolean }>();

  onPanelToggle(item: AccordionItem, expanded: boolean) {
    item.expanded = expanded;
    this.panelToggle.emit({ id: item.id, title: item.title, expanded });
  }
}

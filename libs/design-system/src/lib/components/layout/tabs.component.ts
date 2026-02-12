import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tabs, TabList, Tab, TabPanel, TabContent } from '@angular/aria/tabs';

export interface TabItem {
  label: string;
  value: string;
  disabled?: boolean;
  contentTemplate?: any;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, Tabs, TabList, Tab, TabPanel, TabContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div ngTabs class="tabs-wrapper">
      <div
        ngTabList
        [selectionMode]="selectionMode"
        [selectedTab]="activeTab()"
        [orientation]="orientation"
        [wrap]="wrap"
        class="tabs-header"
      >
        <div
          *ngFor="let tab of tabs"
          ngTab
          [value]="tab.value"
          [disabled]="tab.disabled ?? false"
          class="tab-button"
        >
          {{ tab.label }}
        </div>
      </div>
      <ng-container *ngFor="let tab of tabs">
        <div ngTabPanel [value]="tab.value" class="tab-pane">
          <ng-template ngTabContent>
            <ng-container *ngIf="tab.contentTemplate; else defaultContent">
              <ng-container *ngTemplateOutlet="tab.contentTemplate"></ng-container>
            </ng-container>
            <ng-template #defaultContent>
              <ng-content></ng-content>
            </ng-template>
          </ng-template>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .tabs-wrapper {
        width: 100%;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-xl);
        overflow: hidden;
        background: var(--ds-surface-glass);
        backdrop-filter: blur(24px) saturate(180%);
        box-shadow: var(--ds-shadow-soft), 0 0 0 1px rgba(255, 255, 255, 0.06);
      }

      :host ::ng-deep [ngTabList] {
        display: flex;
        border-bottom: 1px solid var(--ds-border);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
        list-style: none;
        padding: 0;
        margin: 0;
        gap: 0.25rem;
        padding: 0.5rem;
      }

      :host ::ng-deep [ngTabList][aria-orientation='vertical'] {
        flex-direction: column;
        border-bottom: none;
        border-right: 1px solid var(--ds-border);
      }

      :host ::ng-deep [ngTab] {
        flex: 1;
        padding: 0.5rem 0.875rem;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--ds-text-secondary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: var(--ds-radius-md);
        text-align: center;
        position: relative;
      }

      :host ::ng-deep [ngTab]::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%) scaleX(0);
        width: 80%;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--ds-accent-teal), transparent);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host ::ng-deep [ngTab]:hover {
        background-color: rgba(255, 255, 255, 0.08);
        color: var(--ds-text-primary);
      }

      :host ::ng-deep [ngTab][aria-selected='true'] {
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.12), rgba(91, 74, 255, 0.12));
        color: var(--ds-text-primary);
        font-weight: 600;
      }

      :host ::ng-deep [ngTab][aria-selected='true']::after {
        transform: translateX(-50%) scaleX(1);
      }

      :host ::ng-deep [ngTab][aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      :host ::ng-deep [ngTab]:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 255, 245, 0.4), 0 0 24px rgba(0, 255, 245, 0.15);
      }

      .tab-pane {
        padding: 0.75rem;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class TabsComponent implements OnChanges {
  @Input() tabs: TabItem[] = [];
  @Input() defaultTab = '';
  @Input() selectionMode: 'follow' | 'explicit' = 'follow';
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() wrap = true;

  activeTab = signal('');

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tabs'] || changes['defaultTab']) {
      this.updateActiveTab();
    }
  }

  private updateActiveTab() {
    if (!this.tabs || this.tabs.length === 0) {
      this.activeTab.set('');
      return;
    }

    if (this.defaultTab) {
      const exists = this.tabs.some((t) => t.value === this.defaultTab);
      if (exists) {
        this.activeTab.set(this.defaultTab);
        return;
      }
    }

    this.activeTab.set(this.tabs[0]?.value || '');
  }
}

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
        border-radius: var(--ds-radius-lg);
        overflow: hidden;
        background: var(--ds-surface-glass);
        backdrop-filter: blur(14px);
      }

      :host ::ng-deep [ngTabList] {
        display: flex;
        border-bottom: 1px solid var(--ds-border);
        background: rgba(255, 255, 255, 0.03);
        list-style: none;
        padding: 0;
        margin: 0;
      }

      :host ::ng-deep [ngTabList][aria-orientation='vertical'] {
        flex-direction: column;
        border-bottom: none;
        border-right: 1px solid var(--ds-border);
      }

      :host ::ng-deep [ngTab] {
        flex: 1;
        padding: 1rem;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 0.95rem;
        color: var(--ds-text-secondary);
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        text-align: center;
      }

      :host ::ng-deep [ngTab]:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      :host ::ng-deep [ngTab][aria-selected='true'] {
        border-bottom-color: var(--ds-accent-teal);
        color: var(--ds-text-primary);
        font-weight: 600;
      }

      :host ::ng-deep [ngTab][aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      :host ::ng-deep [ngTab]:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(8, 255, 243, 0.4), 0 0 0 5px rgba(8, 255, 243, 0.12);
      }

      .tab-pane {
        padding: 1.25rem;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
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

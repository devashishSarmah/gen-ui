import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  ChangeDetectionStrategy,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  label: string;
  value: string;
  contentTemplate?: any;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs-wrapper">
      <div class="tabs-header">
        <button
          *ngFor="let tab of tabs"
          (click)="selectTab(tab.value)"
          [class.tab-active]="activeTab() === tab.value"
          class="tab-button"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="tabs-content">
        <ng-container *ngFor="let tab of tabs">
          <div *ngIf="activeTab() === tab.value" class="tab-pane">
            <ng-container *ngIf="tab.contentTemplate; else dynamicTabContent">
              <ng-container *ngTemplateOutlet="tab.contentTemplate"></ng-container>
            </ng-container>
            <ng-template #dynamicTabContent>
              <ng-container #tabsHost></ng-container>
            </ng-template>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .tabs-wrapper {
        width: 100%;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }

      .tabs-header {
        display: flex;
        border-bottom: 1px solid #e0e0e0;
        background-color: #fafafa;
      }

      .tab-button {
        flex: 1;
        padding: 1rem;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s ease;
        border-bottom: 3px solid transparent;
      }

      .tab-button:hover {
        background-color: #f0f0f0;
      }

      .tab-active {
        border-bottom-color: #2196f3;
        color: #2196f3;
        font-weight: 600;
      }

      .tabs-content {
        padding: 1rem;
      }

      .tab-pane {
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
  @Input() tabs: Tab[] = [];
  @Input() defaultTab = '';

  @ViewChild('tabsHost', { read: ViewContainerRef }) tabsHost!: ViewContainerRef;

  activeTab = signal('');

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tabs'] || changes['defaultTab']) {
      this.updateActiveTab();
    }
  }

  selectTab(tabValue: string) {
    this.activeTab.set(tabValue);
  }

  private updateActiveTab() {
    if (!this.tabs || this.tabs.length === 0) {
      this.activeTab.set('');
      return;
    }

    if (this.defaultTab) {
      const defaultTabExists = this.tabs.some((tab) => tab.value === this.defaultTab);
      if (defaultTabExists) {
        this.activeTab.set(this.defaultTab);
        return;
      }
    }

    this.activeTab.set(this.tabs[0]?.value || '');
  }
}

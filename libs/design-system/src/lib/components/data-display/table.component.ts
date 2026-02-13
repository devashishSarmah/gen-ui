import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper">
      <table class="table" [class.table-striped]="striped" [class.table-bordered]="bordered">
        <thead>
          <tr>
            <th
              *ngFor="let column of columns"
              [style.width]="column.width"
              scope="col"
              [attr.aria-sort]="getAriaSortValue(column)"
              [class.sortable]="column.sortable"
              (click)="column.sortable ? toggleSort(column.key) : null"
            >
              {{ column.label }}
              <span *ngIf="column.sortable" class="sortable-indicator" [class.active]="sortKey() === column.key">
                {{ sortKey() === column.key ? (sortDir() === 'asc' ? '↑' : '↓') : '⇅' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Virtual scroll for large datasets (>100 rows) -->
          <ng-container *ngIf="useVirtualScroll(); else normalRows">
            <tr>
              <td [attr.colspan]="columns.length" style="padding:0; height:0; border:none;">
                <cdk-virtual-scroll-viewport
                  [itemSize]="rowHeight"
                  [style.height.px]="viewportHeight"
                  class="virtual-viewport"
                >
                  <table class="table inner-table" [class.table-striped]="striped">
                    <tbody>
                      <tr *cdkVirtualFor="let row of displayData()" [class.table-row-hover]="hoverable">
                        <td *ngFor="let column of columns" [style.width]="column.width">
                          {{ getNestedValue(row, column.key) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </cdk-virtual-scroll-viewport>
              </td>
            </tr>
          </ng-container>
          <ng-template #normalRows>
            <tr *ngFor="let row of displayData()" [class.table-row-hover]="hoverable">
              <td *ngFor="let column of columns">
                {{ getNestedValue(row, column.key) }}
              </td>
            </tr>
          </ng-template>
          <tr *ngIf="displayData().length === 0">
            <td [attr.colspan]="columns.length" class="table-empty">
              {{ data.length > 0 ? 'No matching results' : 'No data available' }}
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Pagination controls -->
      <div *ngIf="pageSize > 0" class="table-pagination">
        <span class="table-pagination-info">
          {{ paginationInfo() }}
        </span>
        <div class="table-pagination-controls">
          <button
            class="table-page-btn"
            [disabled]="currentPage() === 0"
            (click)="goToPage(currentPage() - 1)"
            aria-label="Previous page"
          >‹</button>
          <span class="table-page-indicator">{{ currentPage() + 1 }} / {{ pageCount() }}</span>
          <button
            class="table-page-btn"
            [disabled]="currentPage() >= pageCount() - 1"
            (click)="goToPage(currentPage() + 1)"
            aria-label="Next page"
          >›</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .table-wrapper {
        width: 100%;
        overflow-x: auto;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        color: var(--ds-text-primary);
      }

      .inner-table { margin: 0; }

      .table-striped tbody tr:nth-child(odd) {
        background-color: rgba(255, 255, 255, 0.02);
      }

      .table-bordered {
        border: 1px solid var(--ds-border);
      }

      .table-bordered th,
      .table-bordered td {
        border: 1px solid var(--ds-border);
      }

      th {
        background-color: rgba(255, 255, 255, 0.04);
        padding: 0.5rem 0.75rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.8rem;
        border-bottom: 1px solid var(--ds-border);
        user-select: none;
      }

      th.sortable {
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      th.sortable:hover {
        background-color: rgba(0, 255, 245, 0.06);
      }

      td {
        padding: 0.5rem 0.75rem;
        font-size: 0.825rem;
      }

      .sortable-indicator {
        margin-left: 0.5rem;
        opacity: 0.4;
        font-size: 0.875rem;
        transition: opacity 0.2s ease;
      }

      .sortable-indicator.active {
        opacity: 1;
        color: var(--ds-accent-teal);
      }

      .table-row-hover:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      .table-empty {
        text-align: center;
        padding: 2rem;
        color: var(--ds-text-secondary);
      }

      .virtual-viewport {
        width: 100%;
      }

      .table-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        border-top: 1px solid var(--ds-border);
        font-size: 0.775rem;
        color: var(--ds-text-secondary);
      }

      .table-pagination-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .table-page-btn {
        background: transparent;
        border: 1px solid var(--ds-border);
        color: var(--ds-text-primary);
        padding: 0.25rem 0.5rem;
        border-radius: var(--ds-radius-sm);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }

      .table-page-btn:hover:not(:disabled) {
        background: rgba(0, 255, 245, 0.08);
        border-color: var(--ds-accent-teal);
      }

      .table-page-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .table-page-indicator {
        font-size: 0.775rem;
        min-width: 3rem;
        text-align: center;
      }

      @media (max-width: 640px) {
        th {
          padding: 0.4rem 0.5rem;
          font-size: 0.72rem;
          white-space: nowrap;
        }

        td {
          padding: 0.4rem 0.5rem;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .table-pagination {
          flex-wrap: wrap;
          gap: 0.35rem;
          font-size: 0.7rem;
        }
      }
    `,
  ],
})
export class TableComponent implements OnInit, OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() striped = true;
  @Input() bordered = true;
  @Input() hoverable = true;
  @Input() pageSize = 0;
  @Input() rowHeight = 36;
  @Input() maxVisibleRows = 15;

  @Output() sortChange = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

  /** Internal sort state */
  readonly sortKey = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  /** Internal pagination state */
  readonly currentPage = signal(0);

  /** Whether the dataset is large enough to warrant virtual scrolling */
  readonly useVirtualScroll = computed(() => this.processedData().length > 100);

  /** Viewport height for CDK virtual scroll */
  get viewportHeight(): number {
    return this.rowHeight * Math.min(this.maxVisibleRows, this.processedData().length);
  }

  /** Processed data: filtered (externally) + sorted */
  private readonly dataSignal = signal<any[]>([]);
  readonly processedData = computed(() => {
    let result = [...this.dataSignal()];
    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir();
      result.sort((a, b) => {
        const aVal = this.getNestedValue(a, key);
        const bVal = this.getNestedValue(b, key);
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        let cmp: number;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          cmp = aNum - bNum;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return dir === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  });

  /** Display data: sorted + paginated */
  readonly displayData = computed(() => {
    const all = this.processedData();
    if (this.pageSize <= 0) return all;
    const start = this.currentPage() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  readonly pageCount = computed(() => {
    if (this.pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(this.processedData().length / this.pageSize));
  });

  readonly paginationInfo = computed(() => {
    const total = this.processedData().length;
    if (this.pageSize <= 0) return `${total} rows`;
    const start = this.currentPage() * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);
    return `${start}–${end} of ${total}`;
  });

  ngOnInit(): void {
    this.dataSignal.set(this.data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSignal.set(this.data);
      this.currentPage.set(0);
    }
  }

  toggleSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.currentPage.set(0);
    this.sortChange.emit({ key: this.sortKey(), direction: this.sortDir() });
  }

  goToPage(page: number): void {
    this.currentPage.set(Math.max(0, Math.min(page, this.pageCount() - 1)));
  }

  getAriaSortValue(column: TableColumn): string | null {
    if (!column.sortable) return null;
    if (this.sortKey() !== column.key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? '';
  }

  /**
   * Called externally by InteractionService / ClientDataEngine
   * to update the displayed data (after filtering).
   */
  updateData(filteredData: any[]): void {
    this.dataSignal.set(filteredData);
    this.currentPage.set(0);
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrapper">
      <table class="table" [class.table-striped]="striped" [class.table-bordered]="bordered">
        <thead>
          <tr>
            <th
              *ngFor="let column of columns"
              [style.width]="column.width"
              scope="col"
              [attr.aria-sort]="column.sortable ? 'none' : null"
            >
              {{ column.label }}
              <span *ngIf="column.sortable" class="sortable-indicator">⇅</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data; let i = index" [class.table-row-hover]="hoverable">
            <td *ngFor="let column of columns">
              {{ getNestedValue(row, column.key) }}
            </td>
          </tr>
          <tr *ngIf="!data || data.length === 0">
            <td [attr.colspan]="columns.length" class="table-empty">No data available</td>
          </tr>
        </tbody>
      </table>
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
      }

      td {
        padding: 0.5rem 0.75rem;
        font-size: 0.825rem;
      }

      .sortable-indicator {
        margin-left: 0.5rem;
        opacity: 0.5;
        font-size: 0.875rem;
      }

      .table-row-hover tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      .table-empty {
        text-align: center;
        padding: 2rem;
        color: var(--ds-text-secondary);
      }
    `,
  ],
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() striped = true;
  @Input() bordered = true;
  @Input() hoverable = true;

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? '';
  }
}

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
            <th *ngFor="let column of columns" [style.width]="column.width">
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
      }

      .table-striped tbody tr:nth-child(odd) {
        background-color: #f9f9f9;
      }

      .table-bordered {
        border: 1px solid #ddd;
      }

      .table-bordered th,
      .table-bordered td {
        border: 1px solid #ddd;
      }

      th {
        background-color: #f5f5f5;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
      }

      td {
        padding: 1rem;
      }

      .sortable-indicator {
        margin-left: 0.5rem;
        opacity: 0.5;
        font-size: 0.875rem;
      }

      .table-row-hover tbody tr:hover {
        background-color: #f0f0f0;
      }

      .table-empty {
        text-align: center;
        padding: 2rem;
        color: #999;
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

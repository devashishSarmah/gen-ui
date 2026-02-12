import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="grid-layout"
      [style.display]="'grid'"
      [style.grid-template-columns]="gridTemplate"
      [style.gap.px]="gap"
      [style.padding.px]="padding"
    >
      <ng-container #gridHost></ng-container>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .grid-layout {
        width: 100%;
        box-sizing: border-box;
      }
    `,
  ],
})
export class GridComponent {
  /** Number of columns, or a CSS grid-template-columns string */
  @Input() columns: number | string = 1;
  /** Gap between grid items in px */
  @Input() gap = 16;
  /** Padding in px */
  @Input() padding = 0;
  /**
   * If set, uses auto-fit with this minimum child width (px).
   * Overrides `columns` for a responsive layout.
   * e.g. minChildWidth=200 → repeat(auto-fit, minmax(200px, 1fr))
   */
  @Input() minChildWidth?: number;
  @Input() contentTemplate: any;
  @ViewChild('gridHost', { read: ViewContainerRef }) gridHost!: ViewContainerRef;

  get gridTemplate(): string {
    if (this.minChildWidth && this.minChildWidth > 0) {
      return `repeat(auto-fit, minmax(${this.minChildWidth}px, 1fr))`;
    }
    if (typeof this.columns === 'number') {
      return `repeat(${this.columns}, 1fr)`;
    }
    return this.columns;
  }
}

import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [style.display]="'grid'"
      [style.grid-template-columns]="gridTemplate"
      [style.gap.px]="gap"
      #gridHost
    >
      <!-- Children will be rendered here by dynamic UI system -->
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class GridComponent {
  @Input() columns = 1;
  @Input() gap = 16;
  @Input() contentTemplate: any;
  @ViewChild('gridHost', { read: ViewContainerRef }) gridHost!: ViewContainerRef;

  get gridTemplate(): string {
    if (typeof this.columns === 'number') {
      return `repeat(${this.columns}, 1fr)`;
    }
    return this.columns;
  }
}

import { Component, Input, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Split Layout — sidebar + main content pattern.
 *
 * Renders a two-pane layout using CSS grid:
 *   [sidebar | main]  or  [main | sidebar]
 *
 * All children are rendered into the grid, so the AI should supply
 * exactly 2 children: the sidebar content (wrapped in a flexbox/card)
 * and the main content (wrapped in a flexbox/card).
 *
 * Usage:
 *   { "type": "split-layout",
 *     "props": { "sidebarWidth": 280, "position": "left", "gap": 16 },
 *     "children": [
 *       { "type": "flexbox", ... sidebar content ... },
 *       { "type": "flexbox", ... main content ... }
 *     ] }
 */
@Component({
  selector: 'app-split-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="split-layout"
      [style.grid-template-columns]="gridColumns"
      [style.gap]="gap + 'px'"
    >
      <ng-container #splitHost></ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .split-layout {
      display: grid;
      width: 100%;
      box-sizing: border-box;
      min-height: 0;
    }

    /* First child = sidebar style hints */
    .split-layout > :first-child {
      overflow: auto;
    }

    .split-layout > :last-child {
      min-width: 0;
      overflow: auto;
    }

    /* Responsive: stack on small screens */
    @media (max-width: 640px) {
      .split-layout {
        grid-template-columns: 1fr !important;
      }
    }
  `],
})
export class SplitLayoutComponent {
  /** Fixed sidebar width in px or CSS value */
  @Input() sidebarWidth: number | string = 280;
  /** Sidebar position */
  @Input() position: 'left' | 'right' = 'left';
  /** Gap between panes */
  @Input() gap = 16;
  @Input() contentTemplate: any;

  @ViewChild('splitHost', { read: ViewContainerRef }) splitHost!: ViewContainerRef;

  get gridColumns(): string {
    const sidebar = typeof this.sidebarWidth === 'number'
      ? `${this.sidebarWidth}px`
      : this.sidebarWidth;
    return this.position === 'left'
      ? `${sidebar} 1fr`
      : `1fr ${sidebar}`;
  }
}

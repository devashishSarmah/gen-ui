import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="'container container-' + variant"
      [style.max-width.px]="maxWidth"
    >
      <ng-container #containerHost></ng-container>
    </div>
  `,
  styles: [
    `
      .container {
        width: 100%;
        padding: 0.75rem;
        box-sizing: border-box;
      }

      .container-default {
        margin: 0 auto;
      }

      .container-fluid {
        width: 100%;
      }

      .container-card {
        background: var(--ds-surface-glass);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        margin: 1rem 0;
        backdrop-filter: blur(14px);
        box-shadow: var(--ds-shadow-soft);
      }

      @media (max-width: 640px) {
        .container {
          padding: 0.5rem;
          max-width: 100% !important;
        }

        .container-card {
          margin: 0.5rem 0;
          border-radius: var(--ds-radius-md);
        }
      }
    `,
  ],
})
export class ContainerComponent {
  @Input() maxWidth = 1200;
  @Input() variant: 'default' | 'fluid' | 'card' = 'default';
  @Input() contentTemplate: any;
  @ViewChild('containerHost', { read: ViewContainerRef }) containerHost!: ViewContainerRef;
}

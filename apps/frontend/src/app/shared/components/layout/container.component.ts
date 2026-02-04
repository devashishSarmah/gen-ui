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
      #containerHost
    >
      <!-- Children will be rendered here by dynamic UI system -->
    </div>
  `,
  styles: [
    `
      .container {
        width: 100%;
        padding: 1rem;
        box-sizing: border-box;
      }

      .container-default {
        margin: 0 auto;
      }

      .container-fluid {
        width: 100%;
      }

      .container-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin: 1rem 0;
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

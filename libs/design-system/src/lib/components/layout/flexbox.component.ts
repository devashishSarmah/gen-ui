import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flexbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flexbox"
      [style.flex-direction]="direction"
      [style.align-items]="alignItems"
      [style.justify-content]="justifyContent"
      [style.flex-wrap]="wrap"
      [style.gap]="normalizeSpacing(gap)"
      [style.padding]="normalizeSpacing(padding)"
      #flexHost
    >
      <!-- Children will be rendered here by dynamic UI system -->
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .flexbox {
        display: flex;
        width: 100%;
        box-sizing: border-box;
      }
    `,
  ],
})
export class FlexboxComponent {
  @Input() direction: 'row' | 'column' | 'row-reverse' | 'column-reverse' = 'column';
  @Input() alignItems: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline' = 'stretch';
  @Input() justifyContent:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly' = 'flex-start';
  @Input() wrap: 'nowrap' | 'wrap' | 'wrap-reverse' = 'nowrap';
  @Input() gap: string | number = 0;
  @Input() padding: string | number = 0;
  @Input() contentTemplate: any;

  @ViewChild('flexHost', { read: ViewContainerRef }) flexHost!: ViewContainerRef;

  normalizeSpacing(value: string | number): string {
    if (typeof value === 'number') {
      return `${value}px`;
    }
    return value || '0';
  }
}

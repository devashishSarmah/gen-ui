import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-heading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container [ngSwitch]="level">
      <h1 *ngSwitchCase="1" [attr.aria-label]="ariaLabel">{{ text }}</h1>
      <h2 *ngSwitchCase="2" [attr.aria-label]="ariaLabel">{{ text }}</h2>
      <h3 *ngSwitchCase="3" [attr.aria-label]="ariaLabel">{{ text }}</h3>
      <h4 *ngSwitchCase="4" [attr.aria-label]="ariaLabel">{{ text }}</h4>
      <h5 *ngSwitchCase="5" [attr.aria-label]="ariaLabel">{{ text }}</h5>
      <h6 *ngSwitchDefault [attr.aria-label]="ariaLabel">{{ text }}</h6>
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 0;
        line-height: 1.2;
        color: var(--ds-text-primary);
        font-family: var(--ds-font-display);
        letter-spacing: -0.02em;
      }
    `,
  ],
})
export class HeadingComponent {
  @Input() text = '';
  @Input() level: 1 | 2 | 3 | 4 | 5 | 6 = 2;
  @Input() ariaLabel = '';
}

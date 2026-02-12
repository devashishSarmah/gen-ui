import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-divider',
  standalone: true,
  imports: [CommonModule],
  template: `
    <hr class="divider" [attr.aria-label]="ariaLabel" />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .divider {
        border: none;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        margin: 0;
      }
    `,
  ],
})
export class DividerComponent {
  @Input() ariaLabel = '';
}

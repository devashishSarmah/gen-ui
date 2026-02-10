import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paragraph',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p [attr.aria-label]="ariaLabel">{{ text }}</p>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      p {
        margin: 0;
        line-height: 1.5;
        color: var(--ds-text-secondary);
      }
    `,
  ],
})
export class ParagraphComponent {
  @Input() text = '';
  @Input() ariaLabel = '';
}

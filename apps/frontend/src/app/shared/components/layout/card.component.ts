import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [class.card-elevated]="elevated" [style.padding.rem]="padding">
      <div *ngIf="title" class="card-header">
        <h3 class="card-title">{{ title }}</h3>
        <!-- Optional header content can be placed here -->
      </div>
      <div class="card-content" #cardContent>
        <!-- Children will be rendered here by dynamic UI system -->
      </div>
      <div *ngIf="footer" class="card-footer" #cardFooter>
        <!-- Footer content will be rendered here -->
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: linear-gradient(180deg, rgba(16, 18, 25, 0.92), rgba(10, 12, 18, 0.94));
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        overflow: hidden;
        transition: all 0.2s ease;
        box-shadow: var(--ds-shadow-soft);
      }

      .card-elevated {
        box-shadow: var(--ds-shadow-soft), var(--ds-shadow-glow);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--ds-border);
        padding: 1.25rem;
      }

      .card-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--ds-text-primary);
      }

      .card-content {
        padding: 1.25rem;
      }

      .card-footer {
        border-top: 1px solid var(--ds-border);
        padding: 1.25rem;
        background-color: rgba(255, 255, 255, 0.03);
      }
    `,
  ],
})
export class CardComponent {
  @Input() title = '';
  @Input() padding = 1;
  @Input() elevated = true;
  @Input() footer = false;
  @Input() contentTemplate: any;
  @Input() headerTemplate: any;
  @Input() footerTemplate: any;
  @ViewChild('cardContent', { read: ViewContainerRef }) cardContent!: ViewContainerRef;
  @ViewChild('cardFooter', { read: ViewContainerRef }) cardFooter!: ViewContainerRef;
}

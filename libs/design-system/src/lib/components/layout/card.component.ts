import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [class.card-elevated]="elevated" [style.padding.px]="padding">
      <div *ngIf="title" class="card-header">
        <h3 class="card-title">{{ title }}</h3>
        <!-- Optional header content can be placed here -->
      </div>
      <div class="card-content">
        <ng-container #cardContent></ng-container>
      </div>
      <div *ngIf="footer" class="card-footer">
        <ng-container #cardFooter></ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: linear-gradient(135deg, rgba(18, 20, 28, 0.7), rgba(10, 12, 18, 0.85));
        backdrop-filter: blur(24px) saturate(180%);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-xl);
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--ds-shadow-soft), 0 0 0 1px rgba(255, 255, 255, 0.08);
        position: relative;
      }

      .card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.03), transparent 50%, rgba(91, 74, 255, 0.03));
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      }

      .card:hover::before {
        opacity: 1;
      }

      .card:hover {
        transform: translateY(-2px);
        border-color: var(--ds-border-strong);
        box-shadow: var(--ds-shadow-medium), 0 0 48px rgba(0, 255, 245, 0.08);
      }

      .card-elevated {
        box-shadow: var(--ds-shadow-medium), var(--ds-shadow-glow-sm);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--ds-border);
        padding: 0.6rem 0.75rem;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
      }

      .card-title {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--ds-text-primary);
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .card-content {
        padding: 0.6rem 0.75rem;
      }

      .card-footer {
        border-top: 1px solid var(--ds-border);
        padding: 0.6rem 0.75rem;
        background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.02));
      }
    `,
  ],
})
export class CardComponent {
  @Input() title = '';
  @Input() padding = 12;
  @Input() elevated = true;
  @Input() footer = false;
  @Input() contentTemplate: any;
  @Input() headerTemplate: any;
  @Input() footerTemplate: any;
  @ViewChild('cardContent', { read: ViewContainerRef }) cardContent!: ViewContainerRef;
  @ViewChild('cardFooter', { read: ViewContainerRef }) cardFooter!: ViewContainerRef;
}

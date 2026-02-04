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
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .card-elevated {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
        padding: 1rem;
      }

      .card-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .card-content {
        padding: 1rem;
      }

      .card-footer {
        border-top: 1px solid #e0e0e0;
        padding: 1rem;
        background-color: #fafafa;
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

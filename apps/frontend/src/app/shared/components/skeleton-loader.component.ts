import { Component, Input, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [NgIf, NgFor],
  template: `
    <div class="skeleton-container" [style.opacity]="opacity">
      <ng-container *ngIf="type === 'text'">
        <div class="skeleton-line" [style.width]="width"></div>
      </ng-container>

      <ng-container *ngIf="type === 'paragraph'">
        <div class="skeleton-line" style="width: 100%; margin-bottom: 0.5rem"></div>
        <div class="skeleton-line" style="width: 95%; margin-bottom: 0.5rem"></div>
        <div class="skeleton-line" style="width: 90%"></div>
      </ng-container>

      <ng-container *ngIf="type === 'card'">
        <div class="skeleton-card">
          <div class="skeleton-card-header">
            <div class="skeleton-line" style="width: 40%; height: 1.5rem"></div>
          </div>
          <div class="skeleton-card-body">
            <div class="skeleton-line" style="width: 100%; margin-bottom: 0.5rem"></div>
            <div class="skeleton-line" style="width: 100%; margin-bottom: 0.5rem"></div>
            <div class="skeleton-line" style="width: 80%"></div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="type === 'button'">
        <div class="skeleton-button"></div>
      </ng-container>

      <ng-container *ngIf="type === 'form'">
        <div style="display: flex; flex-direction: column; gap: 1rem">
          <div class="skeleton-line" style="height: 2.5rem; border-radius: 4px"></div>
          <div class="skeleton-line" style="height: 2.5rem; border-radius: 4px"></div>
          <div class="skeleton-button"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="type === 'list'">
        <div *ngFor="let item of [1, 2, 3]" class="skeleton-list-item">
          <div class="skeleton-line" style="width: 100%; margin-bottom: 0.5rem"></div>
          <div class="skeleton-line" style="width: 90%"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="type === 'custom'">
        <ng-content></ng-content>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .skeleton-container {
        animation: blur-pulse 2s ease-in-out infinite;
        transition: opacity 0.3s ease;
      }

      .skeleton-line {
        height: 1rem;
        background: linear-gradient(
          90deg,
          #e0e0e0 25%,
          #f0f0f0 50%,
          #e0e0e0 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 2s infinite;
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }

      .skeleton-button {
        height: 2.5rem;
        width: 100%;
        background: linear-gradient(
          90deg,
          #e0e0e0 25%,
          #f0f0f0 50%,
          #e0e0e0 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 2s infinite;
        border-radius: 4px;
      }

      .skeleton-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        background: white;
      }

      .skeleton-card-header {
        padding: 1rem;
        border-bottom: 1px solid #e0e0e0;
        background: #fafafa;
      }

      .skeleton-card-body {
        padding: 1rem;
      }

      .skeleton-list-item {
        padding: 1rem;
        border-bottom: 1px solid #e0e0e0;

        &:last-child {
          border-bottom: none;
        }
      }

      @keyframes skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      @keyframes blur-pulse {
        0%,
        100% {
          filter: blur(0px);
        }
        50% {
          filter: blur(0.5px);
        }
      }
    `,
  ],
})
export class SkeletonLoaderComponent {
  @Input() type: 'text' | 'paragraph' | 'card' | 'button' | 'form' | 'list' | 'custom' =
    'text';
  @Input() width = '100%';
  @Input() opacity = '0.6';
}

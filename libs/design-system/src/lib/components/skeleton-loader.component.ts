import { NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

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
            <div class="skeleton-line" style="width: 40%; height: 1rem"></div>
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
        <div style="display: flex; flex-direction: column; gap: 0.625rem">
          <div class="skeleton-line" style="height: 2rem; border-radius: 4px"></div>
          <div class="skeleton-line" style="height: 2rem; border-radius: 4px"></div>
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
        height: 0.75rem;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.06) 25%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(255, 255, 255, 0.06) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 2s infinite;
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }

      .skeleton-button {
        height: 2rem;
        width: 100%;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.06) 25%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(255, 255, 255, 0.06) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 2s infinite;
        border-radius: 4px;
      }

      .skeleton-card {
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        overflow: hidden;
        background: var(--ds-surface-glass);
      }

      .skeleton-card-header {
        padding: 0.625rem;
        border-bottom: 1px solid var(--ds-border);
        background: rgba(255, 255, 255, 0.03);
      }

      .skeleton-card-body {
        padding: 0.625rem;
      }

      .skeleton-list-item {
        padding: 0.625rem;
        border-bottom: 1px solid var(--ds-border);

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

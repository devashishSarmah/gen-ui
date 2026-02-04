import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../form/button.component';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="error-container" *ngIf="visible">
      <div class="error-content">
        <div class="error-header">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">{{ title }}</h3>
          <button *ngIf="dismissible" (click)="dismiss()" class="error-close">✕</button>
        </div>

        <div class="error-message">{{ message }}</div>

        <div *ngIf="details" class="error-details">
          <details>
            <summary>Error Details</summary>
            <pre>{{ details }}</pre>
          </details>
        </div>

        <div class="error-actions">
          <app-button
            label="Retry"
            variant="primary"
            (click)="onRetry()"
          ></app-button>
          <app-button
            label="Try Different Approach"
            variant="secondary"
            (click)="onTryDifferent()"
          ></app-button>
          <app-button
            label="Report Issue"
            variant="secondary"
            (click)="onReportIssue()"
          ></app-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .error-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .error-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        max-width: 600px;
        width: 90%;
        padding: 2rem;
      }

      .error-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
        position: relative;
      }

      .error-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .error-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #d32f2f;
      }

      .error-close {
        position: absolute;
        top: 0;
        right: 0;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #999;
        transition: color 0.2s ease;
      }

      .error-close:hover {
        color: #333;
      }

      .error-message {
        margin: 1rem 0;
        color: #333;
        line-height: 1.5;
      }

      .error-details {
        margin: 1rem 0;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
        border-left: 4px solid #d32f2f;
      }

      .error-details summary {
        cursor: pointer;
        font-weight: 500;
        color: #666;
      }

      .error-details pre {
        margin: 0.5rem 0 0 0;
        overflow-x: auto;
        background: #fff;
        padding: 0.75rem;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #333;
      }

      .error-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
      }

      ::ng-deep app-button {
        flex: 1;
        min-width: 150px;
      }
    `,
  ],
})
export class ErrorComponent {
  @Input() title = 'An Error Occurred';
  @Input() message = 'Something went wrong. Please try again.';
  @Input() details = '';
  @Input() dismissible = true;
  @Input() visible = true;

  @Output() retry = new EventEmitter<void>();
  @Output() tryDifferent = new EventEmitter<void>();
  @Output() reportIssue = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onRetry() {
    this.retry.emit();
  }

  onTryDifferent() {
    this.tryDifferent.emit();
  }

  onReportIssue() {
    this.reportIssue.emit();
  }

  dismiss() {
    this.visible = false;
    this.close.emit();
  }
}

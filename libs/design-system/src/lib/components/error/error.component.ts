import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { ButtonComponent } from '../form/button.component';
import { DsIconComponent } from '../shared/ds-icon.component';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, ButtonComponent, A11yModule, DsIconComponent],
  template: `
    <div class="error-container" *ngIf="visible">
      <div
        class="error-content"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="messageId"
        cdkTrapFocus
      >
        <div class="error-header">
          <div class="error-icon"><ds-icon name="alert-triangle" [size]="28"></ds-icon></div>
          <h3 class="error-title" [id]="titleId">{{ title }}</h3>
          <button
            *ngIf="dismissible"
            (click)="dismiss()"
            class="error-close"
            type="button"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>

        <div class="error-message" [id]="messageId">{{ message }}</div>

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
            cdkFocusInitial
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
        background: rgba(6, 8, 12, 0.75);
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
        background: var(--ds-surface-glass);
        border-radius: var(--ds-radius-lg);
        border: 1px solid var(--ds-border);
        box-shadow: var(--ds-shadow-soft), var(--ds-shadow-glow);
        max-width: 600px;
        width: 90%;
        padding: 1.25rem;
      }

      .error-header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        position: relative;
      }

      .error-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .error-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #ff7485;
      }

      .error-close {
        position: absolute;
        top: 0;
        right: 0;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--ds-text-secondary);
        transition: color 0.2s ease;
      }

      .error-close:hover {
        color: var(--ds-text-primary);
      }

      .error-message {
        margin: 0.75rem 0;
        color: var(--ds-text-primary);
        line-height: 1.5;
      }

      .error-details {
        margin: 1rem 0;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 10px;
        border-left: 3px solid #ff7485;
      }

      .error-details summary {
        cursor: pointer;
        font-weight: 500;
        color: var(--ds-text-secondary);
      }

      .error-details pre {
        margin: 0.5rem 0 0 0;
        overflow-x: auto;
        background: rgba(0, 0, 0, 0.3);
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.75rem;
        color: var(--ds-text-primary);
      }

      .error-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        flex-wrap: wrap;
      }

      ::ng-deep app-button {
        flex: 1;
        min-width: 150px;
      }
    `,
  ],
})
export class ErrorComponent implements OnChanges {
  @Input() title = 'An Error Occurred';
  @Input() message = 'Something went wrong. Please try again.';
  @Input() details = '';
  @Input() dismissible = true;
  @Input() visible = true;

  @Output() retry = new EventEmitter<void>();
  @Output() tryDifferent = new EventEmitter<void>();
  @Output() reportIssue = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private announcer = inject(LiveAnnouncer);

  readonly titleId = `error-title-${Math.random().toString(36).slice(2, 9)}`;
  readonly messageId = `error-message-${Math.random().toString(36).slice(2, 9)}`;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.announcer.announce(`${this.title}. ${this.message}`, 'assertive');
    }
  }

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

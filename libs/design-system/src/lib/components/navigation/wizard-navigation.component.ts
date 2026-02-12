import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardFlowService } from '../../services/wizard-flow.service';

@Component({
  selector: 'app-wizard-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wizard-navigation">
      <button
        *ngIf="!wizardService.isFirstStep()"
        class="btn-back"
        (click)="onBack()"
        [disabled]="wizardService.isLoading()"
      >
        ← Back
      </button>
      <div class="spacer"></div>
      <button
        *ngIf="!wizardService.isLastStep()"
        class="btn-next"
        (click)="onNext()"
        [disabled]="!wizardService.canGoNext() || wizardService.isLoading()"
      >
        Next →
      </button>
      <button
        *ngIf="wizardService.isLastStep()"
        class="btn-finish"
        (click)="onFinish()"
        [disabled]="!wizardService.currentStep()?.completed || wizardService.isLoading()"
      >
        {{ wizardService.isLoading() ? 'Finishing...' : 'Finish' }}
      </button>
    </div>
  `,
  styles: [
    `
      .wizard-navigation {
        display: flex;
        align-items: center;
        padding: 0.625rem;
        border-top: 1px solid var(--ds-border);
        background: var(--ds-surface-glass);
      }

      .spacer {
        flex: 1;
      }

      button {
        padding: 0.5rem 1rem;
        border-radius: var(--ds-radius-md);
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-back {
        background: transparent;
        border: 1px solid var(--ds-border);
        color: var(--ds-text-secondary);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
        }
      }

      .btn-next {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        border: none;
        color: #0a0b0f;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      }

      .btn-finish {
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        color: #0a0b0f;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      }
    `,
  ],
})
export class WizardNavigationComponent {
  wizardService = inject(WizardFlowService);

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() finish = new EventEmitter<void>();

  onBack(): void {
    this.wizardService.previousStep();
    this.back.emit();
  }

  onNext(): void {
    if (this.wizardService.nextStep()) {
      this.next.emit();
    }
  }

  onFinish(): void {
    this.finish.emit();
  }
}

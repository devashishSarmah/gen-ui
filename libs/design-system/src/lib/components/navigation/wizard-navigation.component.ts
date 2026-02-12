import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardFlowService } from '../../../core/services/wizard-flow.service';

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
        padding: 1rem;
        border-top: 1px solid #e0e0e0;
        background: white;
      }

      .spacer {
        flex: 1;
      }

      button {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        font-size: 1rem;
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
        border: 1px solid #e0e0e0;
        color: #666;

        &:hover:not(:disabled) {
          background: #f5f5f5;
        }
      }

      .btn-next {
        background: #1976d2;
        border: none;
        color: white;

        &:hover:not(:disabled) {
          background: #1565c0;
        }
      }

      .btn-finish {
        background: #4caf50;
        border: none;
        color: white;

        &:hover:not(:disabled) {
          background: #43a047;
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

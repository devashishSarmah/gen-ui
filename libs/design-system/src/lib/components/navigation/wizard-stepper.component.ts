import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  contentTemplate?: any;
  completed?: boolean;
}

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wizard-wrapper">
      <div class="wizard-steps" role="list">
        <div
          *ngFor="let step of steps; let i = index"
          class="wizard-step"
          [class.step-active]="currentStep() === i"
          [class.step-completed]="step.completed"
          role="listitem"
          [attr.aria-current]="currentStep() === i ? 'step' : null"
        >
          <button
            type="button"
            class="step-circle"
            (click)="goToStep(i)"
            [disabled]="disabledStep(i)"
            [attr.aria-label]="'Go to step ' + (i + 1) + ': ' + step.label"
          >
            <span *ngIf="!step.completed" class="step-number">{{ i + 1 }}</span>
            <span *ngIf="step.completed" class="step-check">✓</span>
          </button>
          <div class="step-label">
            <div class="step-title">{{ step.label }}</div>
            <div *ngIf="step.description" class="step-description">
              {{ step.description }}
            </div>
          </div>
          <div *ngIf="i < steps.length - 1" class="step-connector"></div>
        </div>
      </div>

      <div class="wizard-content">
        <ng-container *ngFor="let step of steps; let i = index">
          <div *ngIf="currentStep() === i" class="step-content">
            <ng-container *ngTemplateOutlet="step.contentTemplate"></ng-container>
          </div>
        </ng-container>
      </div>

      <div class="wizard-actions">
        <button
          (click)="previousStep()"
          [disabled]="currentStep() === 0"
          class="action-button"
          type="button"
        >
          ← Back
        </button>
        <span class="step-counter">
          Step {{ currentStep() + 1 }} of {{ steps.length }}
        </span>
        <button
          (click)="nextStep()"
          [disabled]="currentStep() === steps.length - 1"
          class="action-button"
          type="button"
        >
          Next →
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .wizard-wrapper {
        width: 100%;
        padding: 1rem;
        background: var(--ds-surface-glass);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        box-shadow: var(--ds-shadow-soft);
      }

      .wizard-steps {
        display: flex;
        gap: 0;
        margin-bottom: 1rem;
      }

      .wizard-step {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }

      .step-circle {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--ds-border-strong);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 2;
        color: var(--ds-text-primary);
      }

      .step-active .step-circle {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        border-color: transparent;
        color: #0a0b0f;
      }

      .step-completed .step-circle {
        background: linear-gradient(135deg, #2eff8b, #08fff3);
        border-color: transparent;
        color: #0a0b0f;
      }

      .step-circle:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }

      .step-circle:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(8, 255, 243, 0.5), 0 0 0 5px rgba(8, 255, 243, 0.15);
      }

      .step-circle:hover {
        transform: scale(1.05);
      }

      .step-label {
        margin-top: 0.75rem;
        text-align: center;
      }

      .step-title {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ds-text-primary);
      }

      .step-description {
        font-size: 0.75rem;
        color: var(--ds-text-secondary);
        margin-top: 0.25rem;
      }

      .step-connector {
        position: absolute;
        top: 1rem;
        left: 50%;
        width: 100%;
        height: 2px;
        background: rgba(255, 255, 255, 0.12);
        z-index: 1;
      }

      .step-active ~ .wizard-step .step-connector {
        background: #2196f3;
      }

      .wizard-content {
        padding: 1rem 0;
        min-height: 100px;
      }

      .step-content {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .wizard-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--ds-border);
      }

      .action-button {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--ds-border-strong);
        border-radius: 999px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        color: var(--ds-text-primary);
      }

      .action-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }

      .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .step-counter {
        font-size: 0.8rem;
        color: var(--ds-text-secondary);
      }
    `,
  ],
})
export class WizardStepperComponent {
  @Input() steps: WizardStep[] = [];
  @Output() stepChange = new EventEmitter<number>();

  currentStep = signal(0);

  goToStep(step: number) {
    if (step >= 0 && step < this.steps.length) {
      this.currentStep.set(step);
      this.stepChange.emit(step);
    }
  }

  nextStep() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update((s) => s + 1);
      this.stepChange.emit(this.currentStep());
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
      this.stepChange.emit(this.currentStep());
    }
  }

  disabledStep(step: number): boolean {
    return step > this.currentStep();
  }
}

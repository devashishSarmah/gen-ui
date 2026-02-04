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
      <div class="wizard-steps">
        <div
          *ngFor="let step of steps; let i = index"
          class="wizard-step"
          [class.step-active]="currentStep() === i"
          [class.step-completed]="step.completed"
        >
          <div class="step-circle" (click)="goToStep(i)">
            <span *ngIf="!step.completed" class="step-number">{{ i + 1 }}</span>
            <span *ngIf="step.completed" class="step-check">✓</span>
          </div>
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
        padding: 1.5rem;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }

      .wizard-steps {
        display: flex;
        gap: 0;
        margin-bottom: 2rem;
      }

      .wizard-step {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }

      .step-circle {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background: #f0f0f0;
        border: 2px solid #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 2;
      }

      .step-active .step-circle {
        background: #2196f3;
        border-color: #2196f3;
        color: white;
      }

      .step-completed .step-circle {
        background: #4caf50;
        border-color: #4caf50;
        color: white;
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
      }

      .step-description {
        font-size: 0.75rem;
        color: #666;
        margin-top: 0.25rem;
      }

      .step-connector {
        position: absolute;
        top: 1.25rem;
        left: 50%;
        width: 100%;
        height: 2px;
        background: #ddd;
        z-index: 1;
      }

      .step-active ~ .wizard-step .step-connector {
        background: #2196f3;
      }

      .wizard-content {
        padding: 2rem 0;
        min-height: 200px;
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
        border-top: 1px solid #e0e0e0;
      }

      .action-button {
        padding: 0.5rem 1rem;
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }

      .action-button:hover:not(:disabled) {
        background: #e0e0e0;
      }

      .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .step-counter {
        font-size: 0.875rem;
        color: #666;
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
}

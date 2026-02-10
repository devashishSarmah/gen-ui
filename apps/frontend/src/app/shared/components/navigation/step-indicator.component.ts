import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardFlowService } from '../../../core/services/wizard-flow.service';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-indicator">
      <div class="progress-bar" role="progressbar" [attr.aria-valuenow]="wizardService.progressPercentage()" aria-valuemin="0" aria-valuemax="100">
        <div
          class="progress-fill"
          [style.width.%]="wizardService.progressPercentage()"
        ></div>
      </div>

      <div class="steps">
        <button
          *ngFor="let step of wizardService.steps(); let i = index"
          class="step"
          [class.active]="i === wizardService.currentStepIndex()"
          [class.completed]="step.completed"
          [class.clickable]="canNavigateToStep(i)"
          (click)="navigateToStep(i)"
          [disabled]="!canNavigateToStep(i)"
          [attr.aria-current]="i === wizardService.currentStepIndex() ? 'step' : null"
          type="button"
        >
          <div class="step-circle">
            <span *ngIf="step.completed" class="check">✓</span>
            <span *ngIf="!step.completed">{{ i + 1 }}</span>
          </div>
          <div class="step-label">
            <span class="step-title">{{ step.label }}</span>
            <span class="step-description" *ngIf="step.description">
              {{ step.description }}
            </span>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .step-indicator {
        padding: 1rem;
        background: var(--ds-surface-glass);
        border-radius: var(--ds-radius-lg);
        border: 1px solid var(--ds-border);
        box-shadow: var(--ds-shadow-soft);
      }

      .progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        transition: width 0.3s ease;
      }

      .steps {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        min-width: 0;
        opacity: 0.5;
        transition: opacity 0.2s;
        background: transparent;
        border: none;
        color: inherit;

        &.active,
        &.completed {
          opacity: 1;
        }

        &.clickable {
          cursor: pointer;

          &:hover .step-circle {
            transform: scale(1.1);
          }
        }

        &:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(8, 255, 243, 0.4), 0 0 0 5px rgba(8, 255, 243, 0.12);
        }
      }

      .step-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
        transition: all 0.2s;
        color: var(--ds-text-primary);

        .step.active & {
          background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
          color: #0a0b0f;
        }

        .step.completed & {
          background: linear-gradient(135deg, #2eff8b, #08fff3);
          color: #0a0b0f;
        }
      }

      .check {
        font-size: 1rem;
      }

      .step-label {
        text-align: center;
      }

      .step-title {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--ds-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
      }

      .step-description {
        display: none;
        font-size: 0.625rem;
        color: var(--ds-text-secondary);
      }

      @media (min-width: 640px) {
        .step-title {
          font-size: 0.875rem;
          max-width: 150px;
        }

        .step-description {
          display: block;
        }
      }
    `,
  ],
})
export class StepIndicatorComponent {
  wizardService = inject(WizardFlowService);

  canNavigateToStep(index: number): boolean {
    const currentIndex = this.wizardService.currentStepIndex();
    const steps = this.wizardService.steps();
    
    // Can go back to any previous step
    if (index < currentIndex) {
      return true;
    }
    
    // Can go to next step if current is completed
    if (index === currentIndex + 1 && steps[currentIndex]?.completed) {
      return true;
    }
    
    return false;
  }

  navigateToStep(index: number): void {
    if (this.canNavigateToStep(index)) {
      this.wizardService.goToStep(index);
    }
  }
}

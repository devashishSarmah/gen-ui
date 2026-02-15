import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../shared/ds-icon.component';

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  status?: 'completed' | 'active' | 'pending' | 'error';
  metadata?: Record<string, any>;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" [class.vertical]="orientation === 'vertical'" [class.horizontal]="orientation === 'horizontal'">
      <div 
        *ngFor="let step of steps; let i = index; let last = last"
        class="step"
        [class.completed]="step.status === 'completed' || i < currentStep"
        [class.active]="step.status === 'active' || i === currentStep"
        [class.pending]="step.status === 'pending' || i > currentStep"
        [class.error]="step.status === 'error'"
        [class.clickable]="clickable"
        (click)="onStepClick(i)"
      >
        <div class="step-indicator">
          <div class="step-number">
            <span *ngIf="step.icon && (step.status === 'active' || i === currentStep)"><ds-icon [name]="step.icon" [size]="16"></ds-icon></span>
            <span *ngIf="step.status === 'completed' || i < currentStep"><ds-icon name="check" [size]="16"></ds-icon></span>
            <span *ngIf="step.status === 'error'"><ds-icon name="x" [size]="16"></ds-icon></span>
            <span *ngIf="!step.icon && step.status !== 'completed' && step.status !== 'error' && i >= currentStep">{{ i + 1 }}</span>
            <span *ngIf="step.icon && !step.status && i > currentStep"><ds-icon [name]="step.icon" [size]="16"></ds-icon></span>
          </div>
          <div class="step-connector" *ngIf="!last"></div>
        </div>
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-description" *ngIf="step.description">{{ step.description }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stepper {
      display: flex;
    }

    .stepper.vertical {
      flex-direction: column;
      gap: 0;
    }

    .stepper.horizontal {
      flex-direction: row;
      align-items: flex-start;
      gap: 0;
    }

    .step {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      position: relative;
    }

    .step.clickable {
      cursor: pointer;
    }

    .step.clickable:hover .step-number {
      transform: scale(1.1);
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.4);
    }

    .stepper.vertical .step {
      padding-bottom: 1.25rem;
    }

    .stepper.horizontal .step {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-right: 1rem;
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .stepper.horizontal .step-indicator {
      flex-direction: row;
      width: 100%;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      background: var(--ds-surface-glass);
      border: 2px solid var(--ds-border);
      color: var(--ds-text-secondary);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 2;
      position: relative;
    }

    .step.completed .step-number {
      background: linear-gradient(135deg, #10b981, #059669);
      border-color: #10b981;
      color: white;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
    }

    .step.active .step-number {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      border-color: var(--ds-accent-teal);
      color: white;
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.4);
      animation: pulse-glow 2s ease-in-out infinite;
    }

    .step.error .step-number {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-color: #ef4444;
      color: white;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
    }

    .step-connector {
      background: var(--ds-border);
      transition: all 0.3s ease;
    }

    .stepper.vertical .step-connector {
      width: 2px;
      flex: 1;
      min-height: 20px;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .stepper.horizontal .step-connector {
      height: 2px;
      flex: 1;
      margin-left: 8px;
      margin-right: 8px;
    }

    .step.completed .step-connector {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      box-shadow: 0 0 12px rgba(0, 255, 245, 0.5);
    }

    .step-content {
      flex: 1;
      padding-top: 0.5rem;
    }

    .stepper.horizontal .step-content {
      padding-top: 1rem;
      max-width: 200px;
    }

    .step-title {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--ds-text-secondary);
      margin-bottom: 0.375rem;
      transition: color 0.3s ease;
    }

    .step.active .step-title,
    .step.completed .step-title {
      color: var(--ds-text-primary);
    }

    .step.active .step-title {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .step-description {
      font-size: 0.775rem;
      color: var(--ds-text-secondary);
      line-height: 1.5;
      opacity: 0.8;
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 8px 24px rgba(0, 255, 245, 0.4);
      }
      50% {
        box-shadow: 0 8px 32px rgba(0, 255, 245, 0.6), 0 0 48px rgba(0, 255, 245, 0.3);
      }
    }
  `]
})
export class StepperComponent {
  @Input() steps: Step[] = [];
  @Input() currentStep = 0;
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() clickable = false;
  @Output() stepChange = new EventEmitter<number>();

  onStepClick(index: number) {
    if (this.clickable) {
      this.currentStep = index;
      this.stepChange.emit(index);
    }
  }
}

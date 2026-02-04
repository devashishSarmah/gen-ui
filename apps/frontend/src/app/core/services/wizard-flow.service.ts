import { Injectable, signal, computed } from '@angular/core';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  data?: Record<string, any>;
}

export interface WizardState {
  steps: WizardStep[];
  currentStepIndex: number;
  formValues: Record<string, any>;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class WizardFlowService {
  // Core state signals
  private readonly _steps = signal<WizardStep[]>([]);
  private readonly _currentStepIndex = signal(0);
  private readonly _formValues = signal<Record<string, any>>({});
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly steps = this._steps.asReadonly();
  readonly currentStepIndex = this._currentStepIndex.asReadonly();
  readonly formValues = this._formValues.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly currentStep = computed(() => {
    const steps = this._steps();
    const index = this._currentStepIndex();
    return steps[index] || null;
  });

  readonly totalSteps = computed(() => this._steps().length);

  readonly isFirstStep = computed(() => this._currentStepIndex() === 0);

  readonly isLastStep = computed(() => {
    const steps = this._steps();
    return this._currentStepIndex() === steps.length - 1;
  });

  readonly progressPercentage = computed(() => {
    const total = this._steps().length;
    if (total === 0) return 0;
    const completed = this._steps().filter((s) => s.completed).length;
    return Math.round((completed / total) * 100);
  });

  readonly canGoNext = computed(() => {
    const step = this.currentStep();
    return step?.completed && !this.isLastStep();
  });

  readonly canGoBack = computed(() => !this.isFirstStep());

  /**
   * Initialize wizard with steps declared by AI
   */
  initializeWizard(steps: Omit<WizardStep, 'completed'>[]): void {
    const initializedSteps = steps.map((step) => ({
      ...step,
      completed: false,
    }));
    this._steps.set(initializedSteps);
    this._currentStepIndex.set(0);
    this._formValues.set({});
    this._error.set(null);
  }

  /**
   * Navigate to next step
   */
  nextStep(): boolean {
    if (!this.canGoNext()) {
      return false;
    }
    this._currentStepIndex.update((i) => i + 1);
    return true;
  }

  /**
   * Navigate to previous step
   */
  previousStep(): boolean {
    if (!this.canGoBack()) {
      return false;
    }
    this._currentStepIndex.update((i) => i - 1);
    return true;
  }

  /**
   * Go to specific step by index
   */
  goToStep(index: number): boolean {
    const steps = this._steps();
    if (index < 0 || index >= steps.length) {
      return false;
    }
    // Only allow going to completed steps or the next incomplete step
    const targetStep = steps[index];
    const currentIndex = this._currentStepIndex();
    if (index <= currentIndex || targetStep.completed || index === currentIndex + 1) {
      this._currentStepIndex.set(index);
      return true;
    }
    return false;
  }

  /**
   * Mark current step as completed
   */
  completeCurrentStep(): void {
    this._steps.update((steps) =>
      steps.map((step, i) =>
        i === this._currentStepIndex() ? { ...step, completed: true } : step
      )
    );
  }

  /**
   * Update form values for current step
   */
  updateFormValues(stepId: string, values: Record<string, any>): void {
    this._formValues.update((current) => ({
      ...current,
      [stepId]: { ...(current[stepId] || {}), ...values },
    }));
  }

  /**
   * Get form values for a specific step
   */
  getStepFormValues(stepId: string): Record<string, any> {
    return this._formValues()[stepId] || {};
  }

  /**
   * Get all form values
   */
  getAllFormValues(): Record<string, any> {
    return this._formValues();
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this._error.set(error);
  }

  /**
   * Reset wizard to initial state
   */
  resetWizard(): void {
    this._steps.set([]);
    this._currentStepIndex.set(0);
    this._formValues.set({});
    this._isLoading.set(false);
    this._error.set(null);
  }

  /**
   * Check if wizard is active
   */
  isWizardActive(): boolean {
    return this._steps().length > 0;
  }

  /**
   * Get wizard state for persistence
   */
  getState(): WizardState {
    return {
      steps: this._steps(),
      currentStepIndex: this._currentStepIndex(),
      formValues: this._formValues(),
      isLoading: this._isLoading(),
      error: this._error(),
    };
  }

  /**
   * Restore wizard state
   */
  restoreState(state: WizardState): void {
    this._steps.set(state.steps);
    this._currentStepIndex.set(state.currentStepIndex);
    this._formValues.set(state.formValues);
    this._isLoading.set(state.isLoading);
    this._error.set(state.error);
  }
}

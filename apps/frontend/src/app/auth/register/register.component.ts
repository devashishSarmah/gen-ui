import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { OAuthService } from '../oauth.service';
import { LucideAngularModule, Mail, Lock, UserPlus, Loader2, CheckCircle, Github, Chrome } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="h-dvh w-full flex items-center justify-center">
      <div class="auth-container">
        <div class="auth-header">
          <h2>Create account</h2>
          <p class="auth-subtitle">Start building AI-powered interfaces</p>
        </div>

        <!-- OAuth buttons -->
        <div class="oauth-buttons">
          <button type="button" class="oauth-btn github-btn" (click)="loginWithGithub()">
            <lucide-icon [img]="Github" [size]="16"></lucide-icon>
            GitHub
          </button>
          <button type="button" class="oauth-btn google-btn" (click)="loginWithGoogle()">
            <lucide-icon [img]="Chrome" [size]="16"></lucide-icon>
            Google
          </button>
        </div>

        <div class="divider">
          <span>or</span>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <lucide-icon [img]="Mail" [size]="16" class="input-icon"></lucide-icon>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-control"
                placeholder="you{'@'}example.com"
              />
            </div>
            @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
              <div class="error">Valid email is required</div>
            }
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <lucide-icon [img]="Lock" [size]="16" class="input-icon"></lucide-icon>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="form-control"
                placeholder="At least 6 characters"
              />
            </div>
            @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
              <div class="error">Password must be at least 6 characters</div>
            }
          </div>

          @if (errorMessage) {
            <div class="alert alert-error">{{ errorMessage }}</div>
          }

          @if (successMessage) {
            <div class="alert alert-success">
              <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon>
              {{ successMessage }}
            </div>
          }

          <button type="submit" class="btn btn-primary" [disabled]="registerForm.invalid || isLoading">
            @if (isLoading) {
              <lucide-icon [img]="Loader2" [size]="16" class="spin"></lucide-icon>
              Creating account…
            } @else {
              <lucide-icon [img]="UserPlus" [size]="16"></lucide-icon>
              Create account
            }
          </button>
        </form>

        <p class="auth-link">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      padding: var(--ds-card-padding, 2.5rem 2rem);
      background: var(--ds-card-bg, rgba(12, 14, 18, 0.55));
      backdrop-filter: blur(48px) saturate(200%);
      -webkit-backdrop-filter: blur(48px) saturate(200%);
      border: 1px solid var(--ds-input-border);
      border-radius: var(--ds-card-radius, 20px);
      box-shadow: var(--ds-shadow-card);
    }

    .auth-header {
      text-align: center;
      margin-bottom: var(--ds-space-7);
    }

    h2 {
      margin: 0 0 0.35rem;
      font-size: var(--ds-text-2xl);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--ds-text-primary);
    }

    .auth-subtitle {
      margin: 0;
      font-size: var(--ds-text-sm);
      color: var(--ds-text-secondary);
    }

    .oauth-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ds-space-4);
      margin-bottom: var(--ds-space-6);
    }

    .oauth-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: var(--ds-btn-padding-y) var(--ds-btn-padding-x);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-btn-radius);
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      color: var(--ds-text-primary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;

      &:hover {
        border-color: var(--ds-border-strong);
        background: rgba(255, 255, 255, 0.1);
        box-shadow: var(--ds-shadow-input);
      }
    }

    .divider {
      display: flex;
      align-items: center;
      gap: var(--ds-space-4);
      margin: var(--ds-space-6) 0;
      color: var(--ds-text-secondary);
      font-size: 0.75rem;
      font-weight: 500;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .form-group {
      margin-bottom: var(--ds-space-6);
    }

    label {
      display: block;
      margin-bottom: var(--ds-space-2);
      font-weight: 500;
      font-size: var(--ds-text-sm);
      letter-spacing: 0.01em;
      color: var(--ds-text-secondary);
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ds-text-secondary);
      pointer-events: none;
      opacity: 0.5;
      transition: opacity 0.2s ease;
    }

    .input-wrapper:focus-within .input-icon {
      opacity: 0.9;
      color: var(--ds-accent-teal);
    }

    .form-control {
      width: 100%;
      padding: var(--ds-input-padding-y) var(--ds-input-padding-x) var(--ds-input-padding-y) var(--ds-input-padding-left-icon);
      border: 1px solid var(--ds-input-border);
      border-radius: var(--ds-input-radius);
      font-size: var(--ds-input-font-size);
      color: var(--ds-text-primary);
      background: var(--ds-input-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      transition: all 0.25s ease;
      box-shadow: var(--ds-shadow-input);
    }

    .form-control::placeholder {
      color: var(--ds-text-secondary);
      opacity: 0.5;
    }

    .form-control:hover {
      border-color: var(--ds-input-border-hover);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--ds-input-border-focus);
      box-shadow: var(--ds-input-focus-ring);
    }

    .error {
      color: var(--ds-error);
      font-size: var(--ds-text-xs);
      font-weight: 500;
      margin-top: 0.35rem;
    }

    .alert {
      padding: var(--ds-space-4) var(--ds-space-5);
      border-radius: var(--ds-btn-radius);
      margin-bottom: var(--ds-space-6);
      font-size: var(--ds-text-sm);
      font-weight: 500;
      backdrop-filter: blur(20px);
    }

    .alert-error {
      background: rgba(255, 77, 125, 0.12);
      border: 1px solid rgba(255, 77, 125, 0.2);
      color: var(--ds-error);
    }

    .alert-success {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(46, 255, 139, 0.1);
      border: 1px solid rgba(46, 255, 139, 0.2);
      color: var(--ds-success);
    }

    .btn {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: var(--ds-btn-padding-y) var(--ds-btn-padding-x);
      border: none;
      border-radius: var(--ds-btn-radius);
      font-size: var(--ds-btn-font-size);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      color: #0a0b0f;
      box-shadow: 0 4px 20px rgba(0, 255, 245, 0.2);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 28px rgba(0, 255, 245, 0.3);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-link {
      text-align: center;
      margin-top: var(--ds-space-6);
      color: var(--ds-text-secondary);
      font-size: var(--ds-text-sm);
    }

    .auth-link a {
      color: var(--ds-accent-teal);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .auth-link a:hover {
      color: var(--ds-accent-indigo);
    }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private oauthService = inject(OAuthService);
  private router = inject(Router);

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly UserPlus = UserPlus;
  readonly Loader2 = Loader2;
  readonly CheckCircle = CheckCircle;
  readonly Github = Github;
  readonly Chrome = Chrome;

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loginWithGithub(): void {
    this.oauthService.loginWithGithub();
  }

  loginWithGoogle(): void {
    this.oauthService.loginWithGoogle();
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.register(this.registerForm.value as any).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Registration successful! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        },
      });
    }
  }
}

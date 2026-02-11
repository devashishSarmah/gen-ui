import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <h2>Login</h2>
      
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="form-control"
            placeholder="Enter your email"
          />
          @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
            <div class="error">Valid email is required</div>
          }
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="form-control"
            placeholder="Enter your password"
          />
          @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
            <div class="error">Password is required</div>
          }
        </div>

        @if (errorMessage) {
          <div class="alert alert-error">{{ errorMessage }}</div>
        }

        <button type="submit" class="btn btn-primary" [disabled]="loginForm.invalid || isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="auth-link">
        Don't have an account? <a routerLink="/register">Register here</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 3rem;
      background: var(--ds-surface-glass-strong);
      backdrop-filter: blur(32px) saturate(180%);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      box-shadow: var(--ds-shadow-medium), 0 0 80px rgba(0, 255, 245, 0.08);
    }
    
    h2 {
      text-align: center;
      margin-bottom: 2.5rem;
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 24px rgba(0, 255, 245, 0.3));
    }
    
    .form-group {
      margin-bottom: 1.75rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.625rem;
      font-weight: 600;
      font-size: 0.875rem;
      letter-spacing: 0.02em;
      color: var(--ds-text-secondary);
    }
    
    .form-control {
      width: 100%;
      padding: 0.875rem 1.5rem;
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-pill);
      font-size: 0.95rem;
      color: var(--ds-text-primary);
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px) saturate(180%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.06);
    }

    .form-control::placeholder {
      color: var(--ds-text-secondary);
      opacity: 0.6;
    }

    .form-control:hover {
      border-color: var(--ds-border-strong);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--ds-border-glow);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(0, 255, 245, 0.2), 0 0 32px rgba(0, 255, 245, 0.15);
    }
    
    .error {
      color: #ff7485;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.5rem;
      text-shadow: 0 0 8px rgba(255, 116, 133, 0.3);
    }
    
    .alert {
      padding: 1rem 1.25rem;
      border-radius: var(--ds-radius-md);
      margin-bottom: 1.5rem;
      backdrop-filter: blur(20px);
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .alert-error {
      background: linear-gradient(135deg, rgba(255, 77, 125, 0.18), rgba(255, 45, 111, 0.18));
      border: 1px solid rgba(255, 77, 125, 0.3);
      color: #ff7485;
      box-shadow: 0 4px 16px rgba(255, 77, 125, 0.2);
    }
    
    .btn {
      width: 100%;
      padding: 0.875rem 1.75rem;
      border: none;
      border-radius: var(--ds-radius-pill);
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .btn:hover:not(:disabled)::before {
      opacity: 1;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      color: #0a0b0f;
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 255, 245, 0.4), 0 0 48px rgba(91, 74, 255, 0.3);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .auth-link {
      text-align: center;
      margin-top: 1.5rem;
      color: var(--ds-text-secondary);
      font-size: 0.9rem;
    }

    .auth-link a {
      color: var(--ds-accent-teal);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .auth-link a:hover {
      color: var(--ds-accent-indigo);
      text-shadow: 0 0 12px rgba(0, 255, 245, 0.5);
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';
  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value as any).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/conversations']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        },
      });
    }
  }
}

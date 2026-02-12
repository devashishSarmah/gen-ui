import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OAuthService } from './oauth.service';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="h-dvh w-full flex items-center justify-center">
      <div class="callback-container">
        <div class="spinner">
          <lucide-icon [img]="Loader2" [size]="32" class="spin"></lucide-icon>
        </div>
        <h2>Signing you in…</h2>
        <p>Please wait while we complete your authentication.</p>
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .callback-container {
        text-align: center;
        padding: 2rem;
      }

      .spinner {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .spin {
        animation: spin 1s linear infinite;
        color: var(--ds-accent-teal);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        color: var(--ds-text-primary);
      }

      p {
        margin: 0;
        color: var(--ds-text-secondary);
        font-size: 0.9rem;
      }

      .error-message {
        margin-top: 1.5rem;
        padding: 1rem;
        background: rgba(255, 77, 125, 0.12);
        border: 1px solid rgba(255, 77, 125, 0.2);
        border-radius: 12px;
        color: #ff7485;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class OAuthCallbackComponent implements OnInit {
  private oauthService = inject(OAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly Loader2 = Loader2;
  errorMessage = '';

  ngOnInit(): void {
    const provider = this.route.snapshot.data['provider'] as 'github' | 'google';

    this.oauthService.handleOAuthCallback(provider).catch((error) => {
      console.error('OAuth callback error:', error);
      this.errorMessage =
        error.message || `Failed to authenticate with ${provider}`;
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    });
  }
}

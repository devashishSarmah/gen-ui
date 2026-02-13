import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AnalyticsService } from '../core/services/analytics.service';

export interface OAuthProvider {
  name: 'github' | 'google';
  clientId: string;
  scope: string;
}

@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private analytics = inject(AnalyticsService);

  private getFrontendOrigin(): string {
    const configured = environment.frontendUrl?.trim();
    if (configured) {
      return configured.replace(/\/$/, '');
    }

    return window.location.origin;
  }

  getGithubAuthUrl(): string {
    const clientId = environment.oauth.github.clientId;
    const scope = environment.oauth.github.scope;
    const redirectUri = `${this.getFrontendOrigin()}/auth/github/callback`;
    
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  }

  getGoogleAuthUrl(): string {
    const clientId = environment.oauth.google.clientId;
    const scope = environment.oauth.google.scope;
    const redirectUri = `${this.getFrontendOrigin()}/auth/google/callback`;
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }

  /**
   * Exchange OAuth code for JWT token
   */
  exchangeCodeForToken(provider: 'github' | 'google', code: string) {
    return this.http.post(`${environment.apiUrl}/auth/${provider}/callback`, {
      code,
    });
  }

  /**
   * Initiate GitHub OAuth flow
   */
  loginWithGithub(): void {
    window.location.href = this.getGithubAuthUrl();
  }

  /**
   * Initiate Google OAuth flow
   */
  loginWithGoogle(): void {
    window.location.href = this.getGoogleAuthUrl();
  }

  /**
   * Handle OAuth callback (should be called from callback route)
   */
  handleOAuthCallback(provider: 'github' | 'google'): Promise<void> {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        reject(new Error(`OAuth error: ${error} - ${errorDescription}`));
        return;
      }

      if (!code) {
        reject(new Error('No authorization code received'));
        return;
      }

      this.exchangeCodeForToken(provider, code).subscribe({
        next: (response: any) => {
          // Backend returns { access_token: '...' } matching AuthResponseDto
          const token = response.access_token;
          if (token) {
            localStorage.setItem('access_token', token);
            this.authService.isAuthenticatedSignal.set(true);
            this.authService.loadProfile();
            this.analytics.trackLogin(provider);
            this.router.navigate(['/conversations']);
          }
          resolve();
        },
        error: (err) => {
          console.error(`OAuth exchange error for ${provider}:`, err);
          reject(err);
        },
      });
    });
  }
}

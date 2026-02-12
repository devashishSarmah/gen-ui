import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';
import { AnalyticsService } from './core/services/analytics.service';
import { LucideAngularModule, Github, Heart, ExternalLink, Sparkles, BookOpen, User, LogOut, ChevronDown, LogIn } from 'lucide-angular';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header class="app-header">
        <a routerLink="/" class="header-brand">
          <img class="logo" [src]="'https://res.cloudinary.com/dmm7pipxt/image/upload/v1770762472/Gen%20UI/Layer/logo_w1jdum.png'" alt="Gen UI" />
        </a>
        <nav class="header-nav">
          <a routerLink="/showcase" class="nav-link">
            <lucide-icon [img]="BookOpen" [size]="15"></lucide-icon>
            Docs
          </a>
          <a href="https://github.com/devashishSarmah/gen-ui" target="_blank" rel="noopener" class="nav-link">
            <lucide-icon [img]="Github" [size]="15"></lucide-icon>
            GitHub
          </a>

          @if (auth.isAuthenticatedSignal()) {
            <div class="profile-wrapper">
              <button class="profile-trigger" (click)="toggleDropdown($event)">
                @if (auth.currentUser()?.avatarUrl) {
                  <img [src]="auth.currentUser()!.avatarUrl" class="avatar" alt="avatar" />
                } @else {
                  <div class="avatar-placeholder">
                    <lucide-icon [img]="UserIcon" [size]="14"></lucide-icon>
                  </div>
                }
                <span class="profile-name">{{ auth.currentUser()?.name || auth.currentUser()?.email?.split('@')[0] || 'Account' }}</span>
                <lucide-icon [img]="ChevronDown" [size]="12" [class.rotated]="dropdownOpen"></lucide-icon>
              </button>

              @if (dropdownOpen) {
                <div class="dropdown-menu">
                  <div class="dropdown-header">
                    <span class="dropdown-email">{{ auth.currentUser()?.email }}</span>
                  </div>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item danger" (click)="logout()">
                    <lucide-icon [img]="LogOutIcon" [size]="14"></lucide-icon>
                    Sign out
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="nav-link sign-in-link">
              <lucide-icon [img]="LogInIcon" [size]="15"></lucide-icon>
              Sign in
            </a>
          }
        </nav>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
      <footer class="app-footer">
        <div class="footer-inner">
          <div class="footer-left">
            <a routerLink="/" class="footer-brand">
              <img class="footer-logo" [src]="'https://res.cloudinary.com/dmm7pipxt/image/upload/v1770762472/Gen%20UI/Layer/logo_w1jdum.png'" alt="Gen UI" />
            </a>
            <span class="footer-sep">·</span>
            <span class="footer-tagline">AI-powered generative interfaces</span>
          </div>
          <div class="footer-center">
            <span class="footer-oss">
              Open source with <lucide-icon [img]="Heart" [size]="12" class="heart-icon"></lucide-icon>
            </span>
          </div>
          <div class="footer-right">
            <a href="https://github.com/devashishSarmah/gen-ui" target="_blank" rel="noopener" class="footer-link">
              <lucide-icon [img]="Github" [size]="14"></lucide-icon>
              Star on GitHub
              <lucide-icon [img]="ExternalLink" [size]="11"></lucide-icon>
            </a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .app-header {
      position: sticky;
      top: 0;
      z-index: 100;
      height: var(--app-header-height, 60px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      background: rgba(10, 11, 15, 0.55);
      backdrop-filter: blur(40px) saturate(200%);
      -webkit-backdrop-filter: blur(40px) saturate(200%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03), 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .header-brand {
      display: flex;
      align-items: center;
      text-decoration: none;
    }

    .logo {
      height: 16px;
      width: auto;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      color: var(--ds-text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      text-decoration: none;
      border-radius: var(--ds-radius-pill);
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: var(--ds-text-primary);
      background: rgba(255, 255, 255, 0.06);
    }

    .sign-in-link {
      margin-left: 0.25rem;
      border: 1px solid var(--ds-border);
      color: var(--ds-text-primary);
      font-weight: 600;
    }

    .sign-in-link:hover {
      border-color: var(--ds-border-strong);
      background: rgba(255, 255, 255, 0.08);
    }

    /* ── Profile Dropdown ── */
    .profile-wrapper {
      position: relative;
      margin-left: 0.35rem;
    }

    .profile-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.6rem 0.3rem 0.3rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--ds-radius-pill);
      color: var(--ds-text-primary);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .profile-trigger:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.14);
    }

    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0a0b0f;
    }

    .profile-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .rotated {
      transform: rotate(180deg);
      transition: transform 0.2s ease;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 220px;
      background: rgba(16, 18, 25, 0.95);
      backdrop-filter: blur(48px) saturate(200%);
      -webkit-backdrop-filter: blur(48px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04);
      padding: 0.35rem;
      animation: dropdown-in 0.15s ease-out;
    }

    @keyframes dropdown-in {
      from { opacity: 0; transform: translateY(-4px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dropdown-header {
      padding: 0.5rem 0.65rem 0.35rem;
    }

    .dropdown-email {
      font-size: 0.72rem;
      color: var(--ds-text-secondary);
      word-break: break-all;
    }

    .dropdown-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 0.25rem 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.65rem;
      border: none;
      background: transparent;
      color: var(--ds-text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: var(--ds-text-primary);
    }

    .dropdown-item.danger:hover {
      background: rgba(255, 77, 125, 0.12);
      color: #ff7485;
    }

    /* ── Main ── */
    main {
      flex: 1;
      overflow: hidden;
    }

    /* ── Footer ── */
    .app-footer {
      background: rgba(10, 11, 15, 0.6);
      backdrop-filter: blur(40px) saturate(200%);
      -webkit-backdrop-filter: blur(40px) saturate(200%);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.6rem 1.25rem;
    }

    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1400px;
      margin: 0 auto;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      text-decoration: none;
    }

    .footer-logo {
      height: 14px;
      width: auto;
    }

    .footer-sep {
      color: var(--ds-border-strong);
      font-size: 0.75rem;
    }

    .footer-tagline {
      font-size: 0.7rem;
      color: var(--ds-text-secondary);
      margin-top: .1rem;
    }

    .footer-center {
      display: flex;
      align-items: center;
    }

    .footer-oss {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.7rem;
      color: var(--ds-text-secondary);
    }

    .heart-icon {
      color: #ff4d7d;
      margin-top: -.1rem;
    }

    .footer-right {
      display: flex;
      align-items: center;
    }

    .footer-link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.65rem;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--ds-text-secondary);
      text-decoration: none;
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-pill);
      transition: all 0.2s ease;
    }

    .footer-link:hover {
      color: var(--ds-text-primary);
      border-color: var(--ds-border-strong);
      background: rgba(255, 255, 255, 0.04);
    }

    @media (max-width: 640px) {
      .footer-center { display: none; }
      .footer-tagline { display: none; }
      .profile-name { display: none; }
    }
  `],
})
export class AppComponent implements OnInit {
  title = 'Gen UI';
  auth = inject(AuthService);
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);

  readonly Github = Github;
  readonly Heart = Heart;
  readonly ExternalLink = ExternalLink;
  readonly Sparkles = Sparkles;
  readonly BookOpen = BookOpen;
  readonly UserIcon = User;
  readonly LogOutIcon = LogOut;
  readonly ChevronDown = ChevronDown;
  readonly LogInIcon = LogIn;

  dropdownOpen = false;

  ngOnInit(): void {
    this.auth.initAuth();

    // Track page views on route changes
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.analytics.trackPageView(e.urlAfterRedirects));
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  logout(): void {
    this.auth.logout();
    this.dropdownOpen = false;
  }
}

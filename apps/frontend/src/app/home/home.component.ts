import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import {
  LucideAngularModule,
  Sparkles,
  MessageSquare,
  Zap,
  Layers,
  ArrowRight,
  Github,
  BookOpen,
} from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="h-dvh w-full flex items-center justify-center">
      <div class="home-wrapper">
        <!-- Hero -->
        <div class="hero">
          <div class="badge">
            <lucide-icon [img]="Sparkles" [size]="14"></lucide-icon>
            Open-source AI UI toolkit
          </div>

          <h1>
            Generate interfaces<br />
            <span class="gradient-text">with a single prompt</span>
          </h1>

          <p class="tagline">
            Gen UI converts natural language into real Angular components. Describe
            what you need — tables, charts, forms, flows — and watch it appear.
          </p>

          <div class="actions">
            @if (isAuthenticated()) {
              <a routerLink="/conversations" class="btn btn-primary">
                <lucide-icon [img]="MessageSquare" [size]="16"></lucide-icon>
                Open workspace
                <lucide-icon [img]="ArrowRight" [size]="16"></lucide-icon>
              </a>
            } @else {
              <a routerLink="/login" class="btn btn-primary">
                Get started
                <lucide-icon [img]="ArrowRight" [size]="16"></lucide-icon>
              </a>
              <a routerLink="/register" class="btn btn-ghost">
                Create account
              </a>
            }
          </div>
        </div>

        <!-- Feature cards -->
        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">
              <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
            </div>
            <h3>Conversational</h3>
            <p>Chat with an AI agent that understands your UI requirements and iterates in real time.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <lucide-icon [img]="Layers" [size]="20"></lucide-icon>
            </div>
            <h3>Component library</h3>
            <p>30+ production-ready components — tables, charts, forms, wizards, and more.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <lucide-icon [img]="Zap" [size]="20"></lucide-icon>
            </div>
            <h3>Instant preview</h3>
            <p>See rendered output immediately. No build step, no waiting — just results.</p>
          </div>
        </div>

        <!-- Links row -->
        <div class="links">
          <a routerLink="/showcase" class="link-item">
            <lucide-icon [img]="BookOpen" [size]="14"></lucide-icon>
            Component showcase
          </a>
          <span class="dot"></span>
          <a href="https://github.com/anthropics/gen-ui" target="_blank" rel="noopener" class="link-item">
            <lucide-icon [img]="Github" [size]="14"></lucide-icon>
            Star on GitHub
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-wrapper {
      width: 100%;
      max-width: 720px;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Hero */
    .hero {
      text-align: center;
      margin-bottom: 3rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.8rem;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      color: var(--ds-accent-teal);
      background: rgba(0, 255, 245, 0.08);
      border: 1px solid rgba(0, 255, 245, 0.15);
      border-radius: 999px;
      margin-bottom: 1.5rem;
    }

    h1 {
      margin: 0 0 1rem;
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: var(--ds-text-primary);
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline {
      margin: 0 auto 2rem;
      max-width: 520px;
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--ds-text-secondary);
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1.25rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      color: #0a0b0f;
      box-shadow: 0 4px 20px rgba(0, 255, 245, 0.2);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 28px rgba(0, 255, 245, 0.3);
    }

    .btn-ghost {
      color: var(--ds-text-secondary);
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(12px);
    }

    .btn-ghost:hover {
      border-color: rgba(255, 255, 255, 0.18);
      color: var(--ds-text-primary);
    }

    /* Features */
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      width: 100%;
      margin-bottom: 2.5rem;
    }

    .feature-card {
      padding: 1.5rem 1.25rem;
      background: rgba(12, 14, 18, 0.5);
      backdrop-filter: blur(32px) saturate(180%);
      -webkit-backdrop-filter: blur(32px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      text-align: center;
      transition: border-color 0.25s ease;
    }

    .feature-card:hover {
      border-color: rgba(255, 255, 255, 0.12);
    }

    .feature-icon {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      border-radius: 12px;
      background: rgba(0, 255, 245, 0.08);
      color: var(--ds-accent-teal);
    }

    .feature-card h3 {
      margin: 0 0 0.4rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ds-text-primary);
    }

    .feature-card p {
      margin: 0;
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--ds-text-secondary);
    }

    /* Links */
    .links {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .link-item {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--ds-text-secondary);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .link-item:hover {
      color: var(--ds-accent-teal);
    }

    .dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 640px) {
      h1 { font-size: 1.75rem; }
      .features { grid-template-columns: 1fr; }
      .actions { flex-direction: column; align-items: center; }
    }
  `],
})
export class HomeComponent {
  private authService = inject(AuthService);
  isAuthenticated = this.authService.isAuthenticatedSignal;

  readonly Sparkles = Sparkles;
  readonly MessageSquare = MessageSquare;
  readonly Zap = Zap;
  readonly Layers = Layers;
  readonly ArrowRight = ArrowRight;
  readonly Github = Github;
  readonly BookOpen = BookOpen;
}

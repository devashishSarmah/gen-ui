import { Component, Output, EventEmitter, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConversationApiService } from '../core/services/conversation-api.service';
import { ConversationStore } from '../core/stores/conversation.store';
import { UIStateStore } from '../core/stores/ui.store';
import { DynamicUIService } from '../core/services/dynamic-ui.service';
import {
  LucideAngularModule,
  ClipboardList,
  BarChart3,
  Compass,
  FileText,
  Zap,
  RefreshCw,
  Wand2,
  Plus,
  Sparkles,
  Globe,
  type LucideIconData,
} from 'lucide-angular';

export interface ExamplePrompt {
  icon: LucideIconData;
  title: string;
  description: string;
  prompt: string;
}

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="welcome-container">
      <!-- Animated background orb -->
      <div class="bg-orb"></div>

      <div class="welcome-content">
        <div class="welcome-header">
          <div class="logo-mark">
            <lucide-icon [img]="Sparkles" [size]="28"></lucide-icon>
          </div>
          <h1>What would you like to build?</h1>
          <p class="subtitle">
            Describe any UI — dashboards, forms, portfolios, data tables — and
            watch it come to life in seconds.
          </p>
        </div>

        <div class="example-prompts">
          <p class="section-label">Get started with an example</p>
          <div class="prompts-grid">
            <button
              *ngFor="let example of examplePrompts; let i = index"
              class="prompt-card"
              [style.animation-delay]="i * 60 + 'ms'"
              (click)="selectPrompt(example)"
            >
              <span class="prompt-icon">
                <lucide-icon [img]="example.icon" [size]="18"></lucide-icon>
              </span>
              <div class="prompt-text">
                <strong>{{ example.title }}</strong>
                <p>{{ example.description }}</p>
              </div>
            </button>
          </div>
        </div>

        <div class="get-started">
          <button class="btn-primary" (click)="startNewConversation()">
            <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
            Start with a blank conversation
          </button>
          <p class="hint">or click any example above</p>
        </div>

        <div class="features">
          <div class="feature-pill">
            <lucide-icon [img]="Zap" [size]="12"></lucide-icon>
            <span>Fast Generation</span>
          </div>
          <div class="feature-pill">
            <lucide-icon [img]="RefreshCw" [size]="12"></lucide-icon>
            <span>Real-time Streaming</span>
          </div>
          <div class="feature-pill">
            <lucide-icon [img]="Wand2" [size]="12"></lucide-icon>
            <span>Multi-step Wizards</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .welcome-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        padding: 2rem;
        background: transparent;
        position: relative;
        overflow: hidden;
      }

      /* Floating gradient orb */
      .bg-orb {
        position: absolute;
        top: 15%;
        left: 50%;
        translate: -50% 0;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(0, 255, 245, 0.08) 0%,
          rgba(91, 74, 255, 0.06) 40%,
          transparent 70%
        );
        filter: blur(60px);
        animation: orbFloat 8s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
      }

      @keyframes orbFloat {
        0%, 100% { translate: -50% 0; }
        50% { translate: -48% -18px; }
      }

      .welcome-content {
        max-width: 720px;
        width: 100%;
        position: relative;
        z-index: 1;
      }

      /* ── Header ── */
      .welcome-header {
        text-align: center;
        margin-bottom: 2.5rem;
      }

      .logo-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.12), rgba(91, 74, 255, 0.12));
        border: 1px solid var(--ds-border);
        color: var(--ds-accent-teal);
        margin-bottom: 1.25rem;
        animation: fadeUp 0.5s ease-out both;
      }

      .welcome-header h1 {
        font-size: 1.85rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0 0 0.6rem;
        animation: fadeUp 0.5s 0.08s ease-out both;
      }

      .subtitle {
        font-size: 0.92rem;
        color: var(--ds-text-secondary);
        margin: 0 auto;
        max-width: 480px;
        line-height: 1.55;
        animation: fadeUp 0.5s 0.15s ease-out both;
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          translate: 0 12px;
        }
        to {
          opacity: 1;
          translate: 0 0;
        }
      }

      /* ── Example prompts ── */
      .example-prompts {
        margin-bottom: 2rem;
      }

      .section-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ds-text-secondary);
        margin: 0 0 1rem;
        text-align: center;
        opacity: 0.7;
      }

      .prompts-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }

      .prompt-card {
        display: flex;
        align-items: flex-start;
        gap: 0.7rem;
        padding: 0.85rem;
        background: var(--ds-surface-glass);
        backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-md);
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: left;
        color: var(--ds-text-primary);
        animation: fadeUp 0.4s ease-out both;

        &:hover {
          border-color: var(--ds-border-glow);
          box-shadow: 0 6px 20px rgba(0, 255, 245, 0.12),
            0 0 0 1px rgba(0, 255, 245, 0.08);
          transform: translateY(-3px);
        }

        &:active {
          transform: translateY(-1px);
        }
      }

      .prompt-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: rgba(0, 255, 245, 0.08);
        color: var(--ds-accent-teal);
      }

      .prompt-text {
        flex: 1;
        min-width: 0;

        strong {
          display: block;
          font-size: 0.82rem;
          color: var(--ds-text-primary);
          margin-bottom: 0.2rem;
        }

        p {
          font-size: 0.75rem;
          color: var(--ds-text-secondary);
          margin: 0;
          line-height: 1.4;
        }
      }

      /* ── CTA ── */
      .get-started {
        text-align: center;
        margin-bottom: 2rem;
      }

      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.6rem 1.4rem;
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        color: #0a0b0f;
        border: none;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 4px 20px rgba(0, 255, 245, 0.2);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0, 255, 245, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .hint {
        font-size: 0.72rem;
        color: var(--ds-text-secondary);
        opacity: 0.5;
        margin: 0.5rem 0 0;
      }

      /* ── Feature pills ── */
      .features {
        display: flex;
        justify-content: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .feature-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.3rem 0.75rem;
        border-radius: var(--ds-radius-pill);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--ds-border);
        font-size: 0.72rem;
        color: var(--ds-text-secondary);

        lucide-icon {
          color: var(--ds-accent-teal);
          opacity: 0.7;
        }
      }

      /* ── Responsive ── */
      @media (max-width: 768px) {
        .welcome-container {
          padding: 1.5rem 1rem;
        }

        .welcome-header h1 {
          font-size: 1.5rem;
        }

        .subtitle {
          font-size: 0.85rem;
        }

        .prompts-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .bg-orb {
          width: 300px;
          height: 300px;
        }
      }

      @media (max-width: 480px) {
        .welcome-container {
          padding: 1.25rem 0.75rem;
          align-items: flex-start;
          padding-top: 2rem;
        }

        .welcome-header {
          margin-bottom: 1.5rem;
        }

        .welcome-header h1 {
          font-size: 1.3rem;
        }

        .logo-mark {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .prompts-grid {
          grid-template-columns: 1fr;
          gap: 0.6rem;
        }

        .prompt-card {
          padding: 0.75rem;
        }

        .features {
          gap: 0.4rem;
        }

        .feature-pill {
          font-size: 0.68rem;
          padding: 0.25rem 0.6rem;
        }

        .bg-orb {
          width: 220px;
          height: 220px;
          top: 5%;
        }
      }
    `,
  ],
})
export class WelcomeScreenComponent {
  @Output() onStart = new EventEmitter<void>();
  @Output() onPromptSelected = new EventEmitter<string>();

  private router = inject(Router);
  private conversationApi = inject(ConversationApiService);
  private conversationStore = inject(ConversationStore);
  private uiStateStore = inject(UIStateStore);
  private dynamicUIService = inject(DynamicUIService);

  readonly Plus = Plus;
  readonly Zap = Zap;
  readonly RefreshCw = RefreshCw;
  readonly Wand2 = Wand2;
  readonly Sparkles = Sparkles;

  examplePrompts: ExamplePrompt[] = [
    {
      icon: BarChart3,
      title: 'Cricket World Cup History',
      description: 'Track India year by year',
      prompt:
        "Visualize India's Cricket World Cup performances year by year with key players and turning points.",
    },
    {
      icon: Globe,
      title: 'Portfolio Page',
      description: 'Hero, projects grid & contact section',
      prompt: 'Build a developer portfolio page with a hero section, a project showcase grid with 4 projects, a skills section, and a contact form',
    },
    {
      icon: Compass,
      title: 'Streaming vs Cinema',
      description: 'Show platforms and impact',
      prompt: 'Visualize the rise of streaming platforms and their impact on cinema.',
    },
    {
      icon: ClipboardList,
      title: 'AR Rahman vs Zimmer',
      description: 'Compare style and influence',
      prompt: 'Compare AR Rahman vs Hans Zimmer in composition style and global influence.',
    },
    {
      icon: FileText,
      title: 'Internet Viral Moments',
      description: 'Break down key milestones',
      prompt: 'Break down the most viral moments in internet history.',
    },
    {
      icon: BarChart3,
      title: 'Multiverse Across Fandoms',
      description: 'Marvel, DC, and anime',
      prompt: 'Visualize the multiverse concept across Marvel, DC, and anime.',
    },
    {
      icon: Sparkles,
      title: 'Pricing Table',
      description: 'Tiered plans with feature comparison',
      prompt: 'Create a pricing table with 3 tiers (Free, Pro, Enterprise) showing features, prices, and call-to-action buttons',
    },
  ];

  selectPrompt(example: ExamplePrompt): void {
    this.createConversationWithPrompt(example.prompt);
  }

  startNewConversation(): void {
    this.conversationStore.setError(null);
    this.uiStateStore.clear();
    this.dynamicUIService.clearSchema();
    sessionStorage.removeItem('pendingPrompt');

    this.conversationApi.createConversation().subscribe({
      next: (conversation) => {
        this.conversationStore.conversations.update((convs) => [conversation, ...convs]);
        this.navigateToConversation(conversation.id);
      },
      error: (error) => {
        console.error('Failed to create conversation:', error);
      },
    });
  }

  private createConversationWithPrompt(prompt: string): void {
    this.conversationStore.setError(null);
    this.uiStateStore.clear();
    this.dynamicUIService.clearSchema();

    this.conversationApi.createConversation().subscribe({
      next: (conversation) => {
        this.conversationStore.conversations.update((convs) => [conversation, ...convs]);
        // Store prompt to use after navigation
        sessionStorage.setItem('pendingPrompt', prompt);
        this.navigateToConversation(conversation.id);
      },
      error: (error) => {
        console.error('Failed to create conversation:', error);
      },
    });
  }

  private navigateToConversation(conversationId: string): void {
    this.conversationStore.setError(null);
    this.conversationStore.setCurrentConversation(conversationId);
    this.router.navigate(['/conversations', conversationId]);
  }
}

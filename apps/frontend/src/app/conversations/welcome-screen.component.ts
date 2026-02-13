import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConversationApiService } from '../core/services/conversation-api.service';
import { ConversationStore } from '../core/stores/conversation.store';
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
      <div class="welcome-content">
        <div class="welcome-header">
          <h1>Welcome to Gen UI</h1>
          <p class="subtitle">
            I can help you create dynamic user interfaces through conversation.
            Just describe what you need!
          </p>
        </div>

        <div class="example-prompts">
          <h2>Try asking me to…</h2>
          <div class="prompts-grid">
            <button
              *ngFor="let example of examplePrompts"
              class="prompt-card"
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
            Start a New Conversation
          </button>
        </div>

        <div class="features">
          <div class="feature">
            <span class="feature-icon">
              <lucide-icon [img]="Zap" [size]="14"></lucide-icon>
            </span>
            <div class="feature-text">
              <strong>Fast Generation</strong>
              <p>UI updates in under 300ms</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">
              <lucide-icon [img]="RefreshCw" [size]="14"></lucide-icon>
            </span>
            <div class="feature-text">
              <strong>Real-time Streaming</strong>
              <p>Watch your UI build progressively</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">
              <lucide-icon [img]="Wand2" [size]="14"></lucide-icon>
            </span>
            <div class="feature-text">
              <strong>Multi-step Wizards</strong>
              <p>Complex flows made simple</p>
            </div>
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
      }

      .welcome-content {
        max-width: 800px;
        width: 100%;
      }

      .welcome-header {
        text-align: center;
        margin-bottom: 2rem;

        h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem;
        }

        .subtitle {
          font-size: 0.95rem;
          color: var(--ds-text-secondary);
          margin: 0;
        }
      }

      .example-prompts {
        margin-bottom: 2rem;

        h2 {
          font-size: 1rem;
          color: var(--ds-text-secondary);
          margin: 0 0 1rem;
          text-align: center;
        }
      }

      .prompts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .prompt-card {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.85rem;
        background: var(--ds-surface-glass);
        backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-md);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        color: var(--ds-text-primary);

        &:hover {
          border-color: var(--ds-border-glow);
          box-shadow: 0 4px 12px rgba(0, 255, 245, 0.15);
          transform: translateY(-2px);
        }
      }

      .prompt-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(0, 255, 245, 0.08);
        color: var(--ds-accent-teal);
      }

      .prompt-text {
        flex: 1;
        min-width: 0;

        strong {
          display: block;
          font-size: 0.85rem;
          color: var(--ds-text-primary);
          margin-bottom: 0.2rem;
        }

        p {
          font-size: 0.78rem;
          color: var(--ds-text-secondary);
          margin: 0;
          line-height: 1.4;
        }
      }

      .get-started {
        text-align: center;
        margin-bottom: 2rem;
      }

      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.55rem 1.25rem;
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
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(0, 255, 245, 0.3);
        }
      }

      .features {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
      }

      .feature {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .feature-icon {
        display: flex;
        align-items: center;
        color: var(--ds-accent-teal);
        opacity: 0.7;
      }

      .feature-text {
        strong {
          display: block;
          font-size: 0.8rem;
          color: var(--ds-text-primary);
        }

        p {
          font-size: 0.7rem;
          color: var(--ds-text-secondary);
          margin: 0;
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

  readonly Plus = Plus;
  readonly Zap = Zap;
  readonly RefreshCw = RefreshCw;
  readonly Wand2 = Wand2;

  examplePrompts: ExamplePrompt[] = [
    {
      icon: BarChart3,
      title: 'Cricket World Cup History',
      description: 'Track India year by year',
      prompt:
        "Visualize India's Cricket World Cup performances year by year with key players and turning points.",
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
  ];

  selectPrompt(example: ExamplePrompt): void {
    this.createConversationWithPrompt(example.prompt);
  }

  startNewConversation(): void {
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
    this.conversationStore.setCurrentConversation(conversationId);
    this.router.navigate(['/conversations', conversationId]);
  }
}

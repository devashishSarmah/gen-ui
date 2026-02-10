import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConversationApiService } from '../core/services/conversation-api.service';
import { ConversationStore } from '../core/stores/conversation.store';

export interface ExamplePrompt {
  icon: string;
  title: string;
  description: string;
  prompt: string;
}

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [CommonModule],
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
          <h2>Try asking me to...</h2>
          <div class="prompts-grid">
            <button
              *ngFor="let example of examplePrompts"
              class="prompt-card"
              (click)="selectPrompt(example)"
            >
              <span class="prompt-icon">{{ example.icon }}</span>
              <div class="prompt-text">
                <strong>{{ example.title }}</strong>
                <p>{{ example.description }}</p>
              </div>
            </button>
          </div>
        </div>

        <div class="get-started">
          <button class="btn-primary" (click)="startNewConversation()">
            Start a New Conversation
          </button>
        </div>

        <div class="features">
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <div class="feature-text">
              <strong>Fast Generation</strong>
              <p>UI updates in under 300ms</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">🔄</span>
            <div class="feature-text">
              <strong>Real-time Streaming</strong>
              <p>Watch your UI build progressively</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">🧙</span>
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
        background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      }

      .welcome-content {
        max-width: 800px;
        width: 100%;
      }

      .welcome-header {
        text-align: center;
        margin-bottom: 2rem;

        h1 {
          font-size: 2.5rem;
          color: #1976d2;
          margin: 0 0 0.5rem;
        }

        .subtitle {
          font-size: 1.125rem;
          color: #666;
          margin: 0;
        }
      }

      .example-prompts {
        margin-bottom: 2rem;

        h2 {
          font-size: 1.25rem;
          color: #333;
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
        padding: 1rem;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;

        &:hover {
          border-color: #1976d2;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
          transform: translateY(-2px);
        }
      }

      .prompt-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .prompt-text {
        flex: 1;
        min-width: 0;

        strong {
          display: block;
          font-size: 0.9rem;
          color: #333;
          margin-bottom: 0.25rem;
        }

        p {
          font-size: 0.8rem;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }
      }

      .get-started {
        text-align: center;
        margin-bottom: 2rem;
      }

      .btn-primary {
        padding: 1rem 2rem;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1.125rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: #1565c0;
        }
      }

      .features {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
      }

      .feature {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .feature-icon {
        font-size: 1.25rem;
      }

      .feature-text {
        strong {
          display: block;
          font-size: 0.875rem;
          color: #333;
        }

        p {
          font-size: 0.75rem;
          color: #666;
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

  examplePrompts: ExamplePrompt[] = [
    {
      icon: '📋',
      title: 'Create a Form',
      description: 'Build a contact form with validation',
      prompt: 'Create a contact form with name, email, and message fields with validation',
    },
    {
      icon: '📊',
      title: 'Build a Dashboard',
      description: 'Generate charts and data tables',
      prompt: 'Create a sales dashboard with a bar chart and a data table showing monthly revenue',
    },
    {
      icon: '🧭',
      title: 'Design a Wizard',
      description: 'Multi-step onboarding flow',
      prompt: 'Create a 3-step user onboarding wizard with personal info, preferences, and confirmation',
    },
    {
      icon: '📝',
      title: 'Survey Builder',
      description: 'Interactive questionnaire',
      prompt: 'Build a customer satisfaction survey with multiple choice and rating questions',
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

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConversationListComponent } from './conversation-list.component';

@Component({
  selector: 'app-conversation-layout',
  standalone: true,
  imports: [RouterModule, ConversationListComponent],
  template: `
    <div class="conversation-layout">
      <aside class="sidebar">
        <div class="sidebar-content">
          <app-conversation-list></app-conversation-list>
        </div>
      </aside>
      <main class="main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .conversation-layout {
        display: flex;
        height: calc(100vh - var(--app-header-height, 80px) - var(--app-footer-height, 48px));
        width: 100%;
        overflow: hidden;
      }

      .sidebar {
        width: 260px;
        border-right: 1px solid var(--ds-border);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--ds-surface-glass);
        backdrop-filter: blur(24px) saturate(180%);
      }

      .sidebar-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: transparent;
      }

      @media (max-width: 768px) {
        .conversation-layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid var(--ds-border);
          max-height: 200px;
        }

        .main {
          min-height: 0;
        }
      }
    `,
  ],
})
export class ConversationLayoutComponent {}

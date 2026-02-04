import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-conversation-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="conversation-layout">
      <aside class="sidebar">
        <router-outlet name="list"></router-outlet>
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
        height: 100%;
        width: 100%;
      }

      .sidebar {
        width: 300px;
        border-right: 1px solid #e0e0e0;
        overflow: hidden;
      }

      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .conversation-layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #e0e0e0;
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

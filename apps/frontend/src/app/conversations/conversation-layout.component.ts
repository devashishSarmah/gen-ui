import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-conversation-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="conversation-layout">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <button class="toggle-btn" (click)="toggleSidebar()" [attr.aria-label]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          <span class="toggle-icon">{{ sidebarCollapsed() ? '→' : '←' }}</span>
        </button>
        <div class="sidebar-content" *ngIf="!sidebarCollapsed()">
          <router-outlet name="list"></router-outlet>
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
        height: 100%;
        width: 100%;
      }

      .sidebar {
        width: 300px;
        border-right: 1px solid #e0e0e0;
        overflow: hidden;
        transition: width 0.3s ease;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .sidebar.collapsed {
        width: 48px;
      }

      .toggle-btn {
        position: absolute;
        top: 1rem;
        right: 0.5rem;
        width: 32px;
        height: 32px;
        border: 1px solid #e0e0e0;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }

      .toggle-btn:hover {
        background: #f5f5f5;
      }

      .sidebar.collapsed .toggle-btn {
        right: 8px;
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

        .sidebar.collapsed {
          width: 100%;
          max-height: 48px;
        }

        .main {
          min-height: 0;
        }
      }
    `,
  ],
})
export class ConversationLayoutComponent {
  sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}

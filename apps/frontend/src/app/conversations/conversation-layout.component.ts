import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConversationListComponent } from './conversation-list.component';
import {
  LucideAngularModule,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-angular';

@Component({
  selector: 'app-conversation-layout',
  standalone: true,
  imports: [RouterModule, ConversationListComponent, LucideAngularModule],
  template: `
    <div class="conversation-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-content">
          <app-conversation-list></app-conversation-list>
        </div>
      </aside>

      <!-- Mobile overlay -->
      @if (mobileSidebarOpen()) {
        <div class="sidebar-overlay" (click)="mobileSidebarOpen.set(false)"></div>
      }

      <!-- Mobile sidebar drawer -->
      <aside class="sidebar-mobile" [class.open]="mobileSidebarOpen()">
        <div class="sidebar-content">
          <app-conversation-list></app-conversation-list>
        </div>
      </aside>

      <main class="main">
        <div class="main-toolbar">
          <!-- Desktop collapse toggle -->
          <button
            type="button"
            class="sidebar-toggle desktop-only"
            (click)="sidebarCollapsed.set(!sidebarCollapsed())"
            [attr.aria-label]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <lucide-icon [img]="sidebarCollapsed() ? PanelLeftOpen : PanelLeftClose" [size]="16"></lucide-icon>
          </button>

          <!-- Mobile sidebar toggle -->
          <button
            type="button"
            class="sidebar-toggle mobile-only"
            (click)="mobileSidebarOpen.set(!mobileSidebarOpen())"
            aria-label="Toggle conversations"
          >
            <lucide-icon [img]="PanelLeftOpen" [size]="16"></lucide-icon>
          </button>
        </div>
        <div class="main-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .conversation-layout {
        display: flex;
        height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 48px));
        height: calc(100dvh - var(--app-header-height, 60px) - var(--app-footer-height, 48px));
        width: 100%;
        overflow: hidden;
      }

      /* ── Desktop sidebar ── */
      .sidebar {
        width: 260px;
        min-width: 260px;
        border-right: 1px solid var(--ds-border);
        overflow: visible;
        display: flex;
        flex-direction: column;
        background: var(--ds-surface-glass);
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.2s ease;
      }

      .sidebar.collapsed {
        width: 0;
        min-width: 0;
        overflow: hidden;
        border-right: none;
        opacity: 0;
        pointer-events: none;
      }

      .sidebar-content {
        flex: 1;
        overflow: visible;
        display: flex;
        flex-direction: column;
        min-width: 260px;  /* keeps content from reflowing during animation */
      }

      /* ── Mobile sidebar drawer ── */
      .sidebar-mobile {
        display: none;
      }

      .sidebar-overlay {
        display: none;
      }

      /* ── Main area ── */
      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: transparent;
        min-width: 0;
      }

      .main-toolbar {
        display: flex;
        align-items: center;
        padding: 0.35rem 0.5rem;
        border-bottom: 1px solid var(--ds-border);
        background: var(--ds-surface-glass);
        min-height: 36px;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .sidebar-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.3rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-md);
        background: transparent;
        color: var(--ds-text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sidebar-toggle:hover {
        color: var(--ds-text-primary);
        background: rgba(255, 255, 255, 0.06);
        border-color: var(--ds-border-strong);
      }

      .mobile-only {
        display: none;
      }

      .desktop-only {
        display: inline-flex;
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }

      /* ── Responsive: tablet ── */
      @media (max-width: 1024px) {
        .sidebar {
          width: 220px;
          min-width: 220px;
        }

        .sidebar-content {
          min-width: 220px;
        }
      }

      /* ── Responsive: mobile ── */
      @media (max-width: 768px) {
        /* Hide desktop sidebar entirely on mobile */
        .sidebar {
          display: none;
        }

        .mobile-only {
          display: inline-flex;
        }

        .desktop-only {
          display: none;
        }

        /* Mobile sidebar = sliding drawer overlay */
        .sidebar-mobile {
          display: flex;
          flex-direction: column;
          position: fixed;
          top: var(--app-header-height, 60px);
          left: 0;
          bottom: var(--app-footer-height, 48px);
          width: min(300px, 80vw);
          background: var(--ds-surface-glass-strong);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border-right: 1px solid var(--ds-border);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 50;
          overflow: hidden;
        }

        .sidebar-mobile.open {
          transform: translateX(0);
          box-shadow: 8px 0 32px rgba(0, 0, 0, 0.4);
        }

        .sidebar-mobile .sidebar-content {
          min-width: 0;
          flex: 1;
          overflow: auto;
        }

        .sidebar-overlay {
          display: block;
          position: fixed;
          top: var(--app-header-height, 60px);
          left: 0;
          right: 0;
          bottom: var(--app-footer-height, 48px);
          background: rgba(0, 0, 0, 0.5);
          z-index: 49;
          animation: fadeIn 0.2s ease;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
  ],
})
export class ConversationLayoutComponent {
  readonly PanelLeftClose = PanelLeftClose;
  readonly PanelLeftOpen = PanelLeftOpen;

  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);
}

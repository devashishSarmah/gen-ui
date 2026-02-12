import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMPONENT_LIBRARY, ComponentLibrary } from '../component-library';
import { ComponentCardComponent } from './component-card/component-card.component';
import { DsIconComponent } from '../components/shared/ds-icon.component';

type Category = ComponentLibrary['category'] | 'all';

@Component({
  selector: 'ds-showcase',
  standalone: true,
  imports: [CommonModule, ComponentCardComponent, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="showcase-shell">
      <!-- Sidebar -->
      <nav class="showcase-sidebar">
        <div class="sidebar-header">
          <h1 class="sidebar-title">Gen UI</h1>
          <span class="sidebar-subtitle">Design System</span>
        </div>

        <div class="sidebar-stats">
          <div class="stat">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">Components</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ categoryCount }}</span>
            <span class="stat-label">Categories</span>
          </div>
        </div>

        <div class="sidebar-search">
          <input
            type="text"
            placeholder="Search components..."
            class="search-input"
            [value]="search()"
            (input)="onSearch($event)"
          />
        </div>

        <ul class="sidebar-categories">
          <li
            *ngFor="let cat of categories"
            class="category-item"
            [class.active]="activeCategory() === cat.key"
            (click)="setCategory(cat.key)"
          >
            <span class="category-icon"><ds-icon [name]="cat.icon" [size]="16"></ds-icon></span>
            <span class="category-label">{{ cat.label }}</span>
            <span class="category-count">{{ cat.count }}</span>
          </li>
        </ul>
      </nav>

      <!-- Main content -->
      <main class="showcase-main">
        <header class="main-header">
          <h2 class="main-title">
            {{ activeCategoryLabel() }}
            <span class="component-count">{{ filteredComponents().length }} components</span>
          </h2>
          <p class="main-subtitle">
            Auto-generated documentation from the component library metadata.
            Each card shows a live preview, props schema, and sample JSON.
          </p>
        </header>

        <div class="components-grid">
          <ds-component-card
            *ngFor="let entry of filteredComponents(); trackBy: trackByName"
            [entry]="entry"
          ></ds-component-card>
        </div>

        <div *ngIf="filteredComponents().length === 0" class="empty-state">
          <span class="empty-icon"><ds-icon name="search" [size]="40"></ds-icon></span>
          <p>No components match your search.</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      background: var(--ds-bg, #0a0b0f);
      color: var(--ds-text-primary, #fff);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .showcase-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .showcase-sidebar {
      width: 280px;
      min-width: 280px;
      background: var(--ds-surface, #101219);
      border-right: 1px solid var(--ds-border, rgba(255,255,255,0.08));
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.08));
    }

    .sidebar-title {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #08fff3, #4d3aff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sidebar-subtitle {
      font-size: 0.75rem;
      color: var(--ds-text-secondary, #9f9f9f);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .sidebar-stats {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.08));
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ds-accent-teal, #08fff3);
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--ds-text-secondary, #9f9f9f);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sidebar-search {
      padding: 1rem 1.5rem;
    }

    .search-input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--ds-border, rgba(255,255,255,0.08));
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
      color: var(--ds-text-primary, #fff);
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: var(--ds-accent-teal, #08fff3);
    }

    .search-input::placeholder {
      color: var(--ds-text-secondary, #9f9f9f);
    }

    .sidebar-categories {
      list-style: none;
      margin: 0;
      padding: 0.5rem 0;
      flex: 1;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 1.5rem;
      cursor: pointer;
      font-size: 0.85rem;
      color: var(--ds-text-secondary, #9f9f9f);
      transition: all 0.15s;
    }

    .category-item:hover {
      background: rgba(255,255,255,0.03);
      color: var(--ds-text-primary, #fff);
    }

    .category-item.active {
      background: rgba(8, 255, 243, 0.06);
      color: var(--ds-accent-teal, #08fff3);
      border-right: 2px solid var(--ds-accent-teal, #08fff3);
    }

    .category-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
    }

    .category-label {
      flex: 1;
      text-transform: capitalize;
    }

    .category-count {
      font-size: 0.7rem;
      padding: 0.1rem 0.5rem;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      color: var(--ds-text-secondary, #9f9f9f);
    }

    /* ── Main content ── */
    .showcase-main {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    .main-header {
      margin-bottom: 2rem;
    }

    .main-title {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .component-count {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      color: var(--ds-text-secondary, #9f9f9f);
      font-weight: 400;
    }

    .main-subtitle {
      margin: 0;
      font-size: 0.85rem;
      color: var(--ds-text-secondary, #9f9f9f);
      line-height: 1.5;
    }

    .components-grid {
      max-width: 900px;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--ds-text-secondary, #9f9f9f);
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
  `],
})
export class ShowcaseComponent {
  private readonly library = COMPONENT_LIBRARY;

  readonly totalCount = this.library.length;
  readonly categoryCount = new Set(this.library.map(c => c.category)).size;

  readonly search = signal('');
  readonly activeCategory = signal<Category>('all');

  readonly categories: { key: Category; label: string; icon: string; count: number }[] = [
    { key: 'all', label: 'All Components', icon: 'layers', count: this.library.length },
    ...this.buildCategories(),
  ];

  readonly activeCategoryLabel = computed(() => {
    const cat = this.categories.find(c => c.key === this.activeCategory());
    return cat?.label ?? 'All Components';
  });

  readonly filteredComponents = computed(() => {
    let result = this.library;
    const cat = this.activeCategory();
    if (cat !== 'all') {
      result = result.filter(c => c.category === cat);
    }
    const q = this.search().toLowerCase().trim();
    if (q) {
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return result;
  });

  private buildCategories() {
    const iconMap: Record<string, string> = {
      form: 'text-cursor-input',
      layout: 'layout-grid',
      'data-display': 'bar-chart-3',
      navigation: 'compass',
      typography: 'type',
      feedback: 'message-circle',
      error: 'alert-triangle',
    };
    const counts = new Map<string, number>();
    this.library.forEach(c => counts.set(c.category, (counts.get(c.category) ?? 0) + 1));
    return Array.from(counts.entries()).map(([key, count]) => ({
      key: key as Category,
      label: key.replace('-', ' '),
      icon: iconMap[key] ?? 'layers',
      count,
    }));
  }

  setCategory(cat: Category): void {
    this.activeCategory.set(cat);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
  }

  trackByName(_: number, entry: ComponentLibrary): string {
    return entry.name;
  }
}

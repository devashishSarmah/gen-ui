import { Injectable, signal, computed } from '@angular/core';

/**
 * Client-side data engine for filtering, sorting, and paginating
 * data within AI-generated UIs — without backend roundtrips.
 *
 * How it works:
 *  1. When a data component (table, list) is rendered, it registers its
 *     full dataset with `registerSource(id, data)`.
 *  2. Form components with a `filterTarget` or `sortTarget` prop call
 *     `applyFilter()` / `applySort()` when their value changes.
 *  3. The data component reads its live data via `getData(id)` which
 *     returns a computed signal of the filtered + sorted + paginated slice.
 */

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  /** The field (column key / item property) to filter on */
  field: string;
  /** Filter operator */
  operator: 'contains' | 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
  /** The value to filter by */
  value: any;
}

interface DataSource {
  /** Original unfiltered dataset */
  raw: any[];
  /** Active filters keyed by filterId (one per form control) */
  filters: Map<string, FilterConfig>;
  /** Current sort */
  sort: SortConfig | null;
  /** Page size (0 = no pagination) */
  pageSize: number;
  /** Current page (0-based) */
  currentPage: number;
  /** Signal holding the processed data */
  version: ReturnType<typeof signal<number>>;
}

@Injectable({ providedIn: 'root' })
export class ClientDataEngine {
  private sources = new Map<string, DataSource>();

  // ── Source registration ────────────────────────────────────────────

  /** Register a data source (table/list/listbox). Call on component creation. */
  registerSource(id: string, data: any[], pageSize = 0): void {
    const existing = this.sources.get(id);
    if (existing) {
      // Update raw data but preserve filters/sort
      existing.raw = data;
      existing.pageSize = pageSize;
      existing.version.update((v) => v + 1);
      return;
    }

    this.sources.set(id, {
      raw: data,
      filters: new Map(),
      sort: null,
      pageSize,
      currentPage: 0,
      version: signal(0),
    });
  }

  /** Unregister a data source (call on component destroy). */
  unregisterSource(id: string): void {
    this.sources.delete(id);
  }

  // ── Filtering ──────────────────────────────────────────────────────

  /**
   * Apply a filter from a form control.
   * @param sourceId  The data source `id` (e.g. the table's id)
   * @param filterId  Unique filter key (usually the form control's id)
   * @param config    Filter configuration, or null to remove
   */
  applyFilter(sourceId: string, filterId: string, config: FilterConfig | null): void {
    const src = this.sources.get(sourceId);
    if (!src) return;

    if (!config || config.value === '' || config.value == null) {
      src.filters.delete(filterId);
    } else {
      src.filters.set(filterId, config);
    }
    src.currentPage = 0; // reset page on filter change
    src.version.update((v) => v + 1);
  }

  // ── Sorting ────────────────────────────────────────────────────────

  applySort(sourceId: string, config: SortConfig | null): void {
    const src = this.sources.get(sourceId);
    if (!src) return;

    // Toggle direction if same key
    if (src.sort && config && src.sort.key === config.key) {
      src.sort = {
        key: config.key,
        direction: src.sort.direction === 'asc' ? 'desc' : 'asc',
      };
    } else {
      src.sort = config;
    }
    src.version.update((v) => v + 1);
  }

  // ── Pagination ─────────────────────────────────────────────────────

  setPage(sourceId: string, page: number): void {
    const src = this.sources.get(sourceId);
    if (!src) return;
    src.currentPage = Math.max(0, page);
    src.version.update((v) => v + 1);
  }

  setPageSize(sourceId: string, pageSize: number): void {
    const src = this.sources.get(sourceId);
    if (!src) return;
    src.pageSize = pageSize;
    src.currentPage = 0;
    src.version.update((v) => v + 1);
  }

  // ── Data access ────────────────────────────────────────────────────

  /**
   * Get the version signal for a data source (for use in computed()).
   */
  getVersion(sourceId: string): ReturnType<typeof signal<number>> | undefined {
    return this.sources.get(sourceId)?.version;
  }

  /**
   * Get the current processed (filtered + sorted + paginated) data.
   * Call this whenever the version signal changes.
   */
  getData(sourceId: string): any[] {
    const src = this.sources.get(sourceId);
    if (!src) return [];

    let result = [...src.raw];

    // Apply filters
    for (const filter of src.filters.values()) {
      result = this.applyFilterFn(result, filter);
    }

    // Apply sort
    if (src.sort) {
      result = this.applySortFn(result, src.sort);
    }

    // Apply pagination
    if (src.pageSize > 0) {
      const start = src.currentPage * src.pageSize;
      result = result.slice(start, start + src.pageSize);
    }

    return result;
  }

  /** Get total count after filtering (before pagination). */
  getFilteredCount(sourceId: string): number {
    const src = this.sources.get(sourceId);
    if (!src) return 0;

    let result = src.raw;
    for (const filter of src.filters.values()) {
      result = this.applyFilterFn(result, filter);
    }
    return result.length;
  }

  /** Get total page count. */
  getPageCount(sourceId: string): number {
    const src = this.sources.get(sourceId);
    if (!src || src.pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(this.getFilteredCount(sourceId) / src.pageSize));
  }

  /** Get current page (0-based). */
  getCurrentPage(sourceId: string): number {
    return this.sources.get(sourceId)?.currentPage ?? 0;
  }

  /** Get the current sort config. */
  getSortConfig(sourceId: string): SortConfig | null {
    return this.sources.get(sourceId)?.sort ?? null;
  }

  // ── Clear all state (call on navigation away) ──────────────────────

  clearAll(): void {
    this.sources.clear();
  }

  // ── Internal filter/sort logic ─────────────────────────────────────

  private applyFilterFn(data: any[], filter: FilterConfig): any[] {
    return data.filter((row) => {
      const val = this.getNestedValue(row, filter.field);
      switch (filter.operator) {
        case 'contains':
          return String(val ?? '')
            .toLowerCase()
            .includes(String(filter.value).toLowerCase());
        case 'equals':
          return String(val ?? '').toLowerCase() === String(filter.value).toLowerCase();
        case 'gt':
          return Number(val) > Number(filter.value);
        case 'lt':
          return Number(val) < Number(filter.value);
        case 'gte':
          return Number(val) >= Number(filter.value);
        case 'lte':
          return Number(val) <= Number(filter.value);
        case 'in': {
          const allowed = Array.isArray(filter.value)
            ? filter.value.map((v: any) => String(v).toLowerCase())
            : [String(filter.value).toLowerCase()];
          return allowed.includes(String(val ?? '').toLowerCase());
        }
        default:
          return true;
      }
    });
  }

  private applySortFn(data: any[], sort: SortConfig): any[] {
    return data.slice().sort((a, b) => {
      const aVal = this.getNestedValue(a, sort.key);
      const bVal = this.getNestedValue(b, sort.key);
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      let cmp: number;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        cmp = aNum - bNum;
      } else {
        cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      }
      return sort.direction === 'desc' ? -cmp : cmp;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? '';
  }
}

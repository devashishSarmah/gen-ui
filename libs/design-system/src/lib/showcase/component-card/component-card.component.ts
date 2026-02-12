import {
  Component,
  Input,
  ViewChild,
  ViewContainerRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { ComponentLibrary } from '../../component-library';
import { generateSampleProps, SAMPLE_OVERRIDES } from '../sample-data';

@Component({
  selector: 'ds-component-card',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="component-card" [id]="entry.name">
      <header class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">{{ entry.name }}</h3>
          <span class="card-category" [attr.data-category]="entry.category">
            {{ entry.category }}
          </span>
        </div>
        <p class="card-description">{{ entry.description }}</p>
      </header>

      <!-- Live Preview -->
      <div class="card-preview">
        <div class="preview-label">Live Preview</div>
        <div class="preview-area">
          <ng-container #previewHost></ng-container>
        </div>
      </div>

      <!-- Props Table -->
      <div class="card-props">
        <div class="props-header" (click)="propsExpanded = !propsExpanded">
          <span>Props Schema</span>
          <span class="toggle">{{ propsExpanded ? '▾' : '▸' }}</span>
        </div>
        <table *ngIf="propsExpanded" class="props-table">
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let prop of entry.propsSchema | keyvalue">
              <td class="prop-name">{{ prop.key }}</td>
              <td class="prop-type">{{ formatType(prop.value) }}</td>
              <td class="prop-default">{{ formatDefault(prop.value) }}</td>
              <td class="prop-desc">{{ prop.value.description || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sample JSON -->
      <div class="card-json">
        <div class="json-header" (click)="jsonExpanded = !jsonExpanded">
          <span>Sample Props JSON</span>
          <span class="toggle">{{ jsonExpanded ? '▾' : '▸' }}</span>
        </div>
        <pre *ngIf="jsonExpanded" class="json-block"><code>{{ sampleJson }}</code></pre>
      </div>
    </article>
  `,
  styles: [`
    .component-card {
      border: 1px solid var(--ds-border, rgba(255,255,255,0.08));
      border-radius: 12px;
      background: var(--ds-surface, #101219);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.08));
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .card-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--ds-text-primary, #fff);
      font-family: monospace;
    }

    .card-category {
      font-size: 0.7rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: rgba(8, 255, 243, 0.1);
      color: var(--ds-accent-teal, #08fff3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    .card-category[data-category="form"] { background: rgba(96, 165, 250, 0.12); color: #60a5fa; }
    .card-category[data-category="layout"] { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
    .card-category[data-category="data-display"] { background: rgba(52, 211, 153, 0.12); color: #34d399; }
    .card-category[data-category="navigation"] { background: rgba(251, 191, 36, 0.12); color: #fbbf24; }
    .card-category[data-category="typography"] { background: rgba(244, 114, 182, 0.12); color: #f472b6; }
    .card-category[data-category="feedback"] { background: rgba(96, 165, 250, 0.12); color: #60a5fa; }
    .card-category[data-category="error"] { background: rgba(255, 116, 133, 0.12); color: #ff7485; }

    .card-description {
      margin: 0;
      font-size: 0.875rem;
      color: var(--ds-text-secondary, #9f9f9f);
      line-height: 1.5;
    }

    .card-preview {
      padding: 1.5rem;
      border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.08));
    }

    .preview-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ds-text-secondary, #9f9f9f);
      margin-bottom: 1rem;
    }

    .preview-area {
      padding: 1rem;
      border-radius: 8px;
      background: var(--ds-surface-glass, rgba(255,255,255,0.04));
      border: 1px dashed var(--ds-border, rgba(255,255,255,0.08));
      min-height: 60px;
      transform: translateZ(0);
      overflow: hidden;
      position: relative;
    }

    .card-props, .card-json {
      border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.08));
    }

    .props-header, .json-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ds-text-secondary, #9f9f9f);
      user-select: none;
    }

    .props-header:hover, .json-header:hover {
      background: rgba(255,255,255,0.02);
    }

    .toggle {
      font-size: 0.9rem;
    }

    .props-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
    }

    .props-table th {
      text-align: left;
      padding: 0.5rem 1.5rem;
      font-weight: 500;
      color: var(--ds-text-secondary, #9f9f9f);
      border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.08));
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .props-table td {
      padding: 0.5rem 1.5rem;
      color: var(--ds-text-primary, #fff);
      border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.04));
    }

    .prop-name {
      font-family: monospace;
      color: var(--ds-accent-teal, #08fff3) !important;
      font-size: 0.8rem;
    }

    .prop-type {
      font-family: monospace;
      color: #8b5cf6 !important;
      font-size: 0.8rem;
    }

    .prop-default {
      font-family: monospace;
      color: var(--ds-text-secondary, #9f9f9f) !important;
      font-size: 0.8rem;
    }

    .prop-desc {
      color: var(--ds-text-secondary, #9f9f9f) !important;
      font-size: 0.8rem;
    }

    .json-block {
      margin: 0;
      padding: 1rem 1.5rem;
      background: rgba(0,0,0,0.3);
      color: #e2e8f0;
      font-size: 0.8rem;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `],
})
export class ComponentCardComponent implements AfterViewInit, OnChanges {
  @Input() entry!: ComponentLibrary;

  @ViewChild('previewHost', { read: ViewContainerRef })
  previewHost!: ViewContainerRef;

  propsExpanded = false;
  jsonExpanded = false;
  sampleJson = '';

  private cdr = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    this.renderPreview();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entry']) {
      this.sampleJson = JSON.stringify(this.getSampleProps(), null, 2);
      if (this.previewHost) {
        this.renderPreview();
      }
    }
  }

  private getSampleProps(): Record<string, any> {
    const override = SAMPLE_OVERRIDES[this.entry.name];
    if (override) return override;
    return generateSampleProps(this.entry.propsSchema);
  }

  private renderPreview(): void {
    if (!this.previewHost) return;
    this.previewHost.clear();

    try {
      const componentRef = this.previewHost.createComponent(this.entry.component);
      const props = this.getSampleProps();
      for (const [key, value] of Object.entries(props)) {
        if (key in componentRef.instance) {
          (componentRef.instance as any)[key] = value;
        }
      }
      componentRef.changeDetectorRef.detectChanges();
    } catch (e) {
      console.warn(`[Showcase] Could not render preview for "${this.entry.name}":`, e);
    }
    this.cdr.detectChanges();
  }

  formatType(schema: any): string {
    if (schema.enum) {
      return schema.enum.map((v: any) => `'${v}'`).join(' | ');
    }
    const t = schema.type;
    if (Array.isArray(t)) return t.join(' | ');
    if (t === 'array' && schema.items) return `${schema.items.type || 'object'}[]`;
    return t || 'any';
  }

  formatDefault(schema: any): string {
    if (schema.default === undefined) return '—';
    return JSON.stringify(schema.default);
  }
}

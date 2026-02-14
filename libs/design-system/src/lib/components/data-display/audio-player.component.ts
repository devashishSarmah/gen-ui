import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="audio-player">
      <figcaption *ngIf="title || subtitle" class="audio-header">
        <h4 *ngIf="title" class="audio-title">{{ title }}</h4>
        <p *ngIf="subtitle" class="audio-subtitle">{{ subtitle }}</p>
      </figcaption>

      <audio
        *ngIf="src; else emptyState"
        class="audio-element"
        [src]="src"
        [controls]="controls"
        [autoplay]="autoplay"
        [loop]="loop"
        [muted]="muted"
        [preload]="preload"
      ></audio>

      <ng-template #emptyState>
        <div class="audio-empty">No audio source provided.</div>
      </ng-template>
    </figure>
  `,
  styles: [
    `
      .audio-player {
        margin: 0;
        display: grid;
        gap: 0.75rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        padding: 0.875rem;
        background: var(--ds-surface-glass);
        backdrop-filter: blur(24px) saturate(180%);
        box-shadow: var(--ds-shadow-medium);
      }

      .audio-header {
        display: grid;
        gap: 0.25rem;
      }

      .audio-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--ds-text-primary);
      }

      .audio-subtitle {
        margin: 0;
        font-size: 0.8rem;
        color: var(--ds-text-secondary);
      }

      .audio-element {
        width: 100%;
        min-height: 2.5rem;
      }

      .audio-empty {
        font-size: 0.8rem;
        color: var(--ds-text-secondary);
        border: 1px dashed var(--ds-border);
        border-radius: var(--ds-radius-md);
        padding: 0.75rem;
      }
    `,
  ],
})
export class AudioPlayerComponent {
  @Input() src = '';
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() controls = true;
  @Input() autoplay = false;
  @Input() loop = false;
  @Input() muted = false;
  @Input() preload: 'none' | 'metadata' | 'auto' = 'metadata';
}

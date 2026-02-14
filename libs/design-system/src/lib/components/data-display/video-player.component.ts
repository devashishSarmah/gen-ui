import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="video-player">
      <figcaption *ngIf="title" class="video-header">
        <h4 class="video-title">{{ title }}</h4>
      </figcaption>

      <div class="video-frame" [style.aspect-ratio]="aspectRatioValue">
        <video
          *ngIf="src; else emptyState"
          class="video-element"
          [src]="src"
          [attr.poster]="poster || null"
          [controls]="controls"
          [autoplay]="autoplay"
          [loop]="loop"
          [muted]="muted"
          [preload]="preload"
          [attr.playsinline]="playsInline ? '' : null"
        ></video>
      </div>

      <ng-template #emptyState>
        <div class="video-empty">No video source provided.</div>
      </ng-template>
    </figure>
  `,
  styles: [
    `
      .video-player {
        margin: 0;
        display: grid;
        gap: 0.75rem;
      }

      .video-header {
        display: grid;
        gap: 0.25rem;
      }

      .video-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--ds-text-primary);
      }

      .video-frame {
        width: 100%;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        overflow: hidden;
        background: #000;
        box-shadow: var(--ds-shadow-medium);
      }

      .video-element {
        display: block;
        width: 100%;
        height: 100%;
        max-height: 72vh;
        object-fit: contain;
      }

      .video-empty {
        font-size: 0.8rem;
        color: var(--ds-text-secondary);
        border: 1px dashed var(--ds-border);
        border-radius: var(--ds-radius-md);
        padding: 0.75rem;
      }
    `,
  ],
})
export class VideoPlayerComponent {
  @Input() src = '';
  @Input() title?: string;
  @Input() poster?: string;
  @Input() controls = true;
  @Input() autoplay = false;
  @Input() loop = false;
  @Input() muted = false;
  @Input() playsInline = true;
  @Input() preload: 'none' | 'metadata' | 'auto' = 'metadata';
  @Input() aspectRatio: '16:9' | '4:3' | '1:1' = '16:9';

  get aspectRatioValue(): string {
    switch (this.aspectRatio) {
      case '4:3':
        return '4 / 3';
      case '1:1':
        return '1 / 1';
      case '16:9':
      default:
        return '16 / 9';
    }
  }
}

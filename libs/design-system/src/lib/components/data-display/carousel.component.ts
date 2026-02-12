import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../shared/ds-icon.component';

export interface CarouselSlide {
  id: string;
  title?: string;
  description?: string;
  image?: string;
  content?: string;
  icon?: string;
}

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="carousel">
      <div class="carousel-viewport">
        <div class="carousel-track" [style.transform]="'translateX(-' + (currentIndex() * 100) + '%)'">
          <div *ngFor="let slide of slides" class="carousel-slide">
            <div class="slide-content">
              <div class="slide-icon" *ngIf="slide.icon"><ds-icon [name]="slide.icon" [size]="24"></ds-icon></div>
              <img *ngIf="slide.image" [src]="slide.image" [alt]="slide.title || 'Slide image'" class="slide-image" />
              <h3 *ngIf="slide.title" class="slide-title">{{ slide.title }}</h3>
              <p *ngIf="slide.description" class="slide-description">{{ slide.description }}</p>
              <div *ngIf="slide.content" class="slide-text">{{ slide.content }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        class="carousel-btn prev" 
        (click)="prev()"
        [disabled]="currentIndex() === 0 && !loop"
        *ngIf="showControls"
      >
        ←
      </button>
      
      <button 
        class="carousel-btn next" 
        (click)="next()"
        [disabled]="currentIndex() === slides.length - 1 && !loop"
        *ngIf="showControls"
      >
        →
      </button>

      <div class="carousel-indicators" *ngIf="showIndicators">
        <button
          *ngFor="let slide of slides; let i = index"
          class="indicator"
          [class.active]="i === currentIndex()"
          (click)="goTo(i)"
          [attr.aria-label]="'Go to slide ' + (i + 1)"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    .carousel {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: var(--ds-radius-xl);
      background: var(--ds-surface-glass);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--ds-border);
      box-shadow: var(--ds-shadow-medium);
    }

    .carousel-viewport {
      width: 100%;
      overflow: hidden;
    }

    .carousel-track {
      display: flex;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .carousel-slide {
      min-width: 100%;
      padding: 1.5rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .slide-content {
      text-align: center;
      max-width: 600px;
    }

    .slide-icon {
      font-size: 4rem;
      margin-bottom: 0.875rem;
      animation: float 3s ease-in-out infinite;
    }

    .slide-image {
      max-width: 100%;
      height: auto;
      max-height: 300px;
      border-radius: var(--ds-radius-lg);
      margin-bottom: 0.875rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .slide-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 1rem;
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .slide-description {
      font-size: 0.85rem;
      color: var(--ds-text-secondary);
      margin: 0 0 0.625rem;
      line-height: 1.6;
    }

    .slide-text {
      font-size: 1rem;
      color: var(--ds-text-primary);
      line-height: 1.7;
    }

    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--ds-surface-glass-strong);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--ds-border);
      color: var(--ds-text-primary);
      font-size: 1.125rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
      box-shadow: var(--ds-shadow-medium);
    }

    .carousel-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(0, 255, 245, 0.15), rgba(91, 74, 255, 0.15));
      border-color: var(--ds-border-glow);
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 8px 24px rgba(0, 255, 245, 0.3);
    }

    .carousel-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .carousel-btn.prev {
      left: 1rem;
    }

    .carousel-btn.next {
      right: 1rem;
    }

    .carousel-indicators {
      position: absolute;
      bottom: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      z-index: 10;
    }

    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0;
    }

    .indicator:hover {
      background: rgba(255, 255, 255, 0.5);
      transform: scale(1.2);
    }

    .indicator.active {
      background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
      border-color: var(--ds-accent-teal);
      box-shadow: 0 0 12px var(--ds-accent-teal);
      width: 20px;
      border-radius: 4px;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `]
})
export class CarouselComponent {
  @Input() slides: CarouselSlide[] = [];
  @Input() autoplay = false;
  @Input() interval = 5000;
  @Input() loop = true;
  @Input() showControls = true;
  @Input() showIndicators = true;

  currentIndex = signal(0);
  private autoplayInterval?: number;

  ngOnInit() {
    if (this.autoplay) {
      this.startAutoplay();
    }
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  next() {
    if (this.currentIndex() < this.slides.length - 1) {
      this.currentIndex.update(i => i + 1);
    } else if (this.loop) {
      this.currentIndex.set(0);
    }
  }

  prev() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
    } else if (this.loop) {
      this.currentIndex.set(this.slides.length - 1);
    }
  }

  goTo(index: number) {
    this.currentIndex.set(index);
  }

  private startAutoplay() {
    this.autoplayInterval = window.setInterval(() => {
      this.next();
    }, this.interval);
  }

  private stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }
}

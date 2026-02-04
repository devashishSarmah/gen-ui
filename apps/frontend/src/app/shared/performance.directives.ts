import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef, NgZone, ElementRef, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

/**
 * Lazy load directive for components
 * Loads component only when visible in viewport
 */
@Directive({
  selector: '[appLazyLoad]',
  standalone: true,
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad: TemplateRef<any>;
  @Input() appLazyLoadDelay = 0;

  private destroy$ = new Subject<void>();
  private intersectionObserver: IntersectionObserver | null = null;
  private loaded = false;

  constructor(
    private viewContainer: ViewContainerRef,
    private elementRef: ElementRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.loaded) {
              this.ngZone.run(() => {
                setTimeout(() => {
                  this.viewContainer.createEmbeddedView(this.appLazyLoad);
                  this.loaded = true;
                }, this.appLazyLoadDelay);
              });
              this.intersectionObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      this.intersectionObserver.observe(this.elementRef.nativeElement);
    });
  }

  ngOnDestroy() {
    this.intersectionObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

/**
 * Debounced input directive
 */
@Directive({
  selector: '[appDebounceInput]',
  standalone: true,
})
export class DebounceInputDirective implements OnInit, OnDestroy {
  @Input() appDebounceInput = 300; // Default debounce time in ms
  @Input() appDebounceCallback: ((value: string) => void) | null = null;

  private input$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.input$
      .pipe(
        debounceTime(this.appDebounceInput),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.ngZone.run(() => {
          this.appDebounceCallback?.(value);
        });
      });
  }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.input$.next(target.value);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

/**
 * Virtual scroll directive for long lists
 * Renders only visible items
 */
@Directive({
  selector: '[appVirtualScroll]',
  standalone: true,
})
export class VirtualScrollDirective implements OnInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() itemHeight = 50;
  @Input() bufferSize = 5;
  @Input() templateRef: TemplateRef<any>;

  private scrollObserver: IntersectionObserver | null = null;
  private destroy$ = new Subject<void>();
  private visibleRange = { start: 0, end: 20 };

  constructor(
    private viewContainer: ViewContainerRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.render();

      const element = this.viewContainer.element.nativeElement;
      let scrollContainer = element.parentElement;

      // Find scrollable container
      while (scrollContainer && scrollContainer.scrollHeight === scrollContainer.clientHeight) {
        scrollContainer = scrollContainer.parentElement;
      }

      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', () => this.onScroll(), false);
      }
    });
  }

  private onScroll() {
    const element = this.viewContainer.element.nativeElement.parentElement;
    const scrollTop = element.scrollTop;
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = visibleStart + Math.ceil(element.clientHeight / this.itemHeight);

    const start = Math.max(0, visibleStart - this.bufferSize);
    const end = Math.min(this.items.length, visibleEnd + this.bufferSize);

    if (start !== this.visibleRange.start || end !== this.visibleRange.end) {
      this.visibleRange = { start, end };
      this.ngZone.run(() => this.render());
    }
  }

  private render() {
    this.viewContainer.clear();
    const visibleItems = this.items.slice(this.visibleRange.start, this.visibleRange.end);

    visibleItems.forEach((item, index) => {
      const context = {
        $implicit: item,
        index: this.visibleRange.start + index,
      };
      this.viewContainer.createEmbeddedView(this.templateRef, context);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

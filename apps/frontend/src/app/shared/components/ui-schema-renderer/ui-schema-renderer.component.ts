import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild, ViewContainerRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchemaRendererService, UISchema } from '../../../core/services/schema-renderer.service';
import { DynamicUIService } from '../../../core/services/dynamic-ui.service';

@Component({
  selector: 'app-ui-schema-renderer',
  templateUrl: './ui-schema-renderer.component.html',
  styleUrls: ['./ui-schema-renderer.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class UiSchemaRendererComponent implements AfterViewInit, OnChanges {
  @Input() schema: UISchema | null = null;

  @ViewChild('uiHost', { read: ViewContainerRef }) uiHost?: ViewContainerRef;

  errorMessage = '';

  private schemaRenderer = inject(SchemaRendererService);
  private dynamicUIService = inject(DynamicUIService);
  private cdr = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the view is fully ready
    setTimeout(() => {
      if (this.schema) {
        this.renderSchema();
        this.cdr.detectChanges();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema']) {
      const currentSchema = changes['schema'].currentValue;
      
      // Only render if we have a schema and the view is ready
      if (currentSchema) {
        // Use setTimeout to ensure the view is fully initialized
        setTimeout(() => {
          if (this.uiHost) {
            this.renderSchema();
            this.cdr.detectChanges();
          }
        }, 0);
      }
    }
  }

  private renderSchema(): void {
    if (!this.uiHost || !this.schema) {
      return;
    }

    this.errorMessage = '';
    const normalizedSchema = this.dynamicUIService.normalizeExternalSchema(this.schema);
    const validation = this.schemaRenderer.validateSchema(normalizedSchema);

    if (!validation.valid) {
      this.errorMessage = `Schema validation failed: ${validation.errors.join(', ')}`;
      return;
    }

    this.uiHost.clear();
    const result = this.schemaRenderer.renderSchemaTree(normalizedSchema, this.uiHost);
    if (result.error) {
      this.errorMessage = result.error;
    } else {
      // Trigger change detection after successful render
      // Use setTimeout to ensure all child components are also rendered
      setTimeout(() => {
        this.cdr.detectChanges();
        // Also trigger detectChanges on the rendered component if it exists
        if (result.component) {
          result.component.changeDetectorRef.detectChanges();
        }
      }, 0);
    }
  }
}

import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild, ViewContainerRef, inject } from '@angular/core';
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

  ngAfterViewInit(): void {
    this.renderSchema();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema']) {
      this.renderSchema();
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
    }
  }
}

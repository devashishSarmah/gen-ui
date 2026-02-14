import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManifestLoaderService } from '../manifest-loader.service';

/**
 * Validator Agent
 *
 * Validates generated UI schemas for:
 *   - Manifest/JSON-schema compliance
 *   - Prop correctness
 *   - Compact density heuristics
 *   - Interaction policy safety gate
 */
@Injectable()
export class ValidatorAgentService {
  private readonly logger = new Logger(ValidatorAgentService.name);
  private readonly lucideIconNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  private readonly emojiPattern =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/u;

  private readonly allowedActionTypes = new Set([
    'ui.patch',
    'tool.call',
    'state.update',
    'copyToClipboard',
  ]);

  private readonly forbiddenPropKeys = new Set([
    'actionurl',
    'href',
    'formaction',
    'target',
  ]);
  private readonly mediaComponentTypes = new Set(['audio-player', 'video-player']);
  private readonly mediaUrlPropKeys = new Set(['src', 'poster']);
  private readonly mediaAllowedDomains: Set<string>;
  private readonly mediaAllowAllDomains: boolean;

  private readonly knownTools: Set<string>;

  constructor(
    private manifestLoader: ManifestLoaderService,
    private configService: ConfigService,
  ) {
    const configured = String(this.configService.get('AI_ALLOWED_TOOLS') || '')
      .split(',')
      .map((tool) => tool.trim())
      .filter(Boolean);

    const configuredMediaDomains = String(
      this.configService.get('AI_MEDIA_ALLOWED_DOMAINS') || '',
    )
      .split(',')
      .map((domain) => this.normalizeDomain(domain))
      .filter(Boolean);

    this.knownTools = new Set(configured);
    this.mediaAllowAllDomains = configuredMediaDomains.includes('*');
    this.mediaAllowedDomains = new Set(
      configuredMediaDomains.filter((domain) => domain !== '*'),
    );
  }

  validate(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Extract UI tree
    const ui = schema?.ui || schema;

    // 1. Manifest-driven structural validation
    const structuralResult = this.manifestLoader.validateSchema(schema);
    if (!structuralResult.valid) {
      for (const err of structuralResult.errors) {
        errors.push({ type: 'schema', message: err, severity: 'error' });
      }
    }

    // 2. Prop type validation (deep)
    this.validateProps(ui, errors, warnings);

    // 3. Root must be a layout component
    const layoutTypes = ['container', 'flexbox', 'grid', 'card', 'tabs', 'split-layout'];
    if (ui?.type && !layoutTypes.includes(ui.type)) {
      warnings.push(
        `Root component is '${ui.type}' — should be a layout (${layoutTypes.join(', ')})`,
      );
    }

    // 4. Density check
    this.checkDensity(ui, warnings);

    // 5. Interaction policy gate
    this.checkInteractionPolicy(ui, errors, warnings);

    // 6. Icon and emoji policy gate
    this.checkIconAndEmojiPolicy(ui, errors);

    // 7. Version contract
    if (schema.manifestVersion) {
      const expected = this.manifestLoader.getManifestVersion();
      if (schema.manifestVersion !== expected) {
        warnings.push(`Manifest version '${schema.manifestVersion}' != loaded '${expected}'`);
      }
    }

    if (errors.length > 0) {
      this.logger.debug(
        `Validation failed with ${errors.length} error(s) and ${warnings.length} warning(s)`,
      );
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
    };
  }

  private validateProps(
    node: any,
    errors: ValidationError[],
    warnings: string[],
    path = 'root',
  ): void {
    if (!node || typeof node !== 'object') return;

    const manifest = this.manifestLoader.getManifest();
    if (!manifest || !node.type) return;

    const compDef = manifest.components.find((c) => c.type === node.type);
    if (!compDef) return; // Unknown type already caught by whitelist

    // Check for unknown props
    if (node.props && compDef.propsSchema) {
      const allowed = new Set(Object.keys(compDef.propsSchema));
      for (const key of Object.keys(node.props)) {
        if (!allowed.has(key)) {
          warnings.push(`${path}.props.${key}: unknown prop for '${node.type}'`);
        }
      }
    }

    // Recurse
    this.walkChildren(node, (child, childPath) => {
      this.validateProps(child, errors, warnings, childPath);
    }, path);
  }

  private checkDensity(node: any, warnings: string[], path = 'root'): void {
    if (!node || typeof node !== 'object') return;

    // Flag large sizes/paddings
    if (node.props) {
      if (node.props.size === 'large') {
        warnings.push(
          `${path}: size="large" discouraged — use "small" or "medium" for compact density`,
        );
      }
      if (typeof node.props.gap === 'number' && node.props.gap > 24) {
        warnings.push(`${path}: gap=${node.props.gap} is large — prefer ≤16 for compact density`);
      }
      if (typeof node.props.padding === 'number' && node.props.padding > 24) {
        warnings.push(
          `${path}: padding=${node.props.padding} is large — prefer ≤16 for compact density`,
        );
      }
    }

    this.walkChildren(node, (child, childPath) => {
      this.checkDensity(child, warnings, childPath);
    }, path);
  }

  private checkInteractionPolicy(
    node: any,
    errors: ValidationError[],
    warnings: string[],
    path = 'root',
  ): void {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'button' && node.props?.type === 'submit') {
      errors.push({
        type: 'policy',
        message: `${path}: button type="submit" is forbidden; use type="button"`,
        severity: 'error',
        path,
      });
    }

    if (node.props && typeof node.props === 'object') {
      for (const [rawKey, rawValue] of Object.entries(node.props)) {
        const key = rawKey.toLowerCase();

        if (this.forbiddenPropKeys.has(key)) {
          errors.push({
            type: 'policy',
            message: `${path}.props.${rawKey}: forbidden interaction/navigation prop`,
            severity: 'error',
            path: `${path}.props.${rawKey}`,
          });
          continue;
        }

        if (key === 'method' && typeof rawValue === 'string' && /^(post|get|put|delete|patch)$/i.test(rawValue.trim())) {
          errors.push({
            type: 'policy',
            message: `${path}.props.${rawKey}: HTTP submission semantics are forbidden`,
            severity: 'error',
            path: `${path}.props.${rawKey}`,
          });
          continue;
        }

        if (
          this.looksLikeUrlKey(key) &&
          typeof rawValue === 'string' &&
          this.isNavigationOrExternalUrl(rawValue)
        ) {
          if (this.isAllowedMediaPropUrl(node.type, key, rawValue)) {
            continue;
          }
          errors.push({
            type: 'policy',
            message: `${path}.props.${rawKey}: external/navigation URLs are forbidden`,
            severity: 'error',
            path: `${path}.props.${rawKey}`,
          });
          continue;
        }
      }
    }

    if (node.events && typeof node.events === 'object') {
      for (const [eventName, handler] of Object.entries(node.events)) {
        this.validateEventHandler(handler, `${path}.events.${eventName}`, errors, warnings);
      }
    }

    this.walkChildren(node, (child, childPath) => {
      this.checkInteractionPolicy(child, errors, warnings, childPath);
    }, path);
  }

  private checkIconAndEmojiPolicy(
    node: any,
    errors: ValidationError[],
    path = 'root',
  ): void {
    if (!node || typeof node !== 'object') return;

    this.scanValueForVisualPolicy(node.props, `${path}.props`, errors);
    this.scanValueForVisualPolicy(node.events, `${path}.events`, errors);

    this.walkChildren(node, (child, childPath) => {
      this.checkIconAndEmojiPolicy(child, errors, childPath);
    }, path);
  }

  private scanValueForVisualPolicy(
    value: unknown,
    path: string,
    errors: ValidationError[],
  ): void {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      if (this.emojiPattern.test(value)) {
        errors.push({
          type: 'emoji',
          message: `${path}: emojis are forbidden; use Lucide icons (kebab-case)`,
          severity: 'error',
          path,
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        this.scanValueForVisualPolicy(item, `${path}[${index}]`, errors);
      });
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      const nestedPath = `${path}.${key}`;

      if (typeof nestedValue === 'string' && this.isIconKey(key)) {
        const icon = nestedValue.trim();
        if (!this.lucideIconNamePattern.test(icon)) {
          errors.push({
            type: 'policy',
            message:
              `${nestedPath}: icon must be a Lucide icon name in kebab-case (e.g. "circle-alert")`,
            severity: 'error',
            path: nestedPath,
          });
        }
      }

      this.scanValueForVisualPolicy(nestedValue, nestedPath, errors);
    }
  }

  private isIconKey(key: string): boolean {
    const normalized = String(key || '').toLowerCase();
    return normalized === 'icon' || normalized.endsWith('icon') || normalized.includes('icon');
  }

  private validateEventHandler(
    handler: unknown,
    handlerPath: string,
    errors: ValidationError[],
    warnings: string[],
  ): void {
    if (typeof handler === 'string') {
      if (this.containsForbiddenInteractionPattern(handler)) {
        errors.push({
          type: 'policy',
          message: `${handlerPath}: forbidden interaction pattern detected`,
          severity: 'error',
          path: handlerPath,
        });
        return;
      }

      if (!this.isAllowedActionString(handler)) {
        errors.push({
          type: 'policy',
          message:
            `${handlerPath}: unknown action string. Allowed: ui.patch, tool.call, state.update, copyToClipboard`,
          severity: 'error',
          path: handlerPath,
        });
      }
      return;
    }

    if (!handler || typeof handler !== 'object') {
      errors.push({
        type: 'policy',
        message: `${handlerPath}: invalid event handler payload`,
        severity: 'error',
        path: handlerPath,
      });
      return;
    }

    const raw = handler as Record<string, any>;

    for (const [key, value] of Object.entries(raw)) {
      const lower = key.toLowerCase();

      if (
        this.forbiddenPropKeys.has(lower) ||
        (this.looksLikeUrlKey(lower) && typeof value === 'string' && this.isNavigationOrExternalUrl(value))
      ) {
        errors.push({
          type: 'policy',
          message: `${handlerPath}.${key}: forbidden navigation/url semantics`,
          severity: 'error',
          path: `${handlerPath}.${key}`,
        });
      }
    }

    const actionType = this.extractActionType(raw);
    if (!actionType) {
      errors.push({
        type: 'policy',
        message:
          `${handlerPath}: unknown event type. Use one of ui.patch, tool.call, state.update, copyToClipboard`,
        severity: 'error',
        path: handlerPath,
      });
      return;
    }

    if (!this.allowedActionTypes.has(actionType)) {
      errors.push({
        type: 'policy',
        message: `${handlerPath}: action '${actionType}' is not allowed`,
        severity: 'error',
        path: handlerPath,
      });
      return;
    }

    if (actionType === 'tool.call') {
      const toolName = this.extractToolName(raw);
      if (!toolName) {
        errors.push({
          type: 'policy',
          message: `${handlerPath}: tool.call requires a tool name`,
          severity: 'error',
          path: handlerPath,
        });
        return;
      }

      if (!this.isKnownTool(toolName)) {
        errors.push({
          type: 'policy',
          message:
            `${handlerPath}: unknown tool '${toolName}'. Configure AI_ALLOWED_TOOLS to whitelist tools`,
          severity: 'error',
          path: handlerPath,
        });
      }
    }

    if (actionType === 'copyToClipboard' && this.knownTools.size === 0) {
      warnings.push(
        `${handlerPath}: copyToClipboard accepted without tool registry; configure AI_ALLOWED_TOOLS for stricter policy`,
      );
    }
  }

  private extractActionType(handler: Record<string, any>): string | null {
    const candidates = [handler.type, handler.action, handler.kind];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return null;
  }

  private extractToolName(handler: Record<string, any>): string | null {
    const candidates = [
      handler.tool,
      handler.name,
      handler.toolName,
      handler.payload?.tool,
      handler.args?.tool,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return null;
  }

  private isKnownTool(toolName: string): boolean {
    if (this.knownTools.size === 0) {
      return false;
    }
    return this.knownTools.has(toolName);
  }

  private looksLikeUrlKey(key: string): boolean {
    return (
      key.includes('url') ||
      key.includes('href') ||
      key.includes('link') ||
      key.includes('endpoint') ||
      key.includes('action') ||
      key === 'src' ||
      key === 'poster'
    );
  }

  private isAllowedMediaPropUrl(
    componentType: unknown,
    key: string,
    value: string,
  ): boolean {
    const normalizedType = String(componentType || '').toLowerCase();
    if (!this.mediaComponentTypes.has(normalizedType)) {
      return false;
    }

    const normalizedKey = String(key || '').toLowerCase();
    if (!this.mediaUrlPropKeys.has(normalizedKey)) {
      return false;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }

    const lower = trimmed.toLowerCase();
    if (lower.startsWith('mailto:') || lower.startsWith('tel:') || lower.startsWith('//')) {
      return false;
    }

    if (trimmed.startsWith('/')) {
      return true;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return false;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    if (this.mediaAllowAllDomains) {
      return true;
    }

    if (this.mediaAllowedDomains.size === 0) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    for (const domain of this.mediaAllowedDomains) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return true;
      }
    }
    return false;
  }

  private normalizeDomain(rawDomain: string): string {
    const trimmed = String(rawDomain || '').trim().toLowerCase();
    if (!trimmed) return '';
    if (trimmed === '*') return '*';

    const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
    const withoutWildcard = withoutProtocol.startsWith('*.')
      ? withoutProtocol.slice(2)
      : withoutProtocol;
    return withoutWildcard.split('/')[0];
  }

  private isNavigationOrExternalUrl(value: string): boolean {
    const lower = value.trim().toLowerCase();
    return (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('//') ||
      lower.startsWith('mailto:') ||
      lower.startsWith('tel:') ||
      lower.startsWith('/') ||
      lower.includes('window.location')
    );
  }

  private containsForbiddenInteractionPattern(value: string): boolean {
    const lower = value.toLowerCase();
    return (
      lower.includes('window.location') ||
      lower.includes('form[action]') ||
      /\bsubmit\b/.test(lower) ||
      /\bpost\b/.test(lower) ||
      lower.includes('http://') ||
      lower.includes('https://') ||
      lower.includes('fetch(') ||
      lower.includes('axios.') ||
      lower.includes('xmlhttprequest')
    );
  }

  private isAllowedActionString(value: string): boolean {
    const normalized = value.trim();

    if (!normalized) {
      return false;
    }

    if ([...this.allowedActionTypes].some((prefix) => normalized.startsWith(prefix))) {
      return true;
    }

    // Backward-compatible allowlist from manifest interaction names.
    const legacyAllowed =
      this.manifestLoader.getManifest()?.interactionSafety?.allowedInteractions || [];

    return legacyAllowed.includes(normalized);
  }

  private walkChildren(
    node: any,
    walker: (child: any, path: string) => void,
    path: string,
  ): void {
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, i: number) => {
        walker(child, `${path}.children[${i}]`);
      });
    }

    if (Array.isArray(node.components)) {
      node.components.forEach((child: any, i: number) => {
        walker(child, `${path}.components[${i}]`);
      });
    }
  }
}

export interface ValidationError {
  type: 'schema' | 'emoji' | 'safety' | 'whitelist' | 'density' | 'policy';
  message: string;
  severity: 'error' | 'warning';
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

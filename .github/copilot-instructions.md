# Repo Instructions

Use repository-wide defaults. For Angular-specific guidance, refer to:
apps/frontend/.github/copilot-instructions.md

## Design System (`libs/design-system`)

All shared UI components live in `libs/design-system/src/lib/components/`.
The canonical metadata for every component is the `COMPONENT_LIBRARY` array in
`libs/design-system/src/lib/component-library.ts`. It records name, category,
description, Angular class, and `propsSchema`.

### Component Showcase & Documentation

A self-maintaining **Showcase** page is built into the design-system library at
`libs/design-system/src/lib/showcase/`. It is auto-generated from
`COMPONENT_LIBRARY` metadata, so docs stay in sync with the code.

In the frontend app it is available at the `/showcase` route (lazy-loaded).

**Rules to follow when modifying UI components:**

1. When you **add, rename, or remove** a component in the design-system:
   - Update `COMPONENT_LIBRARY` in `component-library.ts` with the new entry.
   - If the component needs richer demo data, add an override in
     `libs/design-system/src/lib/showcase/sample-data.ts` → `SAMPLE_OVERRIDES`.
   - Ensure the component is re-exported from
     `libs/design-system/src/lib/components/index.ts`.
   - Add a per-component entry point in `libs/design-system/package.json`
     (`"exports"`) and a matching path in `tsconfig.base.json` → `"paths"`.

2. When you **change a component's props** (add/remove/rename an `@Input`):
   - Update the matching `propsSchema` entry in `COMPONENT_LIBRARY`.
   - If the component has a `SAMPLE_OVERRIDES` entry, update it too.

3. The showcase page must always render cleanly. After component changes,
   verify `COMPONENT_LIBRARY` still compiles and the Showcase route loads.

4. The backend prompt files (`apps/backend/src/ai/prompts/ui-schema.md` and
   `renderer-schema.json`) must be kept in sync with the design-system library.
   When a component is added or its props change, update both prompts.

import { Type } from '@angular/core';
import { COMPONENT_METADATA, ComponentMetadata } from './component-metadata';
import { InputComponent } from './components/form/input.component';
import { SelectComponent } from './components/form/select.component';
import { CheckboxComponent } from './components/form/checkbox.component';
import { RadioComponent } from './components/form/radio.component';
import { TextareaComponent } from './components/form/textarea.component';
import { ButtonComponent } from './components/form/button.component';
import { ContainerComponent } from './components/layout/container.component';
import { GridComponent } from './components/layout/grid.component';
import { CardComponent } from './components/layout/card.component';
import { TabsComponent } from './components/layout/tabs.component';
import { FlexboxComponent } from './components/layout/flexbox.component';
import { SplitLayoutComponent } from './components/layout/split-layout.component';
import { AccordionComponent } from './components/layout/accordion.component';
import { TableComponent } from './components/data-display/table.component';
import { ListComponent } from './components/data-display/list.component';
import { ListboxComponent } from './components/data-display/listbox.component';
import { BasicChartComponent } from './components/data-display/basic-chart.component';
import { TimelineComponent } from './components/data-display/timeline.component';
import { CarouselComponent } from './components/data-display/carousel.component';
import { AudioPlayerComponent } from './components/data-display/audio-player.component';
import { VideoPlayerComponent } from './components/data-display/video-player.component';
import { StatsCardComponent } from './components/data-display/stats-card.component';
import { FlowDiagramComponent } from './components/data-display/flow-diagram.component';
import { ChartBarComponent } from './components/data-display/chart-bar.component';
import { ProgressRingComponent } from './components/data-display/progress-ring.component';
import { WizardStepperComponent } from './components/navigation/wizard-stepper.component';
import { StepperComponent } from './components/navigation/stepper.component';
import { BadgeComponent } from './components/feedback/badge.component';
import { AlertComponent } from './components/feedback/alert.component';
import { ProgressBarComponent } from './components/feedback/progress-bar.component';
import { MenuComponent } from './components/navigation/menu.component';
import { ToolbarComponent } from './components/navigation/toolbar.component';
import { ErrorComponent } from './components/error/error.component';
import { HeadingComponent } from './components/typography/heading.component';
import { ParagraphComponent } from './components/typography/paragraph.component';
import { DividerComponent } from './components/typography/divider.component';

export { ComponentMetadata } from './component-metadata';

export interface ComponentLibrary extends ComponentMetadata {
  component: Type<any>;
}

/**
 * Map from component name → Angular class.
 * Order doesn't matter — only used for lookup during COMPONENT_LIBRARY build.
 */
const COMPONENT_MAP: Record<string, Type<any>> = {
  input: InputComponent,
  select: SelectComponent,
  checkbox: CheckboxComponent,
  radio: RadioComponent,
  textarea: TextareaComponent,
  button: ButtonComponent,
  container: ContainerComponent,
  grid: GridComponent,
  card: CardComponent,
  tabs: TabsComponent,
  accordion: AccordionComponent,
  flexbox: FlexboxComponent,
  'split-layout': SplitLayoutComponent,
  table: TableComponent,
  list: ListComponent,
  listbox: ListboxComponent,
  heading: HeadingComponent,
  paragraph: ParagraphComponent,
  divider: DividerComponent,
  'basic-chart': BasicChartComponent,
  'wizard-stepper': WizardStepperComponent,
  menu: MenuComponent,
  toolbar: ToolbarComponent,
  error: ErrorComponent,
  timeline: TimelineComponent,
  carousel: CarouselComponent,
  'audio-player': AudioPlayerComponent,
  'video-player': VideoPlayerComponent,
  'stats-card': StatsCardComponent,
  'progress-ring': ProgressRingComponent,
  'flow-diagram': FlowDiagramComponent,
  'chart-bar': ChartBarComponent,
  badge: BadgeComponent,
  alert: AlertComponent,
  'progress-bar': ProgressBarComponent,
  stepper: StepperComponent,
};

/**
 * Full component library: metadata + Angular component class.
 * The single source of truth for metadata lives in `component-metadata.ts`.
 */
export const COMPONENT_LIBRARY: ComponentLibrary[] = COMPONENT_METADATA.map(
  (meta) => ({
    ...meta,
    component: COMPONENT_MAP[meta.name],
  }),
);

export function getComponentLibrary(): ComponentLibrary[] {
  return COMPONENT_LIBRARY;
}

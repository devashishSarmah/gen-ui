import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-basic-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-wrapper">
      <h3 *ngIf="title" class="chart-title">{{ title }}</h3>
      <div class="chart-container">
        <canvas
          #canvas
          [attr.width]="width"
          [attr.height]="height"
          class="chart-canvas"
        ></canvas>
      </div>
    </div>
  `,
  styles: [
    `
      .chart-wrapper {
        width: 100%;
      }

      .chart-title {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .chart-container {
        display: flex;
        justify-content: center;
        align-items: center;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 1rem;
      }

      .chart-canvas {
        max-width: 100%;
        height: auto;
      }
    `,
  ],
})
export class BasicChartComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() data: ChartDataPoint[] = [];
  @Input() title = '';
  @Input() type: 'bar' | 'line' | 'pie' = 'bar';
  @Input() width = 400;
  @Input() height = 300;

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.canvasRef &&
      (changes['data'] || changes['type'] || changes['width'] || changes['height'])
    ) {
      this.drawChart();
    }
  }

  private drawChart() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.data?.length) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (this.type) {
      case 'bar':
        this.drawBarChart(ctx, canvas);
        break;
      case 'line':
        this.drawLineChart(ctx, canvas);
        break;
      case 'pie':
        this.drawPieChart(ctx, canvas);
        break;
    }
  }

  private drawBarChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...this.data.map((d) => d.value));
    const barWidth = chartWidth / this.data.length / 1.5;
    const spacing = chartWidth / this.data.length;

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // Draw bars
    ctx.fillStyle = '#2196f3';
    this.data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + index * spacing + (spacing - barWidth) / 2;
      const y = canvas.height - padding - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, canvas.height - padding + 20);
    });
  }

  private drawLineChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...this.data.map((d) => d.value));
    const step = chartWidth / (this.data.length - 1 || 1);

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // Draw line
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.beginPath();

    this.data.forEach((item, index) => {
      const x = padding + index * step;
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#2196f3';
    this.data.forEach((item, index) => {
      const x = padding + index * step;
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawPieChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;

    const total = this.data.reduce((sum, d) => sum + d.value, 0);
    const colors = ['#2196f3', '#ff9800', '#4caf50', '#f44336', '#9c27b0'];

    let currentAngle = -Math.PI / 2;

    this.data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * Math.PI * 2;

      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${((item.value / total) * 100).toFixed(0)}%`,
        labelX,
        labelY
      );

      currentAngle += sliceAngle;
    });
  }
}

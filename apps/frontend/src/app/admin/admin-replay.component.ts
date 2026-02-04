import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ReplayFrame {
  sequenceNumber: number;
  timestamp: Date;
  eventType: string;
  eventData: any;
  state: any;
}

@Component({
  selector: 'app-admin-replay',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-replay-container">
      <div class="replay-header">
        <h1>Admin Replay Interface</h1>
        <p class="subtitle">Review conversation state at any point in time</p>
      </div>

      <ng-container *ngIf="conversationId && !sessionActive">
        <button (click)="startReplay()" class="btn-primary">Start Replay Session</button>
      </ng-container>

      <ng-container *ngIf="sessionActive">
        <div class="replay-controls">
          <div class="frame-navigation">
            <button (click)="previousFrame()" [disabled]="currentFrameIndex === 0" class="btn-secondary">
              ← Previous
            </button>
            <div class="frame-info">
              <span class="current-frame">Frame {{ currentFrameIndex + 1 }} of {{ totalFrames }}</span>
              <input
                type="range"
                min="0"
                [max]="totalFrames - 1"
                [(ngModel)]="currentFrameIndex"
                (change)="jumpToFrame()"
                class="frame-slider"
              />
            </div>
            <button (click)="nextFrame()" [disabled]="currentFrameIndex >= totalFrames - 1" class="btn-secondary">
              Next →
            </button>
          </div>

          <div class="replay-actions">
            <button (click)="exportAuditTrail()" class="btn-primary">Export Audit Trail</button>
            <button (click)="viewSnapshots()" class="btn-secondary">View Snapshots</button>
            <button (click)="endReplay()" class="btn-danger">End Session</button>
          </div>
        </div>

        <div class="replay-content" *ngIf="currentFrame">
          <div class="frame-display">
            <div class="event-details">
              <h3>Event: {{ currentFrame.eventType }}</h3>
              <div class="timestamp">{{ currentFrame.timestamp | date: 'medium' }}</div>
              
              <div class="event-data">
                <h4>Event Data:</h4>
                <pre>{{ currentFrame.eventData | json }}</pre>
              </div>
            </div>

            <div class="state-display">
              <h3>UI State at this point</h3>
              <div class="ui-schema" *ngIf="currentFrame.state.currentUiSchema">
                <h4>Current UI Schema:</h4>
                <pre>{{ currentFrame.state.currentUiSchema | json }}</pre>
              </div>
              <div class="ui-state">
                <h4>UI State Values:</h4>
                <pre>{{ currentFrame.state.uiState | json }}</pre>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="showSnapshots">
        <div class="modal-overlay" (click)="showSnapshots = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Available Snapshots</h3>
            <div class="snapshots-list">
              <div *ngFor="let snapshot of snapshots" class="snapshot-item">
                <span>Sequence #{{ snapshot.eventSequenceNumber }}</span>
                <span class="timestamp">{{ snapshot.createdAt | date: 'medium' }}</span>
              </div>
            </div>
            <button (click)="showSnapshots = false" class="btn-secondary">Close</button>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="loading">
        <div class="loading-spinner">Loading replay data...</div>
      </ng-container>

      <ng-container *ngIf="error">
        <div class="error-message">{{ error }}</div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .admin-replay-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .replay-header {
        margin-bottom: 2rem;

        h1 {
          margin: 0;
          font-size: 2rem;
          color: #1976d2;
        }

        .subtitle {
          margin: 0.5rem 0 0;
          color: #666;
        }
      }

      .replay-controls {
        background: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 2rem;
      }

      .frame-navigation {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .frame-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;

        .current-frame {
          font-weight: 600;
          min-width: 150px;
        }

        .frame-slider {
          flex: 1;
        }
      }

      .replay-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-start;
      }

      .btn-primary {
        padding: 0.75rem 1.5rem;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;

        &:hover:not(:disabled) {
          background: #1565c0;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-secondary {
        padding: 0.75rem 1.5rem;
        background: white;
        color: #333;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;

        &:hover:not(:disabled) {
          background: #f5f5f5;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-danger {
        padding: 0.75rem 1.5rem;
        background: #c62828;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;

        &:hover {
          background: #b71c1c;
        }
      }

      .replay-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }

      .frame-display {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .event-details,
      .state-display {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        h3 {
          margin: 0 0 1rem;
          font-size: 1.25rem;
          color: #333;
        }

        h4 {
          margin: 1rem 0 0.5rem;
          color: #666;
          font-size: 0.95rem;
        }

        .timestamp {
          font-size: 0.9rem;
          color: #999;
          margin-bottom: 1rem;
        }

        pre {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.85rem;
          margin: 0;
        }
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        min-width: 400px;
        max-height: 80vh;
        overflow-y: auto;

        h3 {
          margin: 0 0 1.5rem;
        }

        .snapshots-list {
          margin-bottom: 1.5rem;
          max-height: 400px;
          overflow-y: auto;

          .snapshot-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border-bottom: 1px solid #e0e0e0;
            font-size: 0.9rem;

            .timestamp {
              color: #999;
            }
          }
        }
      }

      .loading-spinner {
        text-align: center;
        padding: 2rem;
        font-size: 1.1rem;
        color: #666;
      }

      .error-message {
        background: #ffebee;
        color: #c62828;
        padding: 1rem;
        border-radius: 4px;
        margin-top: 1rem;
      }

      @media (max-width: 1200px) {
        .replay-content {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminReplayComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  conversationId: string | null = null;
  sessionActive = false;
  currentFrameIndex = 0;
  totalFrames = 0;
  currentFrame: ReplayFrame | null = null;
  snapshots: any[] = [];
  showSnapshots = false;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.conversationId = params['conversationId'];
    });
  }

  ngOnDestroy(): void {
    if (this.sessionActive && this.conversationId) {
      this.endReplay();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  async startReplay(): Promise<void> {
    if (!this.conversationId) return;

    this.loading = true;
    this.error = null;

    try {
      const response = await this.http
        .post<any>(`/api/admin/replay/conversations/${this.conversationId}/start`, {})
        .toPromise();

      if (response?.success) {
        this.sessionActive = true;
        this.totalFrames = response.data.totalFrames;
        this.currentFrame = response.data.currentFrame;
        this.currentFrameIndex = 0;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to start replay session';
    } finally {
      this.loading = false;
    }
  }

  async nextFrame(): Promise<void> {
    if (!this.conversationId || this.currentFrameIndex >= this.totalFrames - 1) return;

    this.loading = true;
    try {
      const response = await this.http
        .post<any>(`/api/admin/replay/conversations/${this.conversationId}/next`, {})
        .toPromise();

      if (response?.success) {
        this.currentFrame = response.data;
        this.currentFrameIndex += 1;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to navigate to next frame';
    } finally {
      this.loading = false;
    }
  }

  async previousFrame(): Promise<void> {
    if (!this.conversationId || this.currentFrameIndex === 0) return;

    this.loading = true;
    try {
      const response = await this.http
        .post<any>(`/api/admin/replay/conversations/${this.conversationId}/previous`, {})
        .toPromise();

      if (response?.success) {
        this.currentFrame = response.data;
        this.currentFrameIndex -= 1;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to navigate to previous frame';
    } finally {
      this.loading = false;
    }
  }

  async jumpToFrame(): Promise<void> {
    if (!this.conversationId) return;

    this.loading = true;
    try {
      const response = await this.http
        .post<any>(
          `/api/admin/replay/conversations/${this.conversationId}/jump-to?frameIndex=${this.currentFrameIndex}`,
          {}
        )
        .toPromise();

      if (response?.success) {
        this.currentFrame = response.data;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to jump to frame';
    } finally {
      this.loading = false;
    }
  }

  async viewSnapshots(): Promise<void> {
    if (!this.conversationId) return;

    try {
      const response = await this.http
        .get<any>(`/api/admin/replay/conversations/${this.conversationId}/snapshots`)
        .toPromise();

      if (response?.success) {
        this.snapshots = response.data.snapshots;
        this.showSnapshots = true;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to load snapshots';
    }
  }

  async exportAuditTrail(): Promise<void> {
    if (!this.conversationId) return;

    try {
      const response = await this.http
        .get<any>(`/api/admin/replay/conversations/${this.conversationId}/export-audit-trail`)
        .toPromise();

      if (response?.success) {
        // Download as JSON file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-trail-${this.conversationId}-${new Date().getTime()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to export audit trail';
    }
  }

  async endReplay(): Promise<void> {
    if (!this.conversationId) return;

    try {
      await this.http
        .post<any>(`/api/admin/replay/conversations/${this.conversationId}/end`, {})
        .toPromise();

      this.sessionActive = false;
      this.currentFrame = null;
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to end replay session';
    }
  }
}

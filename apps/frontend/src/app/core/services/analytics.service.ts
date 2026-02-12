import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AnalyticsEventPayload {
  eventName: string;
  category: 'auth' | 'conversation' | 'navigation' | 'engagement';
  properties?: Record<string, any>;
  sessionId?: string;
  pageUrl?: string;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private sessionId = this.generateSessionId();

  /** Track an event to both backend DB and Google Analytics */
  track(
    eventName: string,
    category: AnalyticsEventPayload['category'],
    properties?: Record<string, any>,
  ): void {
    const payload: AnalyticsEventPayload = {
      eventName,
      category,
      properties,
      sessionId: this.sessionId,
      pageUrl: window.location.pathname,
    };

    // Send to backend
    this.http
      .post(`${this.apiUrl}/analytics/track`, payload)
      .subscribe({ error: (err) => console.debug('Analytics track error:', err) });

    // Send to Google Analytics (if loaded)
    this.trackGA(eventName, category, properties);
  }

  /** Auth events */
  trackLogin(provider: string): void {
    this.track('login', 'auth', { provider });
  }

  trackRegister(provider: string): void {
    this.track('register', 'auth', { provider });
  }

  trackLogout(): void {
    this.track('logout', 'auth');
  }

  /** Conversation events */
  trackConversationCreated(conversationId: string): void {
    this.track('conversation_created', 'conversation', { conversationId });
  }

  trackMessageSent(conversationId: string): void {
    this.track('message_sent', 'conversation', { conversationId });
  }

  /** Navigation events */
  trackPageView(page: string): void {
    this.track('page_view', 'navigation', { page });

    // GA page view
    if (window.gtag) {
      window.gtag('config', environment.gaMeasurementId || '', {
        page_path: page,
      });
    }
  }

  /** Engagement events */
  trackFeatureUsed(feature: string, details?: Record<string, any>): void {
    this.track('feature_used', 'engagement', { feature, ...details });
  }

  /** Fetch stats (for admin dashboard) */
  getStats(days = 30) {
    return this.http.get(`${this.apiUrl}/analytics/stats`, {
      params: { days: days.toString() },
    });
  }

  getUserEvents(limit = 50) {
    return this.http.get(`${this.apiUrl}/analytics/user-events`, {
      params: { limit: limit.toString() },
    });
  }

  private trackGA(
    eventName: string,
    category: string,
    properties?: Record<string, any>,
  ): void {
    if (!window.gtag) return;
    window.gtag('event', eventName, {
      event_category: category,
      ...properties,
    });
  }

  private generateSessionId(): string {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', id);
    return id;
  }
}

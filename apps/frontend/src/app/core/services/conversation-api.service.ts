import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConversationDto, MessageDto } from '@gen-ui/shared';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConversationApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl || '/api';

  /**
   * Get all user conversations
   */
  getConversations(): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(`${this.apiUrl}/conversations`);
  }

  /**
   * Search conversations by title
   */
  searchConversations(query: string): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(`${this.apiUrl}/conversations`, {
      params: { search: query },
    });
  }

  /**
   * Get a single conversation
   */
  getConversation(id: string): Observable<ConversationDto> {
    return this.http.get<ConversationDto>(`${this.apiUrl}/conversations/${id}`);
  }

  /**
   * Create a new conversation
   */
  createConversation(title?: string): Observable<ConversationDto> {
    return this.http.post<ConversationDto>(`${this.apiUrl}/conversations`, {
      title: title || 'New Conversation',
    });
  }

  /**
   * Update conversation
   */
  updateConversation(id: string, updates: Partial<ConversationDto>): Observable<ConversationDto> {
    return this.http.put<ConversationDto>(`${this.apiUrl}/conversations/${id}`, updates);
  }

  /**
   * Delete conversation
   */
  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversations/${id}`);
  }

  /**
   * Get conversation messages
   */
  getMessages(conversationId: string): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    );
  }

  /**
   * Get a single message
   * @deprecated Backend endpoint not implemented
   */
  getMessage(conversationId: string, messageId: string): Observable<MessageDto> {
    throw new Error('getMessage is not implemented on the backend');
  }

  /**
   * Send a message (user prompt)
   * @deprecated Backend endpoint not implemented. Use WebSocket communication instead
   */
  sendMessage(conversationId: string, content: string): Observable<MessageDto> {
    throw new Error('sendMessage is not implemented on the backend. Use WebSocket communication instead');
  }
}

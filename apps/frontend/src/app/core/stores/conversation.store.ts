import { Injectable, signal, computed } from '@angular/core';
import { ConversationDto, MessageDto } from '@gen-ui/shared';

// Type aliases for local usage
export type Conversation = ConversationDto;
export type Message = MessageDto;

@Injectable({
  providedIn: 'root',
})
export class ConversationStore {
  // Signals
  readonly conversations = signal<Conversation[]>([]);
  readonly currentConversationId = signal<string | null>(null);
  readonly currentConversation = computed(() => {
    const id = this.currentConversationId();
    if (!id) return null;
    return this.conversations().find((c) => c.id === id) || null;
  });

  readonly messages = signal<Message[]>([]);
  readonly isLoadingConversations = signal(false);
  readonly isLoadingMessages = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Set conversations list
   */
  setConversations(conversations: Conversation[]): void {
    this.conversations.set(conversations);
  }

  /**
   * Set current conversation
   */
  setCurrentConversation(conversationId: string): void {
    this.currentConversationId.set(conversationId);
    this.messages.set([]);
  }

  /**
   * Set messages for current conversation
   */
  setMessages(messages: Message[]): void {
    this.messages.set(messages);
  }

  /**
   * Add message to current conversation
   */
  addMessage(message: Message): void {
    this.messages.update((msgs) => [...msgs, message]);
  }

  /**
   * Update message
   */
  updateMessage(messageId: string, updates: Partial<Message>): void {
    this.messages.update((msgs) =>
      msgs.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
    );
  }

  /**
   * Clear current conversation
   */
  clearCurrentConversation(): void {
    this.currentConversationId.set(null);
    this.messages.set([]);
  }

  /**
   * Set loading state
   */
  setIsLoadingConversations(loading: boolean): void {
    this.isLoadingConversations.set(loading);
  }

  /**
   * Set loading messages state
   */
  setIsLoadingMessages(loading: boolean): void {
    this.isLoadingMessages.set(loading);
  }

  /**
   * Set error
   */
  setError(error: string | null): void {
    this.error.set(error);
  }

  /**
   * Update a conversation in the list
   */
  updateConversation(id: string, updates: Partial<Conversation>): void {
    this.conversations.update((convs) =>
      convs.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  /**
   * Remove a conversation from the list
   */
  removeConversation(id: string): void {
    this.conversations.update((convs) => convs.filter((c) => c.id !== id));
  }
}

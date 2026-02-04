import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message } from '../entities';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>
  ) {}

  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      userId,
      title: title || 'New Conversation',
      lastMessageAt: new Date(),
    });

    return await this.conversationRepository.save(conversation);
  }

  async findUserConversations(userId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { userId },
      order: { lastMessageAt: 'DESC' },
    });
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    return await this.conversationRepository.findOne({
      where: { id },
    });
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    await this.conversationRepository.update(id, updates);
    return await this.findConversationById(id);
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content?: string,
    uiSchema?: any
  ): Promise<Message> {
    const message = this.messageRepository.create({
      conversationId,
      role,
      content,
      uiSchema,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation's last message timestamp
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    return savedMessage;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }
}

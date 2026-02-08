import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Conversation, Message, MessageRole } from '../entities';

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
    const updated = await this.findConversationById(id);
    if (!updated) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }
    return updated;
  }

  async addMessage(
    conversationId: string,
    role: MessageRole,
    content?: string | null,
    uiSchema?: any
  ): Promise<Message> {
    const message = this.messageRepository.create({
      conversationId,
      role,
      content,
      uiSchema,
    }) as Message;

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

  async deleteConversation(id: string): Promise<void> {
    const result = await this.conversationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }
  }

  async searchConversations(userId: string, searchTerm: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: {
        userId,
        title: ILike(`%${searchTerm}%`),
      },
      order: { lastMessageAt: 'DESC' },
    });
  }

  async generateTitle(conversationId: string, firstPrompt: string): Promise<Conversation> {
    // Generate a title from the first prompt (truncate to 50 chars)
    const generatedTitle = firstPrompt.length > 50 
      ? firstPrompt.substring(0, 47) + '...' 
      : firstPrompt;
    
    return await this.updateConversation(conversationId, { title: generatedTitle });
  }
}

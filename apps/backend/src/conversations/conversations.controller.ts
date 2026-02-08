import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { Conversation } from '../entities';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private conversationsService: ConversationsService,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>
  ) {}

  @Post()
  async createConversation(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { title?: string }
  ) {
    return this.conversationsService.createConversation(req.user.id, body.title);
  }

  @Get(':id')
  async getConversation(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const conversation = await this.conversationsService.findConversationById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }
    if (conversation.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
    return conversation;
  }

  @Get(':id/messages')
  async getConversationMessages(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const conversation = await this.conversationsService.findConversationById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }
    if (conversation.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
    return this.conversationsService.getConversationMessages(id);
  }

  @Put(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body() body: { title?: string },
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const conversation = await this.conversationsService.findConversationById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }
    if (conversation.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
    return this.conversationsService.updateConversation(id, body);
  }

  @Delete(':id')
  async deleteConversation(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }
    if (conversation.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
    return this.conversationsService.deleteConversation(id);
  }

  @Get()
  async getUserConversationsWithSearch(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Query('search') search?: string
  ) {
    if (search) {
      return this.conversationsService.searchConversations(req.user.id, search);
    }
    return this.conversationsService.findUserConversations(req.user.id);
  }
}

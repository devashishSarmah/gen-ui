import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Post()
  async createConversation(@Request() req, @Body() body: { title?: string }) {
    return this.conversationsService.createConversation(req.user.id, body.title);
  }

  @Get()
  async getUserConversations(@Request() req) {
    return this.conversationsService.findUserConversations(req.user.id);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    return this.conversationsService.findConversationById(id);
  }

  @Get(':id/messages')
  async getConversationMessages(@Param('id') id: string) {
    return this.conversationsService.getConversationMessages(id);
  }
}

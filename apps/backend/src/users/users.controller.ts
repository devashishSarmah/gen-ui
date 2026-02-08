import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: ExpressRequest & { user: { id: string } }) {
    const user = await this.usersService.findById(req.user.id);
    
    if (user) {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() updateData: { email?: string }
  ) {
    const user = await this.usersService.update(req.user.id, updateData);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

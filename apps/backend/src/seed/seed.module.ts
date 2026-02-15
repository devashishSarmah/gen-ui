import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Conversation, Message } from '../entities';
import { SeederService } from './seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Conversation, Message])],
  providers: [SeederService],
})
export class SeedModule {}

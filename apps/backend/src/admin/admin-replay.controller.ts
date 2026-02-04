import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReplayService } from '../state/replay.service';
import { StateManagerService } from '../state/state-manager.service';

@Controller('admin/replay')
@UseGuards(JwtAuthGuard)
export class AdminReplayController {
  constructor(
    private replayService: ReplayService,
    private stateManagerService: StateManagerService
  ) {}

  /**
   * Start a replay session for a conversation
   * Admin endpoint - requires admin role (added via middleware in future)
   */
  @Post('conversations/:conversationId/start')
  async startReplay(
    @Param('conversationId') conversationId: string,
    @Request() req: any
  ) {
    // TODO: Add admin role check here
    // if (!req.user.isAdmin) throw new ForbiddenException('Admin access required');

    try {
      const session = await this.replayService.startReplaySession(conversationId, req.user.id);
      const firstFrame = session.frames[0];
      return {
        success: true,
        data: {
          conversationId: session.conversationId,
          totalFrames: session.totalFrames,
          currentFrame: firstFrame ? {
            sequenceNumber: firstFrame.sequenceNumber,
            timestamp: firstFrame.timestamp,
            eventType: firstFrame.event.eventType,
            eventData: firstFrame.event.eventData,
            state: firstFrame.state,
          } : null,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get current replay session info
   */
  @Get('conversations/:conversationId/session')
  async getSessionInfo(@Param('conversationId') conversationId: string) {
    try {
      const sessionInfo = await this.replayService.getReplaySessionInfo(conversationId);
      return {
        success: true,
        data: {
          conversationId: sessionInfo.conversationId,
          currentFrameIndex: sessionInfo.currentFrameIndex,
          totalFrames: sessionInfo.totalFrames,
        },
      };
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  /**
   * Get a specific replay frame
   */
  @Get('conversations/:conversationId/frame/:frameIndex')
  async getFrame(
    @Param('conversationId') conversationId: string,
    @Param('frameIndex') frameIndex: number
  ) {
    try {
      const frame = await this.replayService.getReplayFrame(conversationId, Number(frameIndex));
      return {
        success: true,
        data: {
          sequenceNumber: frame.sequenceNumber,
          timestamp: frame.timestamp,
          eventType: frame.event.eventType,
          eventData: frame.event.eventData,
          state: frame.state,
        },
      };
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  /**
   * Navigate to next frame
   */
  @Post('conversations/:conversationId/next')
  async nextFrame(@Param('conversationId') conversationId: string) {
    try {
      const frame = await this.replayService.nextFrame(conversationId);
      return {
        success: true,
        data: {
          sequenceNumber: frame.sequenceNumber,
          timestamp: frame.timestamp,
          eventType: frame.event.eventType,
          eventData: frame.event.eventData,
          state: frame.state,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Navigate to previous frame
   */
  @Post('conversations/:conversationId/previous')
  async previousFrame(@Param('conversationId') conversationId: string) {
    try {
      const frame = await this.replayService.previousFrame(conversationId);
      return {
        success: true,
        data: {
          sequenceNumber: frame.sequenceNumber,
          timestamp: frame.timestamp,
          eventType: frame.event.eventType,
          eventData: frame.event.eventData,
          state: frame.state,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Jump to specific frame
   */
  @Post('conversations/:conversationId/jump-to')
  async jumpToFrame(
    @Param('conversationId') conversationId: string,
    @Query('frameIndex') frameIndex: number
  ) {
    try {
      const frame = await this.replayService.jumpToFrame(conversationId, Number(frameIndex));
      return {
        success: true,
        data: {
          sequenceNumber: frame.sequenceNumber,
          timestamp: frame.timestamp,
          eventType: frame.event.eventType,
          eventData: frame.event.eventData,
          state: frame.state,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Export audit trail as JSON
   */
  @Get('conversations/:conversationId/export-audit-trail')
  async exportAuditTrail(@Param('conversationId') conversationId: string) {
    try {
      const auditTrail = await this.replayService.getAuditTrailForExport(conversationId);
      return {
        success: true,
        data: auditTrail,
      };
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  /**
   * Get snapshots for a conversation
   */
  @Get('conversations/:conversationId/snapshots')
  async getSnapshots(@Param('conversationId') conversationId: string) {
    try {
      const snapshots = await this.stateManagerService.getConversationSnapshots(conversationId);
      return {
        success: true,
        data: {
          conversationId,
          totalSnapshots: snapshots.length,
          snapshots: snapshots.map((s) => ({
            id: s.id,
            eventSequenceNumber: s.eventSequenceNumber,
            createdAt: s.createdAt.toISOString(),
          })),
        },
      };
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  /**
   * Get events for a conversation
   */
  @Get('conversations/:conversationId/events')
  async getEvents(@Param('conversationId') conversationId: string) {
    try {
      const events = await this.stateManagerService.getConversationAuditTrail(conversationId);
      return {
        success: true,
        data: {
          conversationId,
          totalEvents: events.length,
          events: events.map((e) => ({
            id: e.id,
            messageId: e.messageId,
            eventType: e.eventType,
            createdAt: e.createdAt.toISOString(),
          })),
        },
      };
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  /**
   * End replay session
   */
  @Post('conversations/:conversationId/end')
  async endReplay(@Param('conversationId') conversationId: string) {
    try {
      await this.replayService.endReplaySession(conversationId);
      return {
        success: true,
        message: 'Replay session ended',
      };
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }
}

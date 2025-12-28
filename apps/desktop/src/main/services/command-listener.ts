import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { LFGService } from './lfg-service';

/**
 * Commands that can be sent from web to desktop
 */
export type DesktopCommand =
  | { type: 'join-party'; code: string }
  | { type: 'generate-code' }
  | { type: 'invite-player'; gameName: string; tagLine: string }
  | { type: 'leave-party' };

/**
 * Command result sent back to web
 */
export interface CommandResult {
  type: string;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * CommandListener - Listens for commands from web via Supabase Broadcast
 * Allows web app to trigger actions on desktop (like joining party)
 */
export class CommandListener {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private lfgService: LFGService;
  private userId: string | null = null;
  private isListening = false;

  constructor(lfgService: LFGService) {
    this.lfgService = lfgService;
  }

  /**
   * Start listening for commands
   */
  async start(
    supabaseUrl: string,
    supabaseAnonKey: string,
    accessToken: string,
    userId: string
  ): Promise<void> {
    if (this.isListening) {
      console.log('[CommandListener] Already listening');
      return;
    }

    // Create client with anon key and set access token in headers for auth
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });

    this.userId = userId;

    // Subscribe to user-specific command channel
    const channelName = `desktop-commands:${userId}`;
    this.channel = this.supabase.channel(channelName);

    this.channel
      .on('broadcast', { event: 'command' }, async (payload) => {
        await this.handleCommand(payload.payload as DesktopCommand);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[CommandListener] Subscribed to:', channelName);
          this.isListening = true;
        }
      });
  }

  /**
   * Stop listening for commands
   */
  async stop(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    this.supabase = null;
    this.userId = null;
    this.isListening = false;

    console.log('[CommandListener] Stopped');
  }

  /**
   * Handle incoming command
   */
  private async handleCommand(command: DesktopCommand): Promise<void> {
    console.log('[CommandListener] Received command:', command.type);

    let result: CommandResult;

    try {
      switch (command.type) {
        case 'join-party':
          result = await this.handleJoinParty(command.code);
          break;

        case 'generate-code':
          result = await this.handleGenerateCode();
          break;

        case 'invite-player':
          result = await this.handleInvitePlayer(command.gameName, command.tagLine);
          break;

        case 'leave-party':
          result = await this.handleLeaveParty();
          break;

        default:
          result = { type: 'unknown', success: false, error: 'Unknown command' };
      }
    } catch (error) {
      result = {
        type: command.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Send result back via broadcast
    await this.sendResult(result);
  }

  /**
   * Handle join party command
   */
  private async handleJoinParty(code: string): Promise<CommandResult> {
    const result = await this.lfgService.joinPartyByCode(code);

    return {
      type: 'join-party-result',
      success: result.success,
      data: result.success ? { partyId: result.partyId } : undefined,
      error: result.error
    };
  }

  /**
   * Handle generate code command
   */
  private async handleGenerateCode(): Promise<CommandResult> {
    const result = await this.lfgService.generatePartyCode();

    return {
      type: 'generate-code-result',
      success: result.success,
      data: result.success ? { code: result.code } : undefined,
      error: result.error
    };
  }

  /**
   * Handle invite player command
   */
  private async handleInvitePlayer(gameName: string, tagLine: string): Promise<CommandResult> {
    const result = await this.lfgService.inviteToParty(gameName, tagLine);

    return {
      type: 'invite-player-result',
      success: result.success,
      error: result.error
    };
  }

  /**
   * Handle leave party command
   */
  private async handleLeaveParty(): Promise<CommandResult> {
    const success = await this.lfgService.leaveParty();

    return {
      type: 'leave-party-result',
      success
    };
  }

  /**
   * Send result back to web
   */
  private async sendResult(result: CommandResult): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'command-result',
        payload: result
      });

      console.log('[CommandListener] Sent result:', result.type, result.success);
    } catch (error) {
      console.error('[CommandListener] Failed to send result:', error);
    }
  }

  /**
   * Check if listener is active
   */
  isActive(): boolean {
    return this.isListening;
  }
}

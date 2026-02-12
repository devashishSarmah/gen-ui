import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, OAuthProfile } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload, AuthResponseDto } from '@gen-ui/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<any> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.usersService.create(email, passwordHash);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Generate JWT token for user
   */
  async login(user: any): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Exchange GitHub OAuth code for JWT token
   */
  async githubCallback(code: string): Promise<AuthResponseDto> {
    // Exchange code for access token via GitHub API
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.configService.get('GITHUB_CLIENT_ID'),
        client_secret: this.configService.get('GITHUB_CLIENT_SECRET'),
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      this.logger.error(`GitHub token exchange failed: ${tokenData.error_description}`);
      throw new UnauthorizedException(`GitHub authentication failed: ${tokenData.error_description}`);
    }

    // Fetch user profile from GitHub
    const [userResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }),
    ]);

    const githubUser = await userResponse.json();
    const emails = await emailsResponse.json();

    const primaryEmail = Array.isArray(emails)
      ? emails.find((e: any) => e.primary)?.email || emails[0]?.email
      : githubUser.email;

    if (!primaryEmail) {
      throw new UnauthorizedException('No email found on GitHub account');
    }

    const profile: OAuthProfile = {
      provider: 'github',
      providerId: String(githubUser.id),
      email: primaryEmail,
      name: githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatar_url,
    };

    const user = await this.usersService.findOrCreateByOAuth(profile);
    return this.login(user);
  }

  /**
   * Exchange Google OAuth code for JWT token
   */
  async googleCallback(code: string): Promise<AuthResponseDto> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.configService.get('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.configService.get('GOOGLE_CALLBACK_URL'),
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      this.logger.error(`Google token exchange failed: ${tokenData.error_description}`);
      throw new UnauthorizedException(`Google authentication failed: ${tokenData.error_description}`);
    }

    // Fetch user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      throw new UnauthorizedException('No email found on Google account');
    }

    const profile: OAuthProfile = {
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    };

    const user = await this.usersService.findOrCreateByOAuth(profile);
    return this.login(user);
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

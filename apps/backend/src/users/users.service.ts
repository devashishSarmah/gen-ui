import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface OAuthProfile {
  provider: 'github' | 'google';
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Create a new user
   */
  async create(email: string, passwordHash: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      email,
      passwordHash,
      provider: 'local',
    });

    return await this.userRepository.save(user);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find user by GitHub ID
   */
  async findByGithubId(githubId: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { githubId } });
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { googleId } });
  }

  /**
   * Find or create user from OAuth profile
   */
  async findOrCreateByOAuth(profile: OAuthProfile): Promise<User> {
    let user: User | null = null;

    if (profile.provider === 'github') {
      user = await this.findByGithubId(profile.providerId);
    } else if (profile.provider === 'google') {
      user = await this.findByGoogleId(profile.providerId);
    }

    if (user) {
      user.name = profile.name || user.name;
      user.avatarUrl = profile.avatarUrl || user.avatarUrl;
      return await this.userRepository.save(user);
    }

    // Check if user exists by email — link OAuth to existing account
    user = await this.findByEmail(profile.email);
    if (user) {
      if (profile.provider === 'github') user.githubId = profile.providerId;
      if (profile.provider === 'google') user.googleId = profile.providerId;
      user.name = profile.name || user.name;
      user.avatarUrl = profile.avatarUrl || user.avatarUrl;
      return await this.userRepository.save(user);
    }

    // Create new OAuth user
    const newUser = this.userRepository.create({
      email: profile.email,
      provider: profile.provider,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      ...(profile.provider === 'github' ? { githubId: profile.providerId } : {}),
      ...(profile.provider === 'google' ? { googleId: profile.providerId } : {}),
    });

    return await this.userRepository.save(newUser);
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't allow updating password through this method
    delete data.passwordHash;

    Object.assign(user, data);
    return await this.userRepository.save(user);
  }
}

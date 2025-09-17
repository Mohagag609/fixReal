import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/env';
import { User } from '@prisma/client';

export class AuthService {
  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT token
   */
  static generateToken(user: User): string {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    return jwt.verify(token, config.jwtSecret);
  }

  /**
   * Login user
   */
  static async login(username: string, password: string): Promise<{
    user: Omit<User, 'password'>;
    token: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Register new user
   */
  static async register(userData: {
    username: string;
    password: string;
    email?: string;
    name?: string;
    role?: string;
  }): Promise<{
    user: Omit<User, 'password'>;
    token: string;
  }> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: userData.username },
          ...(userData.email ? [{ email: userData.email }] : [])
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'admin'
      }
    });

    const token = this.generateToken(user);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return null;
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  static async updateUser(id: string, updateData: {
    username?: string;
    email?: string;
    name?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change password
   */
  static async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword }
    });
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id }
    });
  }
}
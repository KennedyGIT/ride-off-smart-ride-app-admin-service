import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userCollection: Model<UserDocument>,
  ) {}

  async createUserByPhone(userObject: any, userId: string) {
    try {
      // check if user already exists
      const existingUser = await this.findById(userId);
      if (existingUser) throw new Error('User With Given Id already exists');
      const user = new this.userCollection({ ...userObject });
      await user.save();

      return user;
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    return this.userCollection.findById(id);
  }

  async getUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const users = await this.userCollection
      .find()
      .skip(skip)
      .limit(limit)
      .exec();
    return users;
  }

  private async _update(id: string, updateUserDto: any) {
    return this.userCollection
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async updateUser(userId: string, updateDto: any) {
    return this._update(userId, updateDto);
  }

  async getUserById(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async unblockUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBlocked) {
      return { message: 'User is already unblocked' };
    }

    const updatedUser = await this._update(userId, {
      isBlocked: false,
    });
    // send SNS event - to admin topic SNS
    return updatedUser;
  }

  async blockUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isBlocked) {
      return { message: 'User is already blocked' };
    }

    const updatedUser = await this._update(userId, {
      isBlocked: true,
    });

    // send SNS event - to admin topic SNS
    return updatedUser;
  }
}

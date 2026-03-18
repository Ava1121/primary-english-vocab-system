import mongoose, { Document, Schema } from 'mongoose';

// 用户接口定义
export interface IUser extends Document {
  username: string;
  password: string;
  realName: string;
  role: 'admin' | 'teacher';
  status: number; // 1=启用, 0=禁用
  secondaryPassword?: string; // 二级密码（管理员专用）
  createTime: Date;
  updateTime: Date;
}

// 用户 Schema
const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    realName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'teacher'],
    },
    status: {
      type: Number,
      required: true,
      default: 1,
    },
    secondaryPassword: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: 'createTime',
      updatedAt: 'updateTime',
    },
    collection: 'users',
  }
);

// 创建索引
UserSchema.index({ role: 1, status: 1 });

export default mongoose.model<IUser>('User', UserSchema);

import mongoose, { Document, Schema } from 'mongoose';

// 学生接口定义
export interface IStudent extends Document {
  username: string;
  password: string;
  name: string;
  grade: number; // 1-6
  teacherId: mongoose.Types.ObjectId;
  createTime: Date;
  updateTime: Date;
}

// 学生 Schema
const StudentSchema: Schema = new Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: {
      createdAt: 'createTime',
      updatedAt: 'updateTime',
    },
    collection: 'students',
  }
);

// 创建索引
StudentSchema.index({ teacherId: 1, grade: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);

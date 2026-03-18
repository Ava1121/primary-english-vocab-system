import mongoose, { Document, Schema } from 'mongoose';

// 词书接口定义
export interface IBook extends Document {
  name: string;           // 词书名称，如"三年级上册"
  grade: number;          // 年级 1-6
  semester: string;       // 学期 '上' 或 '下'
  publisher: string;      // 出版社，如"外研社"、"人教版"
  description?: string;   // 描述
  wordCount: number;      // 单词数量
  status: number;         // 状态 1-启用 0-禁用
  createTime: Date;
  updateTime: Date;
}

// 词书 Schema
const BookSchema: Schema = new Schema(
  {
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
    semester: {
      type: String,
      required: true,
      enum: ['上', '下'],
    },
    publisher: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
  },
  {
    timestamps: {
      createdAt: 'createTime',
      updatedAt: 'updateTime',
    },
    collection: 'books',
  }
);

// 创建索引
BookSchema.index({ grade: 1, semester: 1 });
BookSchema.index({ name: 1 });

export default mongoose.model<IBook>('Book', BookSchema);

import mongoose, { Document, Schema } from 'mongoose';

// 单词接口定义
export interface IWord extends Document {
  en: string;
  cn: string;
  phonetic?: string; // 音标
  grade: number; // 1-6
  createTime: Date;
  updateTime: Date;
}

// 单词 Schema
const WordSchema: Schema = new Schema(
  {
    en: {
      type: String,
      required: true,
      trim: true,
      lowercase: false, // 保持大小写
    },
    cn: {
      type: String,
      required: true,
      trim: true,
    },
    phonetic: {
      type: String,
      required: false,
      trim: true,
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
  },
  {
    timestamps: {
      createdAt: 'createTime',
      updatedAt: 'updateTime',
    },
    collection: 'words',
  }
);

// 创建复合索引（年级+单词）
WordSchema.index({ grade: 1, en: 1 });

export default mongoose.model<IWord>('Word', WordSchema);

import mongoose, { Document, Schema } from 'mongoose';

// 单词接口定义
export interface IWord extends Document {
  en: string;             // 英文单词
  cn: string;             // 中文释义
  phonetic?: string;      // 音标
  grade: number;          // 年级 1-6
  bookId?: mongoose.Types.ObjectId;  // 所属词书ID
  bookName?: string;      // 所属词书名称（冗余字段，方便查询）
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
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: false,
    },
    bookName: {
      type: String,
      trim: true,
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

// 创建复合索引
WordSchema.index({ grade: 1, en: 1 });
WordSchema.index({ bookId: 1 });

export default mongoose.model<IWord>('Word', WordSchema);

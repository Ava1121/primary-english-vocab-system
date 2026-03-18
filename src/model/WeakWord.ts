import mongoose, { Document, Schema } from 'mongoose';

// 不熟悉单词库接口定义
export interface IWeakWord extends Document {
  studentId: mongoose.Types.ObjectId;
  wordId: mongoose.Types.ObjectId;
  grade: number;
  createTime: Date;
  updateTime: Date;
}

// 不熟悉单词库 Schema
const WeakWordSchema: Schema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Student',
    },
    wordId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Word',
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
    collection: 'weakWords',
  }
);

// 创建复合索引（学生+单词唯一）
WeakWordSchema.index({ studentId: 1, wordId: 1 }, { unique: true });

export default mongoose.model<IWeakWord>('WeakWord', WeakWordSchema);

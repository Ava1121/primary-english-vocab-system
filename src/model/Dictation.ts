import mongoose, { Document, Schema } from 'mongoose';

// 默写记录接口定义
export interface IDictation extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  grade: number;
  totalNum: number; // 总题量（5/10/15/20）
  correctNum: number; // 正确题数
  score: number; // 得分（百分制）
  wrongWords: mongoose.Types.ObjectId[]; // 错题ID数组
  dictationTime: Date;
  updateTime: Date;
}

// 默写记录 Schema
const DictationSchema: Schema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Student',
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    totalNum: {
      type: Number,
      required: true,
      enum: [5, 10, 15, 20],
    },
    correctNum: {
      type: Number,
      required: true,
      default: 0,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    wrongWords: {
      type: [Schema.Types.ObjectId],
      required: true,
      default: [],
      ref: 'Word',
    },
    dictationTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: {
      updatedAt: 'updateTime',
    },
    collection: 'dictations',
  }
);

// 创建索引
DictationSchema.index({ studentId: 1, dictationTime: -1 });

export default mongoose.model<IDictation>('Dictation', DictationSchema);

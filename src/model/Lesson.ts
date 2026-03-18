import mongoose, { Document, Schema } from 'mongoose';

// 课时记录接口定义
export interface ILesson extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  grade: number;
  knowWords: mongoose.Types.ObjectId[];
  unknownWords: mongoose.Types.ObjectId[];
  masterRate: number; // 掌握率（百分比）
  studyTime: Date;
  updateTime: Date;
}

// 课时记录 Schema
const LessonSchema: Schema = new Schema(
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
    knowWords: {
      type: [Schema.Types.ObjectId],
      required: true,
      default: [],
      ref: 'Word',
    },
    unknownWords: {
      type: [Schema.Types.ObjectId],
      required: true,
      default: [],
      ref: 'Word',
    },
    masterRate: {
      type: Number,
      required: true,
      default: 0,
    },
    studyTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: {
      updatedAt: 'updateTime',
    },
    collection: 'lessons',
  }
);

// 创建索引（学生+时间倒序）
LessonSchema.index({ studentId: 1, studyTime: -1 });

export default mongoose.model<ILesson>('Lesson', LessonSchema);

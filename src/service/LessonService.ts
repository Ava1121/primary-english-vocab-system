import Lesson, { ILesson } from '../model/Lesson';
import WeakWord from '../model/WeakWord';
import Word from '../model/Word';
import mongoose from 'mongoose';

export class LessonService {
  /**
   * 获取学生课时列表
   */
  static async getLessonList(studentId: string, page: number = 1, size: number = 10) {
    const total = await Lesson.countDocuments({ studentId });
    const list = await Lesson.find({ studentId })
      .skip((page - 1) * size)
      .limit(size)
      .sort({ studyTime: -1 })
      .populate('knowWords', 'en cn')
      .populate('unknownWords', 'en cn');

    return {
      list,
      total,
      page,
      size,
    };
  }

  /**
   * 获取课时详情
   */
  static async getLessonDetail(id: string) {
    const lesson = await Lesson.findById(id)
      .populate('knowWords', 'en cn')
      .populate('unknownWords', 'en cn');
    if (!lesson) {
      throw new Error('课时记录不存在');
    }
    return lesson;
  }

  /**
   * 生成课时记录
   */
  static async createLesson(
    studentId: string,
    teacherId: string,
    grade: number,
    knowWords: string[],
    unknownWords: string[]
  ) {
    // 计算掌握率
    const totalWords = knowWords.length + unknownWords.length;
    const masterRate = totalWords > 0 ? (knowWords.length / totalWords) * 100 : 0;

    // 创建课时记录
    const lesson = new Lesson({
      studentId,
      teacherId,
      grade,
      knowWords,
      unknownWords,
      masterRate: Number(masterRate.toFixed(1)),
      studyTime: new Date(),
    });
    await lesson.save();

    // 将未掌握单词加入薄弱库
    if (unknownWords.length > 0) {
      const weakWordsData = unknownWords.map((wordId) => ({
        studentId,
        wordId,
        grade,
      }));

      // 使用 insertMany 并忽略重复错误
      try {
        await WeakWord.insertMany(weakWordsData, { ordered: false });
      } catch (error: any) {
        // 忽略重复键错误（代码 11000）
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    return lesson;
  }

  /**
   * 一键重教（将课时中的未掌握单词重新教学）
   */
  static async reteach(lessonId: string) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('课时记录不存在');
    }

    return {
      unknownWords: lesson.unknownWords,
      grade: lesson.grade,
    };
  }

  /**
   * 获取学生今日课时数
   */
  static async getTodayLessonCount(studentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return await Lesson.countDocuments({
      studentId,
      studyTime: { $gte: today, $lte: todayEnd },
    });
  }

  /**
   * 获取学生学习统计
   */
  static async getStudentStatistics(studentId: string) {
    // 总课时数
    const totalLessons = await Lesson.countDocuments({ studentId });

    // 总掌握单词数和未掌握单词数（去重）
    const lessons = await Lesson.find({ studentId });
    const knowWordsSet = new Set<string>();
    const unknownWordsSet = new Set<string>();

    lessons.forEach((lesson) => {
      lesson.knowWords.forEach((wordId) => knowWordsSet.add(wordId.toString()));
      lesson.unknownWords.forEach((wordId) => unknownWordsSet.add(wordId.toString()));
    });

    return {
      totalLessons,
      totalKnowWords: knowWordsSet.size,
      totalUnknownWords: unknownWordsSet.size,
    };
  }
}

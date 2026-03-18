import WeakWord from '../model/WeakWord';
import Word from '../model/Word';
import mongoose from 'mongoose';

export class WeakWordService {
  /**
   * 获取薄弱单词列表
   */
  static async getWeakWordList(studentId: string, grade?: number) {
    const query: any = { studentId };
    if (grade) {
      query.grade = grade;
    }

    const weakWords = await WeakWord.find(query)
      .populate('wordId', 'en cn grade')
      .sort({ createTime: -1 });

    return weakWords;
  }

  /**
   * 一键重教薄弱单词
   */
  static async reteachWeakWords(studentId: string, grade?: number) {
    const query: any = { studentId };
    if (grade) {
      query.grade = grade;
    }

    const weakWords = await WeakWord.find(query).populate('wordId', 'en cn grade');
    const wordIds = weakWords.map((w) => w.wordId._id);

    return {
      words: weakWords.map((w) => w.wordId),
      grade: grade || null,
    };
  }

  /**
   * 清空薄弱单词库
   */
  static async clearWeakWords(studentId: string, grade?: number) {
    const query: any = { studentId };
    if (grade) {
      query.grade = grade;
    }

    await WeakWord.deleteMany(query);
    return true;
  }

  /**
   * 获取学生薄弱单词数
   */
  static async getWeakWordCount(studentId: string) {
    return await WeakWord.countDocuments({ studentId });
  }
}

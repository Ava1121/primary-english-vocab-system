import Lesson from '../model/Lesson';
import Dictation from '../model/Dictation';
import WeakWord from '../model/WeakWord';
import Word from '../model/Word';
import Student from '../model/Student';
import mongoose from 'mongoose';

export class StatisticsService {
  /**
   * 管理员控制台统计
   */
  static async getAdminDashboard() {
    // 总单词数
    const totalWords = await Word.countDocuments();

    // 各年级单词数
    const gradeCounts = await Word.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const gradeWordCounts: { [key: number]: number } = {};
    for (let i = 1; i <= 6; i++) {
      gradeWordCounts[i] = 0;
    }
    gradeCounts.forEach((item) => {
      gradeWordCounts[item._id] = item.count;
    });

    // 老师总数
    const totalTeachers = await Student.distinct('teacherId').then((ids) => ids.length);

    // 学生总数
    const totalStudents = await Student.countDocuments();

    // 全平台掌握率
    const lessons = await Lesson.find();
    let avgMasterRate = 0;
    if (lessons.length > 0) {
      avgMasterRate = lessons.reduce((sum, lesson) => sum + lesson.masterRate, 0) / lessons.length;
    }

    return {
      totalWords,
      gradeWordCounts,
      totalTeachers,
      totalStudents,
      avgMasterRate: Number(avgMasterRate.toFixed(1)),
    };
  }

  /**
   * 学生学习概览
   */
  static async getStudentOverview(studentId: string) {
    // 总课时数
    const totalLessons = await Lesson.countDocuments({ studentId });

    // 掌握和未掌握单词数
    const lessons = await Lesson.find({ studentId });
    const knowWordsSet = new Set<string>();
    const unknownWordsSet = new Set<string>();

    lessons.forEach((lesson) => {
      lesson.knowWords.forEach((id) => knowWordsSet.add(id.toString()));
      lesson.unknownWords.forEach((id) => unknownWordsSet.add(id.toString()));
    });

    // 薄弱单词数
    const weakWordCount = await WeakWord.countDocuments({ studentId });

    // 平均掌握率
    let avgMasterRate = 0;
    if (lessons.length > 0) {
      avgMasterRate = lessons.reduce((sum, l) => sum + l.masterRate, 0) / lessons.length;
    }

    return {
      totalLessons,
      knowWordsCount: knowWordsSet.size,
      unknownWordsCount: unknownWordsSet.size,
      weakWordCount,
      avgMasterRate: Number(avgMasterRate.toFixed(1)),
    };
  }

  /**
   * 分年级掌握率
   */
  static async getGradeMasterRate(studentId: string) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('学生不存在');
    }

    const result: { [key: number]: number } = {};

    for (let grade = 1; grade <= 6; grade++) {
      // 该年级的总课时数
      const lessons = await Lesson.find({ studentId, grade });

      if (lessons.length === 0) {
        result[grade] = 0;
        continue;
      }

      // 计算平均掌握率
      const avgRate = lessons.reduce((sum, l) => sum + l.masterRate, 0) / lessons.length;
      result[grade] = Number(avgRate.toFixed(1));
    }

    return result;
  }

  /**
   * 高频错题
   */
  static async getWrongWords(studentId: string, limit: number = 10) {
    // 从薄弱库中统计
    const wrongWords = await WeakWord.aggregate([
      {
        $match: { studentId: new mongoose.Types.ObjectId(studentId) },
      },
      {
        $group: {
          _id: '$wordId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    // 获取单词详情
    const wordIds = wrongWords.map((w) => w._id);
    const words = await Word.find({ _id: { $in: wordIds } });

    // 组合结果
    const result = wrongWords.map((w) => {
      const word = words.find((word) => word._id.equals(w._id));
      return {
        word,
        count: w.count,
      };
    });

    return result;
  }
}

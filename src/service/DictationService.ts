import Dictation, { IDictation } from '../model/Dictation';
import Word from '../model/Word';
import WeakWord from '../model/WeakWord';
import mongoose from 'mongoose';

export class DictationService {
  /**
   * 获取默写题目
   */
  static async getDictationWords(studentId: string, grade: number, num: number) {
    // 随机获取单词
    const words = await Word.aggregate([
      { $match: { grade } },
      { $sample: { size: num } },
    ]);

    return words;
  }

  /**
   * 提交默写答案并判分
   */
  static async submitDictation(
    studentId: string,
    teacherId: string,
    grade: number,
    totalNum: number,
    answers: Array<{ wordId: string; answer: string }>
  ) {
    // 获取正确答案
    const wordIds = answers.map((a) => new mongoose.Types.ObjectId(a.wordId));
    const words = await Word.find({ _id: { $in: wordIds } });

    // 创建单词ID到单词的映射
    const wordMap = new Map<string, typeof words[0]>();
    words.forEach((word) => {
      wordMap.set(word._id.toString(), word);
    });

    // 判分（大小写不敏感）
    let correctNum = 0;
    const wrongWords: string[] = [];

    answers.forEach((answer) => {
      const word = wordMap.get(answer.wordId);
      if (word) {
        // 转为小写比较
        if (word.en.toLowerCase() === answer.answer.toLowerCase().trim()) {
          correctNum++;
        } else {
          wrongWords.push(answer.wordId);
        }
      }
    });

    // 计算得分
    const score = (correctNum / totalNum) * 100;

    // 创建默写记录
    const dictation = new Dictation({
      studentId,
      teacherId,
      grade,
      totalNum,
      correctNum,
      score: Number(score.toFixed(1)),
      wrongWords,
      dictationTime: new Date(),
    });
    await dictation.save();

    // 将错题加入薄弱库
    if (wrongWords.length > 0) {
      const weakWordsData = wrongWords.map((wordId) => ({
        studentId,
        wordId: new mongoose.Types.ObjectId(wordId),
        grade,
      }));

      try {
        await WeakWord.insertMany(weakWordsData, { ordered: false });
      } catch (error: any) {
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    // 返回结果
    const wrongWordDetails = await Word.find({ _id: { $in: wrongWords } });

    return {
      score: Number(score.toFixed(1)),
      correctNum,
      totalNum,
      wrongWords: wrongWordDetails,
    };
  }

  /**
   * 获取默写历史记录
   */
  static async getDictationList(studentId: string, page: number = 1, size: number = 10) {
    const total = await Dictation.countDocuments({ studentId });
    const list = await Dictation.find({ studentId })
      .skip((page - 1) * size)
      .limit(size)
      .sort({ dictationTime: -1 })
      .populate('wrongWords', 'en cn');

    return {
      list,
      total,
      page,
      size,
    };
  }

  /**
   * 获取学生默写统计
   */
  static async getDictationStatistics(studentId: string) {
    const dictations = await Dictation.find({ studentId });

    if (dictations.length === 0) {
      return {
        avgScore: 0,
        totalCount: 0,
      };
    }

    const avgScore = dictations.reduce((sum, d) => sum + d.score, 0) / dictations.length;

    return {
      avgScore: Number(avgScore.toFixed(1)),
      totalCount: dictations.length,
    };
  }
}

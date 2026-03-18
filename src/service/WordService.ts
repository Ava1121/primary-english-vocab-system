import Word, { IWord } from '../model/Word';
import mongoose from 'mongoose';

export class WordService {
  /**
   * 获取单词列表（分页+筛选）
   */
  static async getWordList(page: number = 1, size: number = 10, grade?: number, keyword?: string) {
    const query: any = {};

    // 年级筛选
    if (grade) {
      query.grade = grade;
    }

    // 关键词搜索（中英文）
    if (keyword) {
      query.$or = [
        { en: { $regex: keyword, $options: 'i' } },
        { cn: { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await Word.countDocuments(query);
    const list = await Word.find(query)
      .skip((page - 1) * size)
      .limit(size)
      .sort({ createTime: -1 });

    return {
      list,
      total,
      page,
      size,
    };
  }

  /**
   * 新增单词
   */
  static async addWord(en: string, cn: string, grade: number) {
    // 检查是否已存在（同一年级下相同单词）
    const exist = await Word.findOne({ en, grade });
    if (exist) {
      throw new Error('该单词已存在');
    }

    const word = new Word({ en, cn, grade });
    await word.save();

    return word;
  }

  /**
   * 编辑单词
   */
  static async editWord(id: string, en: string, cn: string, grade: number) {
    // 检查是否已存在（排除当前记录）
    const exist = await Word.findOne({ en, grade, _id: { $ne: id } });
    if (exist) {
      throw new Error('该单词已存在');
    }

    const word = await Word.findByIdAndUpdate(id, { en, cn, grade }, { new: true });
    if (!word) {
      throw new Error('单词不存在');
    }

    return word;
  }

  /**
   * 删除单词
   */
  static async deleteWord(id: string) {
    const word = await Word.findByIdAndDelete(id);
    if (!word) {
      throw new Error('单词不存在');
    }
    return true;
  }

  /**
   * 批量导入单词
   */
  static async importWords(words: Array<{ en: string; cn: string; grade: number }>) {
    let successNum = 0;
    let repeatNum = 0;
    let failNum = 0;

    for (const word of words) {
      try {
        // 检查是否已存在
        const exist = await Word.findOne({ en: word.en, grade: word.grade });
        if (exist) {
          repeatNum++;
          continue;
        }

        // 插入数据库
        await Word.create(word);
        successNum++;
      } catch (error) {
        failNum++;
      }
    }

    return {
      successNum,
      repeatNum,
      failNum,
      msg: `成功导入 ${successNum} 条，重复 ${repeatNum} 条，失败 ${failNum} 条`,
    };
  }

  /**
   * 获取各年级单词数量统计
   */
  static async getGradeWordCount() {
    const counts = await Word.aggregate([
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

    const result: { [key: number]: number } = {};
    for (let i = 1; i <= 6; i++) {
      result[i] = 0;
    }
    counts.forEach((item) => {
      result[item._id] = item.count;
    });

    return result;
  }

  /**
   * 获取总单词数
   */
  static async getTotalWordCount() {
    return await Word.countDocuments();
  }

  /**
   * 根据年级获取单词列表（用于教学）
   */
  static async getWordsByGrade(grade: number) {
    return await Word.find({ grade }).sort({ en: 1 });
  }

  /**
   * 根据ID列表获取单词
   */
  static async getWordsByIds(ids: mongoose.Types.ObjectId[]) {
    return await Word.find({ _id: { $in: ids } });
  }

  /**
   * 随机获取指定数量的单词（用于默写）
   */
  static async getRandomWords(grade: number, num: number) {
    const words = await Word.aggregate([
      { $match: { grade } },
      { $sample: { size: num } },
    ]);
    return words;
  }
}

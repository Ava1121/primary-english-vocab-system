import Book, { IBook } from '../model/Book';
import Word from '../model/Word';
import mongoose from 'mongoose';

export class BookService {
  /**
   * 获取词书列表（分页+筛选）
   */
  static async getBookList(page: number = 1, size: number = 10, grade?: number, keyword?: string) {
    const query: any = {};

    // 年级筛选
    if (grade) {
      query.grade = grade;
    }

    // 关键词搜索
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { publisher: { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await Book.countDocuments(query);
    const list = await Book.find(query)
      .skip((page - 1) * size)
      .limit(size)
      .sort({ grade: 1, semester: 1, createTime: -1 });

    return {
      list,
      total,
      page,
      size,
    };
  }

  /**
   * 获取所有启用的词书（不分页）
   */
  static async getAllBooks() {
    return await Book.find({ status: 1 }).sort({ grade: 1, semester: 1 });
  }

  /**
   * 获取词书详情
   */
  static async getBookDetail(id: string) {
    const book = await Book.findById(id);
    if (!book) {
      throw new Error('词书不存在');
    }
    return book;
  }

  /**
   * 新增词书
   */
  static async addBook(name: string, grade: number, semester: string, publisher: string, description?: string) {
    // 检查是否已存在
    const exist = await Book.findOne({ name, grade, semester });
    if (exist) {
      throw new Error('该词书已存在');
    }

    const book = new Book({
      name,
      grade,
      semester,
      publisher,
      description,
      wordCount: 0,
      status: 1,
    });
    await book.save();

    return book;
  }

  /**
   * 编辑词书
   */
  static async editBook(id: string, name: string, grade: number, semester: string, publisher: string, description?: string) {
    // 检查是否已存在（排除当前记录）
    const exist = await Book.findOne({ name, grade, semester, _id: { $ne: id } });
    if (exist) {
      throw new Error('该词书已存在');
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { name, grade, semester, publisher, description },
      { new: true }
    );
    if (!book) {
      throw new Error('词书不存在');
    }

    return book;
  }

  /**
   * 删除词书（同时删除词书中的所有单词）
   */
  static async deleteBook(id: string) {
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      throw new Error('词书不存在');
    }

    // 删除该词书下的所有单词
    await Word.deleteMany({ bookId: id });

    return true;
  }

  /**
   * 更新词书单词数量
   */
  static async updateWordCount(bookId: string) {
    const count = await Word.countDocuments({ bookId });
    await Book.findByIdAndUpdate(bookId, { wordCount: count });
    return count;
  }

  /**
   * 获取词书中的单词列表
   */
  static async getBookWords(bookId: string, page: number = 1, size: number = 20) {
    const total = await Word.countDocuments({ bookId });
    const list = await Word.find({ bookId })
      .skip((page - 1) * size)
      .limit(size)
      .sort({ en: 1 });

    return {
      list,
      total,
      page,
      size,
    };
  }

  /**
   * 批量导入单词到词书
   */
  static async importWords(bookId: string, words: Array<{ en: string; cn: string; phonetic?: string }>) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('词书不存在');
    }

    let successNum = 0;
    let repeatNum = 0;
    let failNum = 0;

    for (const word of words) {
      try {
        // 检查词书内是否已存在
        const exist = await Word.findOne({ en: word.en, bookId });
        if (exist) {
          repeatNum++;
          continue;
        }

        // 插入数据库
        await Word.create({
          en: word.en,
          cn: word.cn,
          phonetic: word.phonetic || '',
          grade: book.grade,
          bookId: book._id,
          bookName: book.name,
        });
        successNum++;
      } catch (error) {
        failNum++;
      }
    }

    // 更新词书单词数量
    await this.updateWordCount(bookId);

    return {
      successNum,
      repeatNum,
      failNum,
      msg: `成功导入 ${successNum} 条，重复 ${repeatNum} 条，失败 ${failNum} 条`,
    };
  }

  /**
   * 添加单个单词到词书
   */
  static async addWord(bookId: string, en: string, cn: string, phonetic?: string) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('词书不存在');
    }

    // 检查词书内是否已存在
    const exist = await Word.findOne({ en, bookId });
    if (exist) {
      throw new Error('该单词已存在于词书中');
    }

    const word = await Word.create({
      en,
      cn,
      phonetic: phonetic || '',
      grade: book.grade,
      bookId: book._id,
      bookName: book.name,
    });

    // 更新词书单词数量
    await this.updateWordCount(bookId);

    return word;
  }

  /**
   * 编辑词书中的单词
   */
  static async editWord(wordId: string, en: string, cn: string, phonetic?: string) {
    const word = await Word.findById(wordId);
    if (!word) {
      throw new Error('单词不存在');
    }

    // 检查是否已存在（排除当前记录）
    if (word.bookId) {
      const exist = await Word.findOne({ en, bookId: word.bookId, _id: { $ne: wordId } });
      if (exist) {
        throw new Error('该单词已存在于词书中');
      }
    }

    const updatedWord = await Word.findByIdAndUpdate(
      wordId,
      { en, cn, phonetic: phonetic || '' },
      { new: true }
    );

    return updatedWord;
  }

  /**
   * 删除词书中的单词
   */
  static async deleteWord(wordId: string) {
    const word = await Word.findById(wordId);
    if (!word) {
      throw new Error('单词不存在');
    }

    const bookId = word.bookId;

    await Word.findByIdAndDelete(wordId);

    // 更新词书单词数量
    if (bookId) {
      await this.updateWordCount(bookId.toString());
    }

    return true;
  }

  /**
   * 获取各年级词书统计
   */
  static async getGradeBookCount() {
    const counts = await Book.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          totalWords: { $sum: '$wordCount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const result: { [key: number]: { bookCount: number; wordCount: number } } = {};
    for (let i = 1; i <= 6; i++) {
      result[i] = { bookCount: 0, wordCount: 0 };
    }
    counts.forEach((item) => {
      result[item._id] = {
        bookCount: item.count,
        wordCount: item.totalWords,
      };
    });

    return result;
  }

  /**
   * 获取总词书数
   */
  static async getTotalBookCount() {
    return await Book.countDocuments();
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { WordService, LessonService, StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';
import WeakWord from '../../model/WeakWord';
import Lesson from '../../model/Lesson';

/**
 * 获取年级单词列表
 */
export const words = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const grade = parseInt(query.grade);

    if (!grade || grade < 1 || grade > 6) {
      return reply.status(400).send(ResponseUtil.error('年级参数错误'));
    }

    const words = await WordService.getWordsByGrade(grade);
    return reply.send(ResponseUtil.success(words));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 获取学生生词（除已掌握外的单词）
 * 生词 = 该年级所有单词 - 已掌握的单词
 */
export const newWords = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const { studentId, grade } = query;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('缺少学生ID'));
    }

    const teacherId = request.userId!;
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const gradeNum = parseInt(grade);

    // 1. 获取该年级所有单词
    const allWords = await WordService.getWordsByGrade(gradeNum);
    const allWordIds = allWords.map((w: any) => w._id.toString());

    // 2. 获取该学生已掌握的单词ID（从Lesson表的knowWords聚合）
    const lessons = await Lesson.find({ studentId, grade: gradeNum }, 'knowWords');
    const masteredWordIds = new Set<string>();
    lessons.forEach((lesson: any) => {
      lesson.knowWords.forEach((wordId: any) => {
        masteredWordIds.add(wordId.toString());
      });
    });

    // 3. 生词 = 所有单词 - 已掌握单词
    const newWordsList = allWords.filter((w: any) => !masteredWordIds.has(w._id.toString()));

    return reply.send(ResponseUtil.success(newWordsList));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 获取学生不熟悉单词（薄弱单词）
 */
export const weakWords = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const { studentId, grade } = query;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('缺少学生ID'));
    }

    const teacherId = request.userId!;
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    // 构建查询条件
    const queryCondition: any = { studentId };
    if (grade) {
      queryCondition.grade = parseInt(grade);
    }

    // 获取学生的薄弱单词
    const weakWordsList = await WeakWord.find(queryCondition)
      .populate('wordId', 'en cn phonetic grade')
      .sort({ createTime: -1 });

    // 过滤掉无效数据并提取单词信息
    const words = weakWordsList
      .filter((w: any) => w.wordId)
      .map((w: any) => ({
        _id: w.wordId._id,
        en: w.wordId.en,
        cn: w.wordId.cn,
        phonetic: w.wordId.phonetic,
        grade: w.wordId.grade,
      }));

    return reply.send(ResponseUtil.success(words));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 标记单词状态（预留接口，前端实时统计）
 */
export const mark = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 此接口可以留空，前端实时统计后通过 finish 接口提交
    return reply.send(ResponseUtil.success(null));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 完成教学，生成课时记录
 */
export const finish = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const body = request.body as any;

    if (!body.studentId || !body.grade || !body.knowWords || !body.unknownWords) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(body.studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const lesson = await LessonService.createLesson(
      body.studentId,
      teacherId,
      body.grade,
      body.knowWords,
      body.unknownWords
    );

    return reply.send(ResponseUtil.success(lesson, '教学记录已保存'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

import { FastifyRequest, FastifyReply } from 'fastify';
import { WordService, LessonService, StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';

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

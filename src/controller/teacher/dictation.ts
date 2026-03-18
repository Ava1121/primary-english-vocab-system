import { FastifyRequest, FastifyReply } from 'fastify';
import { DictationService, StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';

/**
 * 获取默写题目
 */
export const words = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const studentId = query.studentId;
    const grade = parseInt(query.grade);
    const num = parseInt(query.num) || 10;

    if (!studentId || !grade) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const words = await DictationService.getDictationWords(studentId, grade, num);
    return reply.send(ResponseUtil.success(words));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 提交默写答案
 */
export const submit = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const body = request.body as any;

    if (!body.studentId || !body.grade || !body.totalNum || !body.answers) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(body.studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const result = await DictationService.submitDictation(
      body.studentId,
      teacherId,
      body.grade,
      body.totalNum,
      body.answers
    );

    return reply.send(ResponseUtil.success(result));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 默写历史记录
 */
export const list = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const studentId = query.studentId;
    const page = parseInt(query.page) || 1;
    const size = parseInt(query.size) || 10;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const data = await DictationService.getDictationList(studentId, page, size);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

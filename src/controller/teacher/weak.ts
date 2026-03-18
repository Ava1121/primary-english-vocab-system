import { FastifyRequest, FastifyReply } from 'fastify';
import { WeakWordService, StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';

/**
 * 薄弱单词列表
 */
export const list = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const studentId = query.studentId;
    const grade = query.grade ? parseInt(query.grade) : undefined;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const data = await WeakWordService.getWeakWordList(studentId, grade);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 一键重教薄弱单词
 */
export const reteach = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const body = request.body as any;
    const studentId = body.studentId;
    const grade = body.grade ? parseInt(body.grade) : undefined;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const data = await WeakWordService.reteachWeakWords(studentId, grade);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 清空薄弱库
 */
export const clear = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const studentId = query.studentId;
    const grade = query.grade ? parseInt(query.grade) : undefined;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    await WeakWordService.clearWeakWords(studentId, grade);
    return reply.send(ResponseUtil.success(null, '清空成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

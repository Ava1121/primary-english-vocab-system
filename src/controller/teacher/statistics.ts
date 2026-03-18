import { FastifyRequest, FastifyReply } from 'fastify';
import { StatisticsService, StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';

/**
 * 学生学习概览
 */
export const overview = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const studentId = query.studentId;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const data = await StatisticsService.getStudentOverview(studentId);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 分年级掌握率
 */
export const grade = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const studentId = query.studentId;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const data = await StatisticsService.getGradeMasterRate(studentId);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 高频错题
 */
export const wrong = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const studentId = query.studentId;
    const limit = parseInt(query.limit) || 10;

    if (!studentId) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(studentId, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const data = await StatisticsService.getWrongWords(studentId, limit);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

import { FastifyRequest, FastifyReply } from 'fastify';
import { LessonService, StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';

/**
 * 课时列表
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

    const data = await LessonService.getLessonList(studentId, page, size);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 课时详情
 */
export const detail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;

    if (!query.id) {
      return reply.status(400).send(ResponseUtil.error('课时ID不能为空'));
    }

    const lesson = await LessonService.getLessonDetail(query.id);
    return reply.send(ResponseUtil.success(lesson));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 一键重教
 */
export const reteach = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.lessonId) {
      return reply.status(400).send(ResponseUtil.error('课时ID不能为空'));
    }

    const data = await LessonService.reteach(body.lessonId);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 更新课时掌握状态
 * 将默写正确的单词从未掌握移到已掌握
 */
export const updateMaster = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.lessonId) {
      return reply.status(400).send(ResponseUtil.error('课时ID不能为空'));
    }

    if (!body.correctWordIds || !Array.isArray(body.correctWordIds)) {
      return reply.status(400).send(ResponseUtil.error('正确单词列表不能为空'));
    }

    const data = await LessonService.updateMasterStatus(body.lessonId, body.correctWordIds);
    return reply.send(ResponseUtil.success(data, '掌握状态已更新'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

import { FastifyRequest, FastifyReply } from 'fastify';
import { TeacherService } from '../../service';
import { ResponseUtil } from '../../utils/response';

/**
 * 老师控制台数据
 */
export const dashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const data = await TeacherService.getTeacherDashboard(teacherId);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

import { FastifyRequest, FastifyReply } from 'fastify';
import { StatisticsService, WordService, TeacherService, StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';

/**
 * 管理员控制台数据
 */
export const dashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await StatisticsService.getAdminDashboard();
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

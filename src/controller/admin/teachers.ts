import { FastifyRequest, FastifyReply } from 'fastify';
import { TeacherService } from '../../service';
import { ResponseUtil } from '../../utils/response';
import { teacherSchema } from '../../utils/validator';

/**
 * 老师列表
 */
export const list = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const page = parseInt(query.page) || 1;
    const size = parseInt(query.size) || 10;
    const keyword = query.keyword || '';

    const data = await TeacherService.getTeacherList(page, size, keyword);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 新增老师
 */
export const add = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    // 参数校验
    const { error } = teacherSchema.validate(body);
    if (error) {
      return reply.status(400).send(ResponseUtil.error(error.details[0].message));
    }

    const teacher = await TeacherService.addTeacher(body.username, body.password, body.realName);
    return reply.send(ResponseUtil.success(teacher, '添加成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 编辑老师
 */
export const edit = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.id) {
      return reply.status(400).send(ResponseUtil.error('老师ID不能为空'));
    }

    const teacher = await TeacherService.editTeacher(body.id, body.realName);
    return reply.send(ResponseUtil.success(teacher, '编辑成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 更新老师状态
 */
export const status = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;

    if (!query.id || query.status === undefined) {
      return reply.status(400).send(ResponseUtil.error('参数错误'));
    }

    const teacher = await TeacherService.updateStatus(query.id, parseInt(query.status));
    return reply.send(ResponseUtil.success(teacher, '状态更新成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 删除老师
 */
export const del = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;
    const adminId = (request as any).user?.id;

    if (!body.id) {
      return reply.status(400).send(ResponseUtil.error('老师ID不能为空'));
    }

    if (!body.secondaryPassword) {
      return reply.status(400).send(ResponseUtil.error('请输入二级密码'));
    }

    // 验证二级密码
    await TeacherService.verifySecondaryPassword(adminId, body.secondaryPassword);

    // 删除老师
    await TeacherService.deleteTeacher(body.id);
    return reply.send(ResponseUtil.success(null, '删除成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 老师名下学生
 */
export const students = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;

    if (!query.teacherId) {
      return reply.status(400).send(ResponseUtil.error('老师ID不能为空'));
    }

    const students = await TeacherService.getTeacherStudents(query.teacherId);
    return reply.send(ResponseUtil.success(students));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

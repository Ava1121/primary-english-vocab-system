import { FastifyRequest, FastifyReply } from 'fastify';
import { StudentService } from '../../service';
import { ResponseUtil } from '../../utils/response';
import { studentSchema } from '../../utils/validator';

/**
 * 学生列表
 */
export const list = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;
    const page = parseInt(query.page) || 1;
    const size = parseInt(query.size) || 10;
    const keyword = query.keyword || '';

    const data = await StudentService.getStudentList(teacherId, page, size, keyword);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 新增学生
 */
export const add = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const body = request.body as any;

    // 参数校验
    const { error } = studentSchema.validate(body);
    if (error) {
      return reply.status(400).send(ResponseUtil.error(error.details[0].message));
    }

    const student = await StudentService.addStudent(
      teacherId,
      body.username,
      body.password,
      body.name,
      body.grade
    );
    return reply.send(ResponseUtil.success(student, '添加成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 编辑学生
 */
export const edit = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const body = request.body as any;

    if (!body.id) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(body.id, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const student = await StudentService.editStudent(body.id, body.name, body.grade);
    return reply.send(ResponseUtil.success(student, '编辑成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 删除学生
 */
export const del = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;

    if (!query.id) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(query.id, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    await StudentService.deleteStudent(query.id);
    return reply.send(ResponseUtil.success(null, '删除成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 学生详情
 */
export const detail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const teacherId = request.userId!;
    const query = request.query as any;

    if (!query.id) {
      return reply.status(400).send(ResponseUtil.error('学生ID不能为空'));
    }

    // 验证学生是否属于该老师
    const isOwner = await StudentService.checkStudentBelongsToTeacher(query.id, teacherId);
    if (!isOwner) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }

    const student = await StudentService.getStudentDetail(query.id);
    return reply.send(ResponseUtil.success(student));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

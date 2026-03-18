import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../../service';
import { ResponseUtil } from '../../utils/response';
import { loginSchema, changePwdSchema } from '../../utils/validator';
import Joi from 'joi';

/**
 * 登录接口
 */
export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    // 参数校验
    const { error } = loginSchema.validate(body);
    if (error) {
      return reply.status(400).send(ResponseUtil.error(error.details[0].message));
    }

    // 调用服务
    const userInfo = await AuthService.login(body.username, body.password);

    // 生成 token
    const token = request.server.jwt.sign(
      { userId: userInfo.id, role: userInfo.role },
      { expiresIn: '7d' }
    );

    return reply.send(ResponseUtil.success({ token, userInfo }));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 修改密码
 */
export const changePwd = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;
    const userId = request.userId!;

    // 参数校验
    const { error } = changePwdSchema.validate(body);
    if (error) {
      return reply.status(400).send(ResponseUtil.error(error.details[0].message));
    }

    // 调用服务
    await AuthService.changePwd(userId, body.oldPwd, body.newPwd);

    return reply.send(ResponseUtil.success(null, '密码修改成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 退出登录
 */
export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  // JWT 是无状态的，前端清除 token 即可
  return reply.send(ResponseUtil.success(null, '退出成功'));
};

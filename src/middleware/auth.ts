import { FastifyRequest, FastifyReply } from 'fastify';
import { ResponseUtil } from '../utils/response';

// 扩展 Fastify 类型定义
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userRole?: string;
  }
}

/**
 * JWT 鉴权中间件
 */
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 从请求头获取 token
    const authorization = request.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return reply.status(401).send(ResponseUtil.unauthorized());
    }

    const token = authorization.replace('Bearer ', '');

    // 验证 token
    const decoded = await request.server.jwt.verify(token) as { userId: string; role: string };
    
    // 将用户信息挂载到 request 对象
    request.userId = decoded.userId;
    request.userRole = decoded.role;
  } catch (error) {
    return reply.status(401).send(ResponseUtil.unauthorized('登录已过期，请重新登录'));
  }
};

/**
 * 角色权限中间件
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userRole || !allowedRoles.includes(request.userRole)) {
      return reply.status(403).send(ResponseUtil.forbidden());
    }
  };
};

// 统一响应格式工具类
export class ResponseUtil {
  /**
   * 成功响应
   */
  static success(data: any = null, msg: string = '操作成功') {
    return {
      code: 200,
      msg,
      data,
    };
  }

  /**
   * 参数错误
   */
  static error(msg: string = '参数错误', code: number = 400) {
    return {
      code,
      msg,
      data: null,
    };
  }

  /**
   * 未登录
   */
  static unauthorized(msg: string = '未登录或登录已过期') {
    return {
      code: 401,
      msg,
      data: null,
    };
  }

  /**
   * 无权限
   */
  static forbidden(msg: string = '无权限访问') {
    return {
      code: 403,
      msg,
      data: null,
    };
  }

  /**
   * 服务器异常
   */
  static serverError(msg: string = '服务器异常') {
    return {
      code: 500,
      msg,
      data: null,
    };
  }
}

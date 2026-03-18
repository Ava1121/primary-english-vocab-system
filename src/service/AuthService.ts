import User, { IUser } from '../model/User';
import { hashPassword, comparePassword } from '../utils/crypto';

export class AuthService {
  /**
   * 用户登录
   */
  static async login(username: string, password: string) {
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 检查账号状态
    if (user.status === 0) {
      throw new Error('账号已被禁用，请联系管理员');
    }

    // 验证密码
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('用户名或密码错误');
    }

    // 返回用户信息（不包含密码）
    return {
      id: user._id,
      username: user.username,
      realName: user.realName,
      role: user.role,
    };
  }

  /**
   * 修改密码
   */
  static async changePwd(userId: string, oldPwd: string, newPwd: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isMatch = await comparePassword(oldPwd, user.password);
    if (!isMatch) {
      throw new Error('旧密码错误');
    }

    // 更新密码
    user.password = await hashPassword(newPwd);
    await user.save();

    return true;
  }

  /**
   * 根据ID获取用户信息
   */
  static async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }
}

import User, { IUser } from '../model/User';
import Student from '../model/Student';
import Lesson from '../model/Lesson';
import { hashPassword, comparePassword } from '../utils/crypto';

export class TeacherService {
  /**
   * 获取老师列表（分页）
   */
  static async getTeacherList(page: number = 1, size: number = 10, keyword?: string) {
    const query: any = { role: 'teacher' };

    // 关键词搜索
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { realName: { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const list = await User.find(query)
      .select('-password')
      .skip((page - 1) * size)
      .limit(size)
      .sort({ createTime: -1 });

    return {
      list,
      total,
      page,
      size,
    };
  }

  /**
   * 新增老师
   */
  static async addTeacher(username: string, password: string, realName: string) {
    // 检查用户名是否已存在
    const exist = await User.findOne({ username });
    if (exist) {
      throw new Error('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    const teacher = new User({
      username,
      password: hashedPassword,
      realName,
      role: 'teacher',
      status: 1,
    });
    await teacher.save();

    return {
      id: teacher._id,
      username: teacher.username,
      realName: teacher.realName,
      status: teacher.status,
    };
  }

  /**
   * 编辑老师
   */
  static async editTeacher(id: string, realName: string) {
    const teacher = await User.findByIdAndUpdate(id, { realName }, { new: true });
    if (!teacher) {
      throw new Error('老师不存在');
    }
    return teacher;
  }

  /**
   * 更新老师状态
   */
  static async updateStatus(id: string, status: number) {
    const teacher = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!teacher) {
      throw new Error('老师不存在');
    }
    return teacher;
  }

  /**
   * 获取老师名下学生
   */
  static async getTeacherStudents(teacherId: string) {
    const students = await Student.find({ teacherId }).sort({ createTime: -1 });
    return students;
  }

  /**
   * 获取老师总数
   */
  static async getTeacherCount() {
    return await User.countDocuments({ role: 'teacher' });
  }

  /**
   * 获取老师控制台数据
   */
  static async getTeacherDashboard(teacherId: string) {
    // 我的学生数
    const studentCount = await Student.countDocuments({ teacherId });

    // 今日课时数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayLessonCount = await Lesson.countDocuments({
      teacherId,
      studyTime: { $gte: today, $lte: todayEnd },
    });

    // 学生整体掌握率
    const lessons = await Lesson.find({ teacherId });
    let totalMasterRate = 0;
    if (lessons.length > 0) {
      totalMasterRate = lessons.reduce((sum, lesson) => sum + lesson.masterRate, 0) / lessons.length;
    }

    return {
      studentCount,
      todayLessonCount,
      avgMasterRate: totalMasterRate.toFixed(1),
    };
  }
}

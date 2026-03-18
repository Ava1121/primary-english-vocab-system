import Student, { IStudent } from '../model/Student';
import User from '../model/User';
import Lesson from '../model/Lesson';
import WeakWord from '../model/WeakWord';
import Dictation from '../model/Dictation';
import { hashPassword } from '../utils/crypto';

export class StudentService {
  /**
   * 获取学生列表（分页）
   */
  static async getStudentList(teacherId: string, page: number = 1, size: number = 10, keyword?: string) {
    const query: any = { teacherId };

    // 关键词搜索
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await Student.countDocuments(query);
    const list = await Student.find(query)
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
   * 新增学生
   */
  static async addStudent(teacherId: string, username: string, password: string, name: string, grade: number) {
    // 检查用户名是否已存在
    const exist = await Student.findOne({ username });
    if (exist) {
      throw new Error('学生账号已存在');
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    const student = new Student({
      username,
      password: hashedPassword,
      name,
      grade,
      teacherId,
    });
    await student.save();

    return {
      id: student._id,
      username: student.username,
      name: student.name,
      grade: student.grade,
    };
  }

  /**
   * 编辑学生
   */
  static async editStudent(id: string, name: string, grade: number) {
    const student = await Student.findByIdAndUpdate(id, { name, grade }, { new: true });
    if (!student) {
      throw new Error('学生不存在');
    }
    return student;
  }

  /**
   * 删除学生
   */
  static async deleteStudent(id: string) {
    // 删除学生相关的所有数据
    await Lesson.deleteMany({ studentId: id });
    await WeakWord.deleteMany({ studentId: id });
    await Dictation.deleteMany({ studentId: id });
    await Student.findByIdAndDelete(id);
    return true;
  }

  /**
   * 获取学生详情
   */
  static async getStudentDetail(id: string) {
    const student = await Student.findById(id).select('-password');
    if (!student) {
      throw new Error('学生不存在');
    }
    return student;
  }

  /**
   * 获取学生总数
   */
  static async getStudentCount() {
    return await Student.countDocuments();
  }

  /**
   * 根据老师ID统计学生数
   */
  static async getStudentCountByTeacher(teacherId: string) {
    return await Student.countDocuments({ teacherId });
  }

  /**
   * 验证学生是否属于该老师
   */
  static async checkStudentBelongsToTeacher(studentId: string, teacherId: string) {
    const student = await Student.findOne({ _id: studentId, teacherId });
    return !!student;
  }
}

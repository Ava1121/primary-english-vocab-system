import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import path from 'path';
import { connectDB } from './config/db';
import { JWT_SECRET } from './config/jwt';
import { authMiddleware, roleMiddleware } from './middleware/auth';
import * as publicAuth from './controller/public/auth';
import * as adminDashboard from './controller/admin/dashboard';
import * as adminWords from './controller/admin/words';
import * as adminTeachers from './controller/admin/teachers';
import * as adminBooks from './controller/admin/books';
import * as teacherDashboard from './controller/teacher/dashboard';
import * as teacherStudents from './controller/teacher/students';
import * as teacherLessons from './controller/teacher/lessons';
import * as teacherTeach from './controller/teacher/teach';
import * as teacherWeak from './controller/teacher/weak';
import * as teacherDictation from './controller/teacher/dictation';
import * as teacherStatistics from './controller/teacher/statistics';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
});

// 注册插件
fastify.register(cors, {
  origin: true,
  credentials: true,
});

fastify.register(jwt, {
  secret: JWT_SECRET,
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 静态文件服务（前端页面）
fastify.register(staticPlugin, {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

// ==================== 公共接口 ====================

// 登录
fastify.post('/api/login', publicAuth.login);

// ==================== 管理员接口 ====================

// 控制台
fastify.get(
  '/api/admin/dashboard',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminDashboard.dashboard
);

// 单词管理
fastify.get(
  '/api/admin/words/list',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminWords.list
);
fastify.post(
  '/api/admin/words/add',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminWords.add
);
fastify.put(
  '/api/admin/words/edit',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminWords.edit
);
fastify.delete(
  '/api/admin/words/del',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminWords.del
);
fastify.post(
  '/api/admin/words/import',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminWords.importWords
);

// 老师管理
fastify.get(
  '/api/admin/teachers/list',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminTeachers.list
);
fastify.post(
  '/api/admin/teachers/add',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminTeachers.add
);
fastify.put(
  '/api/admin/teachers/edit',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminTeachers.edit
);
fastify.put(
  '/api/admin/teachers/status',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminTeachers.status
);
fastify.post(
  '/api/admin/teachers/del',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminTeachers.del
);
fastify.get(
  '/api/admin/teachers/students',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminTeachers.students
);

// 词书管理
fastify.get(
  '/api/admin/books/list',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.list
);
fastify.get(
  '/api/admin/books/all',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.allBooks
);
fastify.get(
  '/api/admin/books/detail',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.detail
);
fastify.post(
  '/api/admin/books/add',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.add
);
fastify.put(
  '/api/admin/books/edit',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.edit
);
fastify.delete(
  '/api/admin/books/del',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.del
);
fastify.get(
  '/api/admin/books/words',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.words
);
fastify.post(
  '/api/admin/books/words/add',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.addWord
);
fastify.post(
  '/api/admin/books/words/import',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.importWords
);
fastify.put(
  '/api/admin/books/words/edit',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.editWord
);
fastify.delete(
  '/api/admin/books/words/del',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  adminBooks.deleteWord
);

// 管理员个人中心
fastify.put(
  '/api/admin/profile/pwd',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  publicAuth.changePwd
);
fastify.post(
  '/api/admin/logout',
  { preHandler: [authMiddleware, roleMiddleware(['admin'])] },
  publicAuth.logout
);

// ==================== 老师接口 ====================

// 控制台
fastify.get(
  '/api/teacher/dashboard',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherDashboard.dashboard
);

// 学生管理
fastify.get(
  '/api/teacher/students/list',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStudents.list
);
fastify.post(
  '/api/teacher/students/add',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStudents.add
);
fastify.put(
  '/api/teacher/students/edit',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStudents.edit
);
fastify.delete(
  '/api/teacher/students/del',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStudents.del
);
fastify.get(
  '/api/teacher/students/detail',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStudents.detail
);

// 课时管理
fastify.get(
  '/api/teacher/lessons/list',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherLessons.list
);
fastify.get(
  '/api/teacher/lessons/detail',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherLessons.detail
);
fastify.post(
  '/api/teacher/lessons/reteach',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherLessons.reteach
);

// 单词教学
fastify.get(
  '/api/teacher/teach/words',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherTeach.words
);
fastify.get(
  '/api/teacher/teach/newWords',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherTeach.newWords
);
fastify.get(
  '/api/teacher/teach/weakWords',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherTeach.weakWords
);
fastify.post(
  '/api/teacher/teach/mark',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherTeach.mark
);
fastify.post(
  '/api/teacher/teach/finish',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherTeach.finish
);

// 不熟悉单词库
fastify.get(
  '/api/teacher/weak/list',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherWeak.list
);
fastify.post(
  '/api/teacher/weak/reteach',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherWeak.reteach
);
fastify.delete(
  '/api/teacher/weak/clear',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherWeak.clear
);

// 默写练习
fastify.get(
  '/api/teacher/dictation/words',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherDictation.words
);
fastify.post(
  '/api/teacher/dictation/submit',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherDictation.submit
);
fastify.get(
  '/api/teacher/dictation/list',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherDictation.list
);

// 学习统计
fastify.get(
  '/api/teacher/statistics/overview',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStatistics.overview
);
fastify.get(
  '/api/teacher/statistics/grade',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStatistics.grade
);
fastify.get(
  '/api/teacher/statistics/wrong',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  teacherStatistics.wrong
);

// 老师个人中心
fastify.put(
  '/api/teacher/profile/pwd',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  publicAuth.changePwd
);
fastify.post(
  '/api/teacher/logout',
  { preHandler: [authMiddleware, roleMiddleware(['teacher'])] },
  publicAuth.logout
);

// ==================== 启动服务 ====================

// 健康检查接口
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    // 尝试连接数据库（不阻塞服务启动）
    await connectDB();

    // 监听端口
    await fastify.listen({ port: 5000, host: '0.0.0.0' });
    console.log('🚀 服务启动成功，访问地址: http://localhost:5000');
    console.log('📖 API 文档: 查看 src/app.ts 了解所有接口');
    console.log('👤 默认管理员账号: admin / Admin123!');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

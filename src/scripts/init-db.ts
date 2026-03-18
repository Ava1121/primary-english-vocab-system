import mongoose from 'mongoose';
import User from '../model/User';
import Word from '../model/Word';
import { hashPassword } from '../utils/crypto';

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/vocab_memory_system';

// 初始化管理员账号
async function initAdmin() {
  const existAdmin = await User.findOne({ username: 'admin' });
  if (!existAdmin) {
    const hashedPassword = await hashPassword('Admin123!');
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      role: 'admin',
      status: 1,
    });
    await admin.save();
    console.log('✅ 初始管理员账号创建成功: admin / Admin123!');
  } else {
    console.log('ℹ️  管理员账号已存在');
  }
}

// 初始化示例单词
async function initWords() {
  const wordCount = await Word.countDocuments();
  if (wordCount > 0) {
    console.log(`ℹ️  单词库已存在，共 ${wordCount} 个单词`);
    return;
  }

  // 各年级示例单词
  const sampleWords = [
    // 一年级
    { en: 'apple', cn: '苹果', grade: 1 },
    { en: 'banana', cn: '香蕉', grade: 1 },
    { en: 'cat', cn: '猫', grade: 1 },
    { en: 'dog', cn: '狗', grade: 1 },
    { en: 'egg', cn: '鸡蛋', grade: 1 },
    { en: 'fish', cn: '鱼', grade: 1 },
    { en: 'girl', cn: '女孩', grade: 1 },
    { en: 'hat', cn: '帽子', grade: 1 },
    { en: 'ice', cn: '冰', grade: 1 },
    { en: 'juice', cn: '果汁', grade: 1 },
    
    // 二年级
    { en: 'kite', cn: '风筝', grade: 2 },
    { en: 'lion', cn: '狮子', grade: 2 },
    { en: 'monkey', cn: '猴子', grade: 2 },
    { en: 'nose', cn: '鼻子', grade: 2 },
    { en: 'orange', cn: '橙子', grade: 2 },
    { en: 'pig', cn: '猪', grade: 2 },
    { en: 'queen', cn: '女王', grade: 2 },
    { en: 'rabbit', cn: '兔子', grade: 2 },
    { en: 'sun', cn: '太阳', grade: 2 },
    { en: 'tiger', cn: '老虎', grade: 2 },
    
    // 三年级
    { en: 'umbrella', cn: '雨伞', grade: 3 },
    { en: 'violin', cn: '小提琴', grade: 3 },
    { en: 'window', cn: '窗户', grade: 3 },
    { en: 'xylophone', cn: '木琴', grade: 3 },
    { en: 'yellow', cn: '黄色', grade: 3 },
    { en: 'zero', cn: '零', grade: 3 },
    { en: 'book', cn: '书', grade: 3 },
    { en: 'chair', cn: '椅子', grade: 3 },
    { en: 'desk', cn: '桌子', grade: 3 },
    { en: 'eraser', cn: '橡皮', grade: 3 },
    
    // 四年级
    { en: 'family', cn: '家庭', grade: 4 },
    { en: 'garden', cn: '花园', grade: 4 },
    { en: 'happy', cn: '高兴的', grade: 4 },
    { en: 'island', cn: '岛屿', grade: 4 },
    { en: 'jump', cn: '跳', grade: 4 },
    { en: 'kitchen', cn: '厨房', grade: 4 },
    { en: 'library', cn: '图书馆', grade: 4 },
    { en: 'mountain', cn: '山', grade: 4 },
    { en: 'notebook', cn: '笔记本', grade: 4 },
    { en: 'ocean', cn: '海洋', grade: 4 },
    
    // 五年级
    { en: 'patient', cn: '耐心的', grade: 5 },
    { en: 'question', cn: '问题', grade: 5 },
    { en: 'restaurant', cn: '餐厅', grade: 5 },
    { en: 'student', cn: '学生', grade: 5 },
    { en: 'teacher', cn: '老师', grade: 5 },
    { en: 'university', cn: '大学', grade: 5 },
    { en: 'village', cn: '村庄', grade: 5 },
    { en: 'weather', cn: '天气', grade: 5 },
    { en: 'exercise', cn: '练习', grade: 5 },
    { en: 'yesterday', cn: '昨天', grade: 5 },
    
    // 六年级
    { en: 'adventure', cn: '冒险', grade: 6 },
    { en: 'beautiful', cn: '美丽的', grade: 6 },
    { en: 'celebrate', cn: '庆祝', grade: 6 },
    { en: 'dangerous', cn: '危险的', grade: 6 },
    { en: 'environment', cn: '环境', grade: 6 },
    { en: 'fantastic', cn: '极好的', grade: 6 },
    { en: 'government', cn: '政府', grade: 6 },
    { en: 'happiness', cn: '幸福', grade: 6 },
    { en: 'important', cn: '重要的', grade: 6 },
    { en: 'knowledge', cn: '知识', grade: 6 },
  ];

  await Word.insertMany(sampleWords);
  console.log(`✅ 初始单词库创建成功，共 ${sampleWords.length} 个示例单词`);
}

// 主函数
async function main() {
  try {
    await mongoose.connect(DB_URI);
    console.log('📦 数据库连接成功');
    
    await initAdmin();
    await initWords();
    
    await mongoose.disconnect();
    console.log('🎉 初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

main();

# 小学英语单词教学管理系统

一个完整的小学英语单词教学管理系统，支持管理员和老师两种角色，提供单词管理、学生管理、教学记录、默写练习、学习统计等功能。

## 技术栈

- **后端**: Node.js + TypeScript + Fastify + MongoDB + Mongoose
- **前端**: 原生 HTML/CSS/JavaScript
- **认证**: JWT (JSON Web Token)
- **加密**: bcryptjs

## 功能模块

### 管理员端
- 📊 数据统计：总单词数、各年级单词数、老师/学生总数、全平台掌握率
- 📚 单词管理：增删改查、批量导入
- 👨‍🏫 老师管理：账号管理、启停控制、查看学生
- ⚙️ 个人中心：修改密码

### 老师端
- 📊 数据概览：学生数、今日课时、平均掌握率
- 👥 学生管理：增删改查
- 📚 单词教学：分年级教学、标记掌握/未掌握、自动生成课时记录
- 📝 课时记录：查看历史、详情、一键重教
- ❌ 薄弱单词库：查看薄弱单词、一键重教、清空
- ✍️ 默写练习：随机出题、自动判分、错题记录
- 📈 学习统计：概览、分年级掌握率、高频错题
- ⚙️ 个人中心：修改密码

## 数据库设计

### 核心集合
1. **users** - 用户集合（管理员、老师）
2. **words** - 单词集合（1-6年级单词）
3. **students** - 学生集合
4. **lessons** - 课时记录集合
5. **weakWords** - 薄弱单词库集合
6. **dictations** - 默写记录集合

## 快速开始

### 1. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 2. 启动 MongoDB

确保 MongoDB 已安装并运行在默认端口 27017（无密码模式）。

**macOS (Homebrew)**:
\`\`\`bash
brew services start mongodb-community
\`\`\`

**Linux**:
\`\`\`bash
sudo systemctl start mongod
\`\`\`

**Windows**:
\`\`\`bash
net start MongoDB
\`\`\`

### 3. 初始化数据库

首次运行需要初始化数据库，创建管理员账号和示例单词：

\`\`\`bash
pnpm ts-node src/scripts/init-db.ts
\`\`\`

这将创建：
- 管理员账号: `admin` / `Admin123!`
- 60 个示例单词（每个年级 10 个）

### 4. 启动服务

\`\`\`bash
pnpm run dev
\`\`\`

服务启动后访问: http://localhost:5000

### 5. 登录系统

**管理员账号**:
- 用户名: `admin`
- 密码: `Admin123!`

**老师账号**:
- 需要管理员创建

## 项目结构

\`\`\`
├── src/
│   ├── app.ts                 # 应用入口
│   ├── config/                # 配置文件
│   │   ├── db.ts              # 数据库连接
│   │   └── jwt.ts             # JWT 配置
│   ├── controller/            # 控制器层
│   │   ├── admin/             # 管理员接口
│   │   ├── teacher/           # 老师接口
│   │   └── public/            # 公共接口
│   ├── service/               # 业务逻辑层
│   ├── model/                 # Mongoose 模型
│   ├── middleware/            # 中间件
│   ├── utils/                 # 工具函数
│   └── scripts/               # 脚本
│       └── init-db.ts         # 数据库初始化
├── public/                    # 前端静态文件
│   ├── index.html             # 登录页
│   ├── admin.html             # 管理员端
│   ├── teacher.html           # 老师端
│   ├── css/                   # 样式文件
│   ├── js/                    # JavaScript 文件
│   └── data/                  # 示例数据
├── package.json
├── tsconfig.json
└── .coze                      # Coze CLI 配置

\`\`\`

## API 接口

### 公共接口
- `POST /api/login` - 登录

### 管理员接口
- `GET /api/admin/dashboard` - 控制台数据
- `GET /api/admin/words/list` - 单词列表
- `POST /api/admin/words/add` - 新增单词
- `PUT /api/admin/words/edit` - 编辑单词
- `DELETE /api/admin/words/del` - 删除单词
- `POST /api/admin/words/import` - 批量导入
- `GET /api/admin/teachers/list` - 老师列表
- `POST /api/admin/teachers/add` - 新增老师
- `PUT /api/admin/teachers/edit` - 编辑老师
- `PUT /api/admin/teachers/status` - 更新状态
- `GET /api/admin/teachers/students` - 老师学生
- `PUT /api/admin/profile/pwd` - 修改密码

### 老师接口
- `GET /api/teacher/dashboard` - 控制台数据
- `GET /api/teacher/students/list` - 学生列表
- `POST /api/teacher/students/add` - 新增学生
- `PUT /api/teacher/students/edit` - 编辑学生
- `DELETE /api/teacher/students/del` - 删除学生
- `GET /api/teacher/teach/words` - 年级单词
- `POST /api/teacher/teach/finish` - 完成教学
- `GET /api/teacher/lessons/list` - 课时列表
- `GET /api/teacher/lessons/detail` - 课时详情
- `POST /api/teacher/lessons/reteach` - 一键重教
- `GET /api/teacher/weak/list` - 薄弱单词
- `POST /api/teacher/weak/reteach` - 重教薄弱
- `DELETE /api/teacher/weak/clear` - 清空薄弱库
- `GET /api/teacher/dictation/words` - 默写题目
- `POST /api/teacher/dictation/submit` - 提交默写
- `GET /api/teacher/dictation/list` - 默写记录
- `GET /api/teacher/statistics/overview` - 学习概览
- `GET /api/teacher/statistics/grade` - 年级掌握率
- `GET /api/teacher/statistics/wrong` - 高频错题
- `PUT /api/teacher/profile/pwd` - 修改密码

## 单词发音

单词发音使用浏览器原生 Web Speech API 实现，无需后端存储音频文件。

\`\`\`javascript
// 发音示例
const utterance = new SpeechSynthesisUtterance('apple');
utterance.lang = 'en-US'; // 美式发音
window.speechSynthesis.speak(utterance);
\`\`\`

## 批量导入单词

JSON 格式示例（每个单词包含 en、cn、grade 字段）：

\`\`\`json
[
  { "en": "apple", "cn": "苹果", "grade": 1 },
  { "en": "banana", "cn": "香蕉", "grade": 1 }
]
\`\`\`

## 环境变量

可以通过环境变量配置数据库连接：

\`\`\`bash
DB_HOST=localhost     # 数据库主机，默认 localhost
DB_PORT=27017         # 数据库端口，默认 27017
DB_NAME=vocab_memory_system  # 数据库名
JWT_SECRET=your_secret_key   # JWT 密钥
\`\`\`

## 开发命令

\`\`\`bash
# 开发模式
pnpm run dev

# 编译
pnpm run build

# 生产模式
pnpm run start

# 初始化数据库
ts-node src/scripts/init-db.ts
\`\`\`

## 注意事项

1. MongoDB 需要以无密码模式运行
2. 密码必须至少 6 位，包含字母和数字
3. 老师只能管理自己名下的学生
4. 默写判分大小写不敏感
5. 掌握率保留 1 位小数

## License

MIT

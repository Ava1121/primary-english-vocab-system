import mongoose from 'mongoose';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '27017';
const DB_NAME = process.env.DB_NAME || 'vocab_memory_system';

const DB_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

let isDBConnected = false;

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(DB_URI);
    isDBConnected = true;
    console.log(`✅ MongoDB 连接成功: ${DB_URI}`);
  } catch (error) {
    isDBConnected = false;
    console.error('❌ MongoDB 连接失败:', error);
    console.log('⚠️  服务将在无数据库模式下运行，部分功能不可用');
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const checkDBConnection = (): boolean => {
  return isDBConnected;
};

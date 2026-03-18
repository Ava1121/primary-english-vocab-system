import { FastifyRequest, FastifyReply } from 'fastify';
import { WordService } from '../../service';
import { ResponseUtil } from '../../utils/response';
import { wordSchema } from '../../utils/validator';
import { MultipartFile } from '@fastify/multipart';

/**
 * 单词列表
 */
export const list = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const page = parseInt(query.page) || 1;
    const size = parseInt(query.size) || 10;
    const grade = query.grade ? parseInt(query.grade) : undefined;
    const keyword = query.keyword || '';

    const data = await WordService.getWordList(page, size, grade, keyword);
    return reply.send(ResponseUtil.success(data));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

/**
 * 新增单词
 */
export const add = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    // 参数校验
    const { error } = wordSchema.validate(body);
    if (error) {
      return reply.status(400).send(ResponseUtil.error(error.details[0].message));
    }

    const word = await WordService.addWord(body.en, body.cn, body.grade);
    return reply.send(ResponseUtil.success(word, '添加成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 编辑单词
 */
export const edit = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.id) {
      return reply.status(400).send(ResponseUtil.error('单词ID不能为空'));
    }

    // 参数校验
    const { error } = wordSchema.validate({ en: body.en, cn: body.cn, grade: body.grade });
    if (error) {
      return reply.status(400).send(ResponseUtil.error(error.details[0].message));
    }

    const word = await WordService.editWord(body.id, body.en, body.cn, body.grade);
    return reply.send(ResponseUtil.success(word, '编辑成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 删除单词
 */
export const del = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;

    if (!query.id) {
      return reply.status(400).send(ResponseUtil.error('单词ID不能为空'));
    }

    await WordService.deleteWord(query.id);
    return reply.send(ResponseUtil.success(null, '删除成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 批量导入单词
 */
export const importWords = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send(ResponseUtil.error('请上传文件'));
    }

    // 读取文件内容
    const buffer = await data.toBuffer();
    const content = buffer.toString('utf-8');
    
    // 解析 JSON
    let words;
    try {
      words = JSON.parse(content);
    } catch (e) {
      return reply.status(400).send(ResponseUtil.error('文件格式错误，请上传 JSON 格式文件'));
    }

    if (!Array.isArray(words)) {
      return reply.status(400).send(ResponseUtil.error('文件格式错误，JSON 必须是数组格式'));
    }

    // 调用服务导入
    const result = await WordService.importWords(words);
    return reply.send(ResponseUtil.success(result));
  } catch (error: any) {
    return reply.status(500).send(ResponseUtil.serverError(error.message));
  }
};

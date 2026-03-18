import { FastifyRequest, FastifyReply } from 'fastify';
import { BookService } from '../../service';
import { ResponseUtil } from '../../utils/response';

/**
 * 获取词书列表
 */
export const list = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const page = parseInt(query.page) || 1;
    const size = parseInt(query.size) || 10;
    const grade = query.grade ? parseInt(query.grade) : undefined;
    const keyword = query.keyword || '';

    const result = await BookService.getBookList(page, size, grade, keyword);
    return reply.send(ResponseUtil.success(result));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 获取所有词书（不分页）
 */
export const allBooks = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const list = await BookService.getAllBooks();
    return reply.send(ResponseUtil.success(list));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 获取词书详情
 */
export const detail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const { id } = query;

    if (!id) {
      return reply.status(400).send(ResponseUtil.error('缺少词书ID'));
    }

    const book = await BookService.getBookDetail(id);
    return reply.send(ResponseUtil.success(book));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 新增词书
 */
export const add = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.name || !body.grade || !body.semester || !body.publisher) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    const book = await BookService.addBook(
      body.name,
      body.grade,
      body.semester,
      body.publisher,
      body.description
    );

    return reply.send(ResponseUtil.success(book, '词书创建成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 编辑词书
 */
export const edit = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.id || !body.name || !body.grade || !body.semester || !body.publisher) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    const book = await BookService.editBook(
      body.id,
      body.name,
      body.grade,
      body.semester,
      body.publisher,
      body.description
    );

    return reply.send(ResponseUtil.success(book, '词书更新成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 删除词书
 */
export const del = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.id) {
      return reply.status(400).send(ResponseUtil.error('缺少词书ID'));
    }

    await BookService.deleteBook(body.id);
    return reply.send(ResponseUtil.success(null, '词书删除成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 获取词书中的单词列表
 */
export const words = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const { bookId } = query;
    const page = parseInt(query.page) || 1;
    const size = parseInt(query.size) || 20;

    if (!bookId) {
      return reply.status(400).send(ResponseUtil.error('缺少词书ID'));
    }

    const result = await BookService.getBookWords(bookId, page, size);
    return reply.send(ResponseUtil.success(result));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 批量导入单词到词书
 */
export const importWords = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.bookId || !body.words || !Array.isArray(body.words)) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    const result = await BookService.importWords(body.bookId, body.words);
    return reply.send(ResponseUtil.success(result, result.msg));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 添加单词到词书
 */
export const addWord = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.bookId || !body.en || !body.cn) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    const word = await BookService.addWord(body.bookId, body.en, body.cn, body.phonetic);
    return reply.send(ResponseUtil.success(word, '单词添加成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 编辑词书中的单词
 */
export const editWord = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.id || !body.en || !body.cn) {
      return reply.status(400).send(ResponseUtil.error('参数不完整'));
    }

    const word = await BookService.editWord(body.id, body.en, body.cn, body.phonetic);
    return reply.send(ResponseUtil.success(word, '单词更新成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

/**
 * 删除词书中的单词
 */
export const deleteWord = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body.id) {
      return reply.status(400).send(ResponseUtil.error('缺少单词ID'));
    }

    await BookService.deleteWord(body.id);
    return reply.send(ResponseUtil.success(null, '单词删除成功'));
  } catch (error: any) {
    return reply.status(400).send(ResponseUtil.error(error.message));
  }
};

import Joi from 'joi';

/**
 * 登录参数校验
 */
export const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(20).messages({
    'string.empty': '用户名不能为空',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多20个字符',
    'any.required': '用户名是必填项',
  }),
  password: Joi.string()
    .required()
    .min(6)
    .max(20)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
    .messages({
      'string.empty': '密码不能为空',
      'string.min': '密码至少6个字符',
      'string.max': '密码最多20个字符',
      'string.pattern.base': '密码必须包含字母和数字',
      'any.required': '密码是必填项',
    }),
});

/**
 * 单词参数校验
 */
export const wordSchema = Joi.object({
  en: Joi.string().required().min(1).max(100).messages({
    'string.empty': '英文单词不能为空',
    'any.required': '英文单词是必填项',
  }),
  cn: Joi.string().required().min(1).max(100).messages({
    'string.empty': '中文释义不能为空',
    'any.required': '中文释义是必填项',
  }),
  grade: Joi.number().required().min(1).max(6).messages({
    'number.base': '年级必须是数字',
    'number.min': '年级最小为1',
    'number.max': '年级最大为6',
    'any.required': '年级是必填项',
  }),
});

/**
 * 学生参数校验
 */
export const studentSchema = Joi.object({
  username: Joi.string().required().min(3).max(20).messages({
    'string.empty': '学生账号不能为空',
    'any.required': '学生账号是必填项',
  }),
  password: Joi.string().required().min(6).max(20).messages({
    'string.empty': '密码不能为空',
    'any.required': '密码是必填项',
  }),
  name: Joi.string().required().min(1).max(50).messages({
    'string.empty': '学生姓名不能为空',
    'any.required': '学生姓名是必填项',
  }),
  grade: Joi.number().required().min(1).max(6).messages({
    'number.base': '年级必须是数字',
    'any.required': '年级是必填项',
  }),
});

/**
 * 老师参数校验
 */
export const teacherSchema = Joi.object({
  username: Joi.string().required().min(3).max(20).messages({
    'string.empty': '老师账号不能为空',
    'any.required': '老师账号是必填项',
  }),
  password: Joi.string().required().min(6).max(20).messages({
    'string.empty': '密码不能为空',
    'any.required': '密码是必填项',
  }),
  realName: Joi.string().required().min(1).max(50).messages({
    'string.empty': '老师姓名不能为空',
    'any.required': '老师姓名是必填项',
  }),
});

/**
 * 修改密码校验
 */
export const changePwdSchema = Joi.object({
  oldPwd: Joi.string().required().messages({
    'string.empty': '旧密码不能为空',
    'any.required': '旧密码是必填项',
  }),
  newPwd: Joi.string()
    .required()
    .min(6)
    .max(20)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
    .messages({
      'string.empty': '新密码不能为空',
      'string.min': '新密码至少6个字符',
      'string.pattern.base': '新密码必须包含字母和数字',
      'any.required': '新密码是必填项',
    }),
});

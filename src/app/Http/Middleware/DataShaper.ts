import type { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash-es';

export const dataShaper = (req: Request, res: Response, next: NextFunction) => {
  // 获取前端请求的字段，例如：?fields=id,name,permissions
  const fieldsParam = req.query.fields as string;

  if (!fieldsParam) {
    return next();
  }

  // 将字符串转换为数组
  const requestedFields = fieldsParam.split(',').map(f => f.trim());

  // 拦截重写 res.json
  const originalJson = res.json;

  res.json = function (data: any): Response {
    if (data && typeof data === 'object') {
      // 如果是数组（列表接口），对每一项进行裁剪
      if (Array.isArray(data)) {
        data = data.map(item => _.pick(item, requestedFields));
      }
      // 如果是分页对象（Laravel 常见格式：{ data: [...], meta: {} }）
      else if (data.data && Array.isArray(data.data)) {
        data.data = data.data.map((item: any) => _.pick(item, requestedFields));
      }
      // 如果是单条数据
      else {
        data = _.pick(data, requestedFields);
      }
    }
    return originalJson.call(this, data);
  };

  next();
};
import ValidatorJs from 'validatorjs';
import { container } from '#bootstrap/app';

// 配置中文错误提示 (可选)
// ValidatorJs.useLang('zh');

/**
 * 扩展异步规则: unique:table,column,ignoreId
 */
ValidatorJs.registerAsync('unique', async (value, attribute, _req, passes) => {
  const [table, column, ignoreId] = attribute.split(',');
  const query = container.db(table).where(column, value);

  if (ignoreId) {
    query.whereNot('id', ignoreId);
  }

  const row = await query.first();
  if (row) {
    passes(false, `${column} 已存在`);
  } else {
    passes(true);
  }
}, '该字段必须唯一');

/**
 * 扩展异步规则: exists:table,column
 */
ValidatorJs.registerAsync('exists', async (value, attribute, _req, passes) => {
  const [table, column] = attribute.split(',');
  const row = await container.db(table).where(column, value).whereNull('deleted_at').first();

  if (!row) {
    passes(false, '选中的项不存在或已被删除');
  } else {
    passes(true);
  }
}, '选中的项无效');

export const makeValidator = (data: any, rules: any, messages?: any) => {
  return new ValidatorJs(data, rules, messages);
};
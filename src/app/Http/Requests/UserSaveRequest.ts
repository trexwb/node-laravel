import Validator from 'validatorjs';
import { BaseRequest } from '#app/Http/Requests/BaseRequest';
import { UsersModel } from '#app/Models/UsersModel';

Validator.registerAsync(
  'unique',
  async (value, args, _attribute, passes) => {
    const [column, exceptId] = args.split(',');
    let query = UsersModel.query().where(column, value);
    if (exceptId) {
      query.whereNot('id', exceptId);
    }
    const exists = await query.first();
    exists ? passes(false) : passes();
  },
  '该值已存在'
);

export class UserSaveRequest extends BaseRequest {
  rules() {
    const id = Number(this.input('id', 0));

    return {
      status: 'required|integer|in:0,1',
      email: `required|email|unique:email,${id}`,
      mobile: `required|regex:/^\\+?\\d{7,15}$/|unique:mobile,${id}`,
      nickname: `required|string|max:50|unique:nickname,${id}`,
      uuid: 'sometimes|string|max:255', // sometimes = nullable
      password: 'sometimes|string|max:255',
    };
  }

  messages() {
    return {
      'email.required': '邮箱必须填写',
      'email.email': '邮箱格式不正确',
      'email.unique': '邮箱已被占用',

      'mobile.unique': '手机号已被占用',

      'nickname.unique': '用户名已存在',
    };
  }
}
import Validator from 'validatorjs';
import { BaseRequest } from '#app/Http/Requests/BaseRequest';
import { SecretsModel } from '#app/Models/SecretsModel';

export class SecretSaveRequest extends BaseRequest {
  rules() {
    const id = Number(this.req.body.id || 0);
    const rules: Record<string, any> = {
      status: 'required|integer|in:0,1',
      // email 必须是邮箱格式，并且唯一
      email: `required|email|string|unique:dm_users,email,${id}`,
      // mobile 可空，但如果填写必须符合手机号格式，并且唯一
      mobile: `nullable|string|regex:/^\\+?\\d{7,15}$/|unique:dm_users,mobile,${id}`,
      password: 'nullable|string|max:255',
      uuid: 'nullable|string|max:255',
      nickName: `required|string|max:50|unique:dm_users,nickName,${id}`,
    };
    // 可以通过自定义规则处理唯一性逻辑
    // 比如 validatorjs.registerAsync('unique', ...)
    return rules;
  }

  messages() {
    return {
      'status.required': '状态必须填写',
      'status.integer': '状态必须是整数',
      'status.in': '状态值只能为 0 或 1',
      'email.required': '邮箱必须填写',
      'email.string': '邮箱必须是字符串',
      'nickName.required': '用户名必须填写',
      'nickName.string': '用户名必须是字符串',
      'nickName.max': '用户名最多50个字符',
      // 'nickName.unique': '用户名已存在', // 如果注册了自定义 unique 规则，可用
    };
  }

  async validate() {
    const data = this.req.body;
    const rules = this.rules();
    const messages = this.messages();
    const validator = new Validator(data, rules, messages);
    if (validator.fails()) {
      throw validator.errors.all();
    }
    // 执行唯一性验证
    await this.validateUniqueness(data);
    if (validator.fails()) {
      throw validator.errors.all();
    }
    return data;
  }

  private async validateUniqueness(data: any) {
    const id = Number(data.id || 0);
    const errors: Record<string, string[]> = {};
    // 检查邮箱唯一性
    if (data.email) {
      const emailExists = await this.checkUnique('email', data.email, id);
      if (emailExists) {
        errors.email = ['邮箱已被占用'];
      }
    }
    // 检查手机号唯一性
    if (data.mobile) {
      const mobileExists = await this.checkUnique('mobile', data.mobile, id);
      if (mobileExists) {
        errors.mobile = ['手机号已被占用'];
      }
    }
    // 检查用户名唯一性
    if (data.nickName) {
      const nickNameExists = await this.checkUnique('nickName', data.nickName, id);
      if (nickNameExists) {
        errors.nickName = ['用户名已存在'];
      }
    }
    if (Object.keys(errors).length > 0) {
      throw errors;
    }
  }

  private async checkUnique(column: string, value: string, exceptId: number) {
    let query = SecretsModel.query().where(column, value);
    if (exceptId) {
      query = query.whereNot('id', exceptId);
    }
    const exists = await query.first();
    return !!exists;
  }
}

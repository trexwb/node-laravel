import type { Request } from 'express';
import { makeValidator } from '#utils/Validator';

export abstract class BaseRequest {
  protected req: Request;

  constructor(req: Request) {
    this.req = req;
  }

  // 子类实现具体的规则
  abstract rules(): any;

  // 子类实现自定义错误消息
  messages(): any { return {}; }

  /**
   * 执行验证
   */
  public async validate(): Promise<any> {
    const validator = makeValidator(this.req.body, this.rules(), this.messages());

    const fails = await new Promise((resolve) => {
      validator.checkAsync(() => resolve(false), () => resolve(true));
    });

    if (fails) {
      const firstError = Object.values(validator.errors.all())[0][0];
      throw new Error(`VALIDATION_FAILED:${firstError}`);
    }

    return validator.input; // 返回通过验证的数据
  }
}
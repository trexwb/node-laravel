import type { Request, Response, NextFunction } from 'express';
import { Users } from '#app/Models/Users';
import { ImageService } from '#app/Services/ImageService';
import { UserRegistered } from '#app/Events/UserRegistered';
import * as _ from 'lodash-es';

export class UserController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, password } = req.body;
      const file = (req as any).file; // 假设使用了 multer 中间件处理上传

      // 1. 使用 Model 存储数据
      const userId = await Users.create({
        email,
        name,
        password, // 实际应加密
      });

      // 2. 使用 Service 处理图片 (Sharp)
      let avatarUrl = null;
      if (file) {
        avatarUrl = await ImageService.processAvatar(file.buffer, `${userId}.webp`);
      }

      // 3. 触发 Event (异步解耦，如发邮件)
      const userData = { id: userId, email, name };
      UserRegistered.dispatch(userData);

      // 4. 使用 lodash 过滤返回字段
      res.status(201).json({
        message: 'User created successfully',
        data: _.omit(userData, ['password']),
        avatar: avatarUrl
      });
    } catch (error) {
      // 5. 抛出异常由全局 Exception Handler 捕获
      next(error);
    }
  }
}
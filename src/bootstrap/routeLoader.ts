import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';

/**
 * 自动扫描目录并注册路由
 * @param basePath 扫描的物理路径
 * @param urlPrefix URL 前缀
 */
export async function loadDynamicRoutes(basePath: string, urlPrefix: string = ''): Promise<Router> {
  const router = Router();
  // 递归获取所有 .ts 或 .js 文件 (兼容开发和编译后)
  async function getFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const res = path.resolve(dir, entry.name);
      return entry.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat().filter(file => /\.(ts|js)$/.test(file) && !file.endsWith('.d.ts'));
  }
  const files = await getFiles(basePath);
  for (const file of files) {
    const relativePath = path.relative(basePath, file);
    const pathParsed = path.parse(relativePath);
    // 构造路由路径: 
    // v1/user.ts -> /v1/user
    // v1/index.ts -> /v1/
    const routePath = path.join(
      urlPrefix,
      pathParsed.dir,
      pathParsed.name === 'index' ? '' : pathParsed.name
    ).replace(/\\/g, '/'); // 统一转换 Windows 路径分隔符
    // 动态加载模块
    const module = await import(`file://${file}`);
    const routeHandler = module.default || module;
    if (typeof routeHandler === 'function' || Object.getPrototypeOf(routeHandler) === Router) {
      router.use(`/${routePath}`, routeHandler);
      // console.log(`[Route] Registered: /${routePath}`);
    }
  }

  return router;
}
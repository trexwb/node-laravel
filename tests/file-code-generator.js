#!/usr/bin / env node

/**
 * 文件路径到3位数代码生成器
 * 支持多种输入方式
 * 使用命令 `node file-code-generator.js files.txt`
 */
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

class FileCodeGenerator {
  constructor(options = {}) {
    this.startFrom = options.startFrom || 1;
    this.padding = options.padding || 3;
    this.separator = options.separator || ' | ';
  }

  /**
   * 生成代码映射表
   * @param {string[]} filePaths - 文件路径数组
   * @returns {Array<{code: string, path: string}>} 代码映射数组
   */
  generate(filePaths) {
    return filePaths
      .filter(p => p.trim() !== '')
      .map((p, index) => {
        const codeNum = this.startFrom + index;
        const code = String(codeNum).padStart(this.padding, '0');
        return {
          code,
          path: p.trim()
        };
      });
  }

  /**
   * 格式化为Markdown表格
   * @param {Array<{code: string, path: string}>} mappings
   * @returns {string}
   */
  formatAsMarkdownTable(mappings) {
    if (mappings.length === 0) {
      return '没有数据';
    }

    const rows = [
      '```',
      '|--|--|',
      '| 码 | 文件 |',
      ...mappings.map(m => `| ${m.code} | ${m.path} |`),
      '```'
    ];

    return rows.join('\n');
  }

  /**
   * 格式化为CSV
   * @param {Array<{code: string, path: string}>} mappings
   * @returns {string}
   */
  formatAsCSV(mappings) {
    if (mappings.length === 0) {
      return '';
    }

    const rows = [
      '码,文件',
      ...mappings.map(m => `${m.code},${m.path}`)
    ];

    return rows.join('\n');
  }
}

// CLI接口
async function runCLI() {
  const args = process.argv.slice(2);
  const generator = new FileCodeGenerator();

  if (args.length > 0) {
    const firstArg = args[0];

    if (fs.existsSync(firstArg) && fs.statSync(firstArg).isFile()) {
      const content = fs.readFileSync(firstArg, 'utf8');
      const filePaths = content.split('\n');
      const mappings = generator.generate(filePaths);
      console.log(generator.formatAsMarkdownTable(mappings));
    } else if (firstArg === '-h' || firstArg === '--help') {
      showHelp();
    } else {
      const mappings = generator.generate(args);
      console.log(generator.formatAsMarkdownTable(mappings));
    }
  } else {
    if (process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log('请输入文件路径（每行一个，空行结束）：');

      const filePaths = [];
      rl.on('line', (line) => {
        if (line.trim() === '') {
          const mappings = generator.generate(filePaths);
          console.log('\n生成结果：\n');
          console.log(generator.formatAsMarkdownTable(mappings));
          rl.close();
        } else {
          filePaths.push(line);
        }
      });
    } else {
      const chunks = [];
      process.stdin.on('data', chunk => chunks.push(chunk));
      process.stdin.on('end', () => {
        const input = Buffer.concat(chunks).toString('utf8');
        const filePaths = input.split('\n');
        const mappings = generator.generate(filePaths);
        console.log(generator.formatAsMarkdownTable(mappings));
      });
    }
  }
}

function showHelp() {
  console.log(`
文件路径代码生成器
================

使用方法：
1. 从命令行参数生成：
   node file-code-generator.js "app/Casts/CastBoolean" "app/Casts/CastDate"

2. 从文件读取路径：
   node file-code-generator.js files.txt

3. 从标准输入读取（管道）：
   echo -e "app/Casts/CastBoolean\\napp/Casts/CastDate" | node file-code-generator.js

4. 交互式输入：
   node file-code-generator.js

输出示例：
\`\`\`
|--|--|
| 码 | 文件 |
| 001 | app/Casts/CastBoolean |
| 002 | app/Casts/CastDate |
\`\`\`
`);
}

// ES Module 入口判断
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  runCLI().catch(console.error);
}

export default FileCodeGenerator;
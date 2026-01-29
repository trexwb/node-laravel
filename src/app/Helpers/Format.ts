import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { config } from '#bootstrap/configLoader';

dayjs.extend(utc);
dayjs.extend(timezone);

// 设置默认时区（比如中国）
const TIME_ZONE = config('app.timezone') || 'Asia/Shanghai';
// dayjs.tz.setDefault(TIME_ZONE);

export const nowInTz = (): Date => {
  return dayjs.utc(new Date()).tz(TIME_ZONE).toDate();
};

// 解析任意输入为“目标时区”的 Date
export const parseToTz = (input?: Date | string | number | null): Date => {
  if (!input) return nowInTz();
  if (typeof input === 'string') {
    return dayjs.utc(input).toDate();
  }
  return dayjs.utc(input).tz(TIME_ZONE).toDate();
};

// 将“目标时区的本地时间”转换为 UTC Date（用于存库）
export const tzToUtc = (input?: Date | string | number | null): Date => {
  if (!input) {
    // 当前时刻在 TIME_ZONE 下的 UTC 表示 → 其实就是 now()
    return new Date();
  }
  if (typeof input === 'string') {
    // 字符串是 TIME_ZONE 的本地时间（无时区）
    // 先按 TIME_ZONE 解析，再转 UTC
    return dayjs.tz(input, TIME_ZONE).utc().toDate();
  }
  // input 是 Date 或 number
  // 假设这个 Date 代表的是 TIME_ZONE 的本地时间（比如来自日历选择器）
  // → 需要先格式化为 YYYY-MM-DD HH:mm:ss，再按 TIME_ZONE 解析，最后转 UTC
  const localStr = dayjs(input).format('YYYY-MM-DD HH:mm:ss');
  return dayjs.tz(localStr, TIME_ZONE).utc().toDate();
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
};

export const formatDate = (input: Date | string | null = null, formatString: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs.utc(input || new Date()).tz(TIME_ZONE).format(formatString);
};

export const utcToLocalDate = (input: Date | string | null = null): Date => {
  return dayjs.utc(input || new Date()).tz(TIME_ZONE).toDate();
};

export default dayjs;
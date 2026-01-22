import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { config } from '#bootstrap/configLoader';

dayjs.extend(utc);
dayjs.extend(timezone);

// 设置默认时区（比如中国）
const TIME_ZONE = config('app.timezone');
dayjs.tz.setDefault(TIME_ZONE || 'Asia/Shanghai');

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
};

export const formatDate = (date: Date | string) => {
  return dayjs(date).format('YYYY年MM月DD日 HH:mm');
};

export default dayjs;
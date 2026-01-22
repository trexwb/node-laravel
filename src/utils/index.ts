/**
 * @Author: trexwb
 * @Date: 2024-01-10 08:57:26
 * @LastEditors: ${git_name}
 * @LastEditTime: 2025-07-15 15:07:51
 * @FilePath: /web/server/src/utils/index.ts
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2024 by 杭州大美, All Rights Reserved. 
 */
import dayjs from 'dayjs';

/**
 * RGB颜色对象接口
 */
interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * 日期时间段对象接口
 */
interface DateTimeSlot {
  start: Date;
  end: Date;
}

/**
 * 工具类：常用数据处理工具
 * Utils - v1.0.0 (2021/7/9, 11:07:14 AM)
 * https://github.com/FirstUI/FirstUI | Released under Apache License 2.0
 *
 * 官网地址：https://firstui.cn/
 * 文档地址：https://doc.firstui.cn/
 */
class Utils {
  /**
   * @desc 英文首字母大写：english=>English
   * @param {string}  value 需要处理的英文字符串
   */
  public static titleCase(value: string): string {
    if (value == null || value.length === 0) return value;
    return value.replace(/^[a-z]/, (matchStr: string) => matchStr.toLocaleUpperCase());
  }

  /**
   * 把连续出现多次的字母字符串进行压缩。aaabbbbcccccd=>3a4b5cd
   * @param {string} value 需要压缩的字符串
   * @param {boolean} ignoreCase 是否忽略大小写
   */
  public static compressLetter(value: string, ignoreCase: boolean = false): string {
    if (typeof value !== "string") return value;
    const pattern = new RegExp("([a-zA-Z])\\1+", ignoreCase ? "ig" : "g");
    return value.replace(pattern, (matchStr: string, group_1: string) => {
      return matchStr.length + group_1;
    });
  }

  /**
   * @desc 去左右空格
   * @param {string} value 需要处理的字符串
   */
  public static trim(value: string): string {
    if (typeof value !== 'string') return value;
    return value.replace(/(^\s*)|(\s*$)/g, "");
  }

  /**
   * @desc 去所有空格
   * @param {string} value 需要处理的字符串
   */
  public static trimAll(value: string): string {
    if (typeof value !== 'string') return value;
    return value.replace(/\s+/g, "");
  }

  /**
   * @desc 替换所有相同字符串
   * @param {string} text 需要处理的字符串
   * @param {string} repstr 被替换的字符
   * @param {string} newstr 替换后的字符
   */
  public static replaceAll(text: string, repstr: string, newstr: string): string {
    if (typeof text !== 'string' || typeof repstr !== 'string' || typeof newstr !== 'string') return text;
    return text.replace(new RegExp(repstr, "gm"), newstr);
  }

  /**
   * @desc 格式化手机号码
   * @param {string | number} num 手机号码
   */
  public static numberFormatter(num: string | number): string | number {
    if (typeof num !== 'string' && typeof num !== 'number') return num;
    const strNum = num.toString();
    return strNum.length === 11 ? strNum.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : num;
  }

  /**
   * @desc 金额格式化，保留两位小数
   * @param {string | number} money 金额值
   */
  public static moneyFormatter(money: string | number): string {
    if (typeof money !== 'string' && typeof money !== 'number') return String(money);
    const floatMoney = parseFloat(money.toString());
    if (isNaN(floatMoney)) return '0.00';
    return floatMoney.toFixed(2).toString().split('').reverse().join('').replace(/(\d{3})/g, '$1,').replace(/\,$/, '').split('').reverse().join('');
  }

  /**
   * @desc 日期时间格式化
   * @param date 需要格式化的日期
   * @param format 格式化字符串(y-m-d h:i:s)
   * @param type  date的格式类型：1-日期字符串(2017/12/04 12:12:12) 2-时间戳(1603676514690) 3-日期字符串，无连接符(20171204121212) 4-new Date()时间格式(Thu Oct 01 2020 00:00:00 GMT+0800 (中国标准时间))
   * @param isMs  时间戳精度是否为毫秒，默认为true（当精度为秒时传false），type=2时有效
   */
  public static dateFormatter(date: any, format: string, type: number = 1, isMs: boolean = true): string {
    const formatDate = dayjs(date);
    if (formatDate.isValid()) {
      // 成功解析，转换为Y-m-d H:i:s格式
      return formatDate.format(format);
    } else if (type === 3) {
      return Utils._formatTimeStr(date, format);
    } else {
      return Utils._formatDate(format, date, type, isMs);
    }
  }

  private static _formatDate(formatStr: string, fdate: any, type: number = 1, isMs: boolean): string {
    if (!fdate) return '';
    let fTime: Date;
    let fStr = 'ymdhis';

    if (type === 4) {
      fTime = fdate;
    } else {
      let fdateStr = fdate.toString();
      if (~fdateStr.indexOf('.')) {
        fdateStr = fdateStr.substring(0, fdateStr.indexOf('.'));
      }
      fdateStr = fdateStr.replace('T', ' ').replace(/\-/g, '/');

      if (!formatStr) formatStr = "y-m-d h:i:s";
      if (type === 2 || typeof fdate === 'number') {
        const parsedDate = isMs ? Number(fdateStr) : Number(fdateStr) * 1000;
        fTime = new Date(parsedDate);
      } else {
        fTime = new Date(fdateStr);
      }
    }

    const formatArr = [
      fTime.getFullYear().toString(),
      String(fTime.getMonth() + 1).padStart(2, '0'),
      String(fTime.getDate()).padStart(2, '0'),
      String(fTime.getHours()).padStart(2, '0'),
      String(fTime.getMinutes()).padStart(2, '0'),
      String(fTime.getSeconds()).padStart(2, '0')
    ];

    for (let i = 0; i < formatArr.length; i++) {
      formatStr = formatStr.replace(fStr.charAt(i), formatArr[i]);
    }
    return formatStr;
  }

  /**
   * @desc 格式化时间
   * @param timeStr 时间字符串 20191212162001
   * @param formatStr 需要的格式 如 y-m-d h:i:s | y/m/d h:i:s | y/m/d | y年m月d日 等
   */
  private static _formatTimeStr(timeStr: string, formatStr: string): string {
    if (!timeStr || timeStr.length !== 14) return timeStr;
    const timeArr = timeStr.split('');
    const formatArr = [
      timeArr.slice(0, 4).join(''),
      timeArr.slice(4, 6).join(''),
      timeArr.slice(6, 8).join(''),
      timeArr.slice(8, 10).join(''),
      timeArr.slice(10, 12).join(''),
      timeArr.slice(12, 14).join('')
    ];
    const fStr = 'ymdhis';
    if (!formatStr) formatStr = 'y-m-d h:i:s';
    for (let i = 0; i < formatArr.length; i++) {
      formatStr = formatStr.replace(fStr.charAt(i), formatArr[i]);
    }
    return formatStr;
  }

  /**
   * @desc RGB颜色转十六进制颜色
   * @param r
   * @param g
   * @param b
   */
  public static rgbToHex(r: number, g: number, b: number): string {
    return "#" + Utils._toHex(r) + Utils._toHex(g) + Utils._toHex(b);
  }

  private static _toHex(n: number): string {
    const num = parseInt(n.toString(), 10);
    if (isNaN(num)) return "00";
    const clamped = Math.max(0, Math.min(num, 255));
    return "0123456789ABCDEF".charAt((clamped - clamped % 16) / 16) + "0123456789ABCDEF".charAt(clamped % 16);
  }

  /**
   * @desc 十六进制颜色转RGB颜色
   * @param hex 颜色值 #333 或 #333333
   */
  public static hexToRGB(hex: string): RGBColor | null {
    if (typeof hex !== 'string' || !/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex)) return null;
    const normalizedHex = hex.length === 4 ? '#' + hex.substring(1).repeat(2) : hex;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * @desc 唯一标识，随机数
   * @param n 随机数位数
   */
  public static unique(n: number = 6): string {
    let rnd = (Math.floor(Math.random() * 9) + 1).toString();
    for (let i = 1; i < n; i++) {
      rnd += Math.floor(Math.random() * 10).toString();
    }
    return rnd;
  }

  /**
   * @desc 获取uuid
   */
  public static getUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * @desc 简单数组合并去重
   * @param arr1 数组1
   * @param arr2 数组2 可不传
   */
  public static distinctArray<T>(arr1: T[] = [], arr2: T[] = []): T[] {
    return [...new Set([...arr1, ...arr2])] as T[];
  }

  /**
   * @desc 获取日期时间段
   * @param type 1-今天 2-昨天 3-本周 4-本月 5-本年
   */
  public static getDateTimeSlot(type: number): DateTimeSlot {
    const now = new Date();
    let start = now.toDateString();
    let end = now.toDateString();

    switch (type) {
      case 1:
        start = `${start} 00:00:00`;
        end = `${end} 23:59:59`;
        break;
      case 2:
        now.setTime(now.getTime() - 3600 * 1000 * 24 * 1);
        start = `${now.toDateString()} 00:00:00`;
        end = `${now.toDateString()} 23:59:59`;
        break;
      case 3:
        // 获取星期几,getDay()返回值是 0（周日） 到 6（周六） 之间的一个整数。0||7为7，即weekday的值为1-7
        const weekday = now.getDay() || 7;
        // 往前算（weekday-1）天，年份、月份会自动变化
        now.setDate(now.getDate() - weekday + 1);
        start = `${now.toDateString()} 00:00:00`;
        end = `${end} 23:59:59`;
        break;
      case 4:
        start = `${now.getFullYear()}-${now.getMonth() + 1}-01 00:00:00`;
        end = `${end} 23:59:59`;
        break;
      case 5:
        start = `${now.getFullYear()}-01-01 00:00:00`;
        end = `${end} 23:59:59`;
        break;
      default:
        return {
          start: new Date(start.replace(/\-/g, '/')),
          end: new Date(end.replace(/\-/g, '/'))
        };
    }
    return {
      start: new Date(start.replace(/\-/g, '/')),
      end: new Date(end.replace(/\-/g, '/'))
    };
  }

  /**
   * @desc 日期时间格式化为多久之前 如:1分钟前
   * @param date 需要格式化的日期
   * @param type  date的格式类型：1-日期字符串(2017/12/04 12:12:12) 2-时间戳(1603676514690) 3-日期字符串，无连接符(20171204121212) 4-new Date()时间格式(Thu Oct 01 2020 00:00:00 GMT+0800 (中国标准时间))
   * @param isMs  时间戳精度是否为毫秒，默认为true（当精度为秒时传false），type=2时有效
   * @param suffix 后缀，如：30小时+ 后缀。[刚刚、昨天、前天 等为固定文本，后缀无效]
   * @param endUnit 转化截止单位，1-秒 2-分钟 3-小时 4-天 5-月 6-年，如传3（小时），则天，月，年不做转化直接返回空
   * @param seconds 多少秒之前显示为刚刚，不可超过60
   * @param fixedDay 是否需要天的固定文本，如昨天、前天
   */
  public static formatTimeAgo(
    date: any,
    type: number = 1,
    isMs: boolean = true,
    suffix: string = '前',
    endUnit: number = 6,
    seconds: number = 10,
    fixedDay: boolean = true
  ): string {
    const formatDate = Utils.dateFormatter(date, 'y/m/d h:i:s', type, isMs);
    const beforeStamp = new Date(formatDate).getTime();
    const nowStamp = new Date().getTime();
    let res = '';
    const diff = nowStamp - beforeStamp;

    if (diff > 0) {
      const _minute = 1000 * 60;
      const _hour = _minute * 60;
      const _day = _hour * 24;
      // 不精确
      const _month = _day * 30;
      const _year = _month * 12;
      const year = Math.floor(diff / _year);
      const month = Math.floor(diff / _month);
      const day = Math.floor(diff / _day);
      const hour = Math.floor(diff / _hour);
      const minute = Math.floor(diff / _minute);
      const second = Math.floor(diff / 1000);
      let isEmpty = false;

      switch (endUnit) {
        case 1:
          isEmpty = (minute || hour || day || month || year) ? true : false;
          break;
        case 2:
          isEmpty = (hour || day || month || year) ? true : false;
          break;
        case 3:
          isEmpty = (day || month || year) ? true : false;
          break;
        case 4:
          isEmpty = (month || year) ? true : false;
          break;
        case 5:
          isEmpty = year ? true : false;
          break;
        default:
          break;
      }

      if (!isEmpty) {
        if (year) {
          res = `${year}年${suffix}`;
        } else if (month) {
          res = `${month}个月${suffix}`;
        } else if (day) {
          if (day === 1 && fixedDay) {
            // 1天前
            res = "昨天";
          } else if (day === 2 && fixedDay) {
            // 2天前
            res = "前天";
          } else {
            res = `${day}天${suffix}`;
          }
        } else if (hour) {
          res = `${hour}小时${suffix}`;
        } else if (minute) {
          res = `${minute}分钟${suffix}`;
        } else {
          const sec = seconds < 60 ? seconds : 59;
          res = second < sec ? '刚刚' : `${second}秒${suffix}`;
        }
      }
    }
    return res;
  }

  /**
   * 检查值是否为空
   * @param value 需要检查的值
   */
  public static empty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && Utils.trim(value) === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  }

  /**
   * 生成随机字符串
   * @param length 字符串长度
   */
  public static generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');
  }

  /**
   * 工具函数：安全的JSON字符串化
   * @param value 需要序列化的值
   */
  public static safeJSONStringify(value: any): string | null {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return null; // 或者根据需要返回一个空对象或其他默认值
    }
  }

  /**
   * 工具函数：安全的整数转换
   * @param value 需要转换的值
   */
  public static safeCastToInteger(value: any): number {
    if (typeof value === 'number' && !isNaN(value)) return Number(value);
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : Number(parsed);
    }
    return 0; // 或者根据需要返回其他默认值
  }

  /**
   * 工具函数：数组/对象排序
   * @param obj 需要排序的对象或数组
   */
  public static sortMultiDimensionalObject(obj: any): any {
    if (obj && typeof obj === 'object') {
      const sortedObject: any = {};
      const keys = Object.keys(obj).sort();
      for (const key of keys) {
        sortedObject[key] = Utils.sortMultiDimensionalObject(obj[key]);
      }
      return Object.keys(obj).length > 0 ? sortedObject : null;
    } else if (obj && Array.isArray(obj)) {
      return obj.length > 0 ? obj.sort().map((item: any) => Utils.sortMultiDimensionalObject(item)) : null;
    } else {
      return obj || null;
    }
  }

  /**
   * 校验是否是合法的Cron格式
   * @param rowTime Cron表达式
   */
  public static isValidCronFormatFlexible(rowTime: string): boolean {
    // 正则表达式匹配Cron格式，秒字段可选：[秒] 分 时 日 月 周
    // 秒（可选）：0-59 或 省略
    // 分钟：0-59
    // 小时：0-23
    // 日期：1-31
    // 月份：1-12
    // 星期：0-6（0和7都代表周日）
    // 使用非捕获组(?:...)和问号?来标记秒字段为可选
    const cronPatternWithSeconds = /^([0-5]?\d|\*|(?:\*\/[1-9][0-9]?))\s([0-5]?\d|\*|(?:\*\/[1-9][0-9]?))\s([01]?\d|2[0-3]|\*)\s([1-9]|1\d|2[0-9]|3[01]|\*)\s(1[0-2]|0?[1-9]|\*)\s([0-6]|\*)$/;
    const cronPatternWithoutSeconds = /^([0-5]?\d|\*|(?:\*\/[1-9][0-9]?))\s([01]?\d|2[0-3]|\*)\s([1-9]|1\d|2[0-9]|3[01]|\*)\s(1[0-2]|0?[1-9]|\*)\s([0-6]|\*)$/;
    return cronPatternWithSeconds.test(rowTime) || cronPatternWithoutSeconds.test(rowTime);
  }

  /**
   * 生成格式化的序列号
   * @param groupSize 组大小
   * @param numberOfGroups 组数量
   */
  public static generateFormattedSerial(groupSize: number = 5, numberOfGroups: number = 4): string {
    const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const totalLength = (groupSize || 5) * (numberOfGroups || 4);
    const randomPart = Array.from({ length: totalLength }, () =>
      possibleChars.charAt(Math.floor(Math.random() * possibleChars.length))
    ).join('');
    return 'SN-' + randomPart.match(new RegExp('.{1,' + groupSize + '}', 'g'))!.join('-');
  }

  /**
   * 拆分驼峰命名
   * @param str 需要拆分的字符串
   */
  public static splitCamelCase(str: string): string[] {
    // 使用正则表达式匹配小写字母后跟大写字母的情况，并在其间插入空格。
    // 然后根据空格拆分字符串。
    return str.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
  }

  /**
   * 转换为驼峰命名
   * @param arr 需要转换的字符串数组
   */
  public static toCamelCase(arr: string[]): string {
    return arr.map((word, index) => {
      // 对于第一个单词，全部小写；对于后续单词，首字母大写，其余小写
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join('');
  }
}

export default Utils;

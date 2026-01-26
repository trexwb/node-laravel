/*** 
 * @Author: trexwb
 * @Date: 2026-01-24 08:47:32
 * @LastEditors: trexwb
 * @LastEditTime: 2026-01-26 11:14:38
 * @FilePath: /node-laravel/tests/postmain_prepose.js
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2026 by 杭州大美, All Rights Reserved. 
 */
// 前置脚本
const headers = eo.http.header.parse();
// eo.info("headers:" + eo.json.encode(headers))
const baseUrl = eo.env.param.get("url") || "https://print-dev.lixitu.com";
const appId = headers["App-Id"] || eo.env.param.get("appId");
const appSecret = headers["App-Secret"] || eo.env.param.get("appSecret");
const timeStamp = Math.floor(Date.now() / 1000).toString();
const appStr = eo.crypt.sha256(appId + timeStamp);
const appSecretStr = eo.crypt.md5(appStr + appSecret) + timeStamp;
eo.http.header.set("App-Id", appId);
eo.http.header.set("App-Secret", appSecretStr);

const sortObjectDeep = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep); // 数组保持顺序，或可考虑排序
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortObjectDeep(v)])
    );
  } else {
    return obj;
  }
};

// 1. 生成随机的密钥和初始化向量
const generateKeyAndIV = () => {
  const key = crypto.randomBytes(32); // 32字节密钥
  const iv = crypto.randomBytes(16);  // 16字节初始化向量
  return { key, iv };
};
// 2. 加密函数
const encrypt = (text, key, iv) => {
  const encryptedText = typeof text == 'string' ? text : eo.json.encode(text);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
// 3. 解密函数
const decrypt = (encryptedText, key, iv) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  try {
    return eo.json.decode(decrypted);
  } catch (jsonError) {
    throw new Error('Invalid JSON format after decryption');
  }
};
const clearParsedBody = (parsedBody) => {
  if (parsedBody !== null && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
    // 方法1：使用 Object.keys() 获取所有键名，然后删除每个属性
    Object.keys(parsedBody).forEach(key => {
      delete parsedBody[key];
    });
    return parsedBody;
  }
  // 如果不是对象或为null，则直接返回原值
  return parsedBody;
}

// 优先做加密处理
const key = eo.env.param.get("appSecret");
const iv = eo.env.param.get("appIv");
const resData = eo.json.encode(eo.http.body.parse());
clearParsedBody(eo.http.bodyParseParam);
const decryptStr = encrypt(resData, key, iv);
eo.info("加密结果：" + decryptStr);
eo.info("解密结果：" + eo.json.encode(decrypt(decryptStr, key, iv)));
eo.http.bodyParseParam['encryptData'] = decryptStr;
// eo.info(eo.json.encode(eo.http.bodyParseParam) + eo.json.encode(eo.http.body.parse()));

// 加密完才能做签名，否则签名会不正确
const bodyJson = sortObjectDeep(eo.http.bodyParseParam || eo.http.body.parse());
const bodyStr = eo.json.encode(bodyJson);
eo.info("签名内容：" + bodyStr);
const bodyStrSha = eo.crypt.sha256(bodyStr);
const signStr = eo.crypt.md5(bodyStrSha + appSecret);
eo.http.header.set("X-Sign", signStr);
eo.info("签名结果：" + signStr);

// 模拟token
const api = {
  "url": baseUrl + "/api/front/heartbeat/mockToken", //[必填][string]请求地址,若不存在请求协议，默认http
  "name": "获取测试账号token", //[选填][string]，API名称，方便检索，不填则默认为系统生成API编号
  "method": "POST", //[选填][string],请求方式,可能值有[GET/POST/PUT/PATCH/DELETE/HEAD/OPTION],兼容大小写,默认为GET
  "headers": {
    "Content-Type": "application/x-www-form-urlencoded",
    "App-Id": appId,
    "App-Secret": appSecretStr
  },
  "timelimit": 1000 //[选填],超时限制,单位为ms,超过时间则判断为请求失败，默认为1000ms
};
const authToken = headers["Auth-Token"] || eo.env.param.get("authToken");
if (authToken == 'auto') {
  const result = eo.execute(api);
  // eo.info("Token:" + eo.json.encode(result.response));
  if (result.response) {
    const response = eo.json.decode(result.response);
    if (response) {
      if (response.data) {
        eo.http.header.set("Authorization", 'Bearer ' + response.data);
        eo.info("Authorization:" + response.data);
      } else if (response.encryptedData) {
        const decryptStr = decrypt(response.encryptedData, key, iv);
        eo.http.header.set("Authorization", 'Bearer ' + decryptStr);
        eo.info("Authorization【解密】：" + decryptStr);
      }
    }
  }
}
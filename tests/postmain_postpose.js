/*** 
 * @Author: trexwb
 * @Date: 2026-01-24 08:49:22
 * @LastEditors: trexwb
 * @LastEditTime: 2026-01-24 08:49:37
 * @FilePath: /print/server/tests/postmain_postpose.js
 * @Description: 
 * @一花一世界，一叶一如来
 * @Copyright (c) 2026 by 杭州大美, All Rights Reserved. 
 */
// 后置脚本

const key = eo.env.param.get("appSecret");
const iv = eo.env.param.get("appIv");
const responseData = eo.json.decode(eo.http.response.get('data') || '');
const resData = responseData.data || {};

// 1. 生成随机的密钥和初始化向量
const generateKeyAndIV = () => {
  const key = crypto.randomBytes(32); // 32字节密钥
  const iv = crypto.randomBytes(16);  // 16字节初始化向量
  return { key, iv };
};
// 2. 加密函数
const encrypt = (text, key, iv) => {
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
  return decrypted;
};

if (resData.encryptedData) {
  // eo.info(resData.encryptedData);
  const encryptStr = resData.encryptedData;
  // const encryptStr = eo.base64.encode(resData.encryptedData);
  // const encryptStr = eo.urlDecode(resData.encryptedData);
  // eo.info("encryptStr:" + encryptStr);
  const decryptStr = decrypt(encryptStr, key, iv);
  eo.info("解密结果：" + decryptStr);
  // const returnData = eo.json.decode(decryptStr||'');
  // eo.info("returnData:" + eo.json.encode(returnData));
}
// const encryptStr = eo.crypt.aesEncrypt('jsong',key,{"padding":"Pkcs7","mode":"CBC","iv":iv});
// eo.info('encryptStr:' + encryptStr);
// const decryptStr = eo.crypt.aesDecrypt(encryptStr,key,{"padding":"Pkcs7","mode":"CBC","iv":iv});
// eo.info('decryptStr:' + decryptStr);
const crypto = require('crypto'); // 암호화 모듈 추가
// ... 기존 코드 ...

const algorithm = 'aes-256-cbc'; // 암호화 알고리즘
const key = crypto.scryptSync('prevenotics', 'salt', 32); // 키 생성
const iv = crypto.randomBytes(16); // 초기화 벡터 생성
console.log(iv)

const encryptFileName = (fileName) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(fileName, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return iv.toString('base64') + ':' + encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '~'); // IV와 암호문을 함께 반환
};

const decryptFileName = (encryptedFileName) => {
    const parts = encryptedFileName
        .replace(/-/g, '+') // '-'를 '+'로 대체
        .replace(/_/g, '/')  // '_'를 '/'로 대체
        .replace(/~/g, '=').split(':');
    const iv = Buffer.from(parts.shift(), 'base64'); // IV 추출
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(parts.join(':'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};


console.log(encryptFileName('10000115_20240822_19220616_102_F_0001'));
console.log(decryptFileName('FPjkuGpGg0WQlt8biAE/eg==:sgkf1lCFKBXyHLqOnMVoAsTUq-9rnO-NBPRLzAwmYcLfJZ6k_MmzVkJoERvMmlZd'))
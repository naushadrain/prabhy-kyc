import CryptoJS from 'crypto-js';

export function generateSignature(timestamp, body, secretKey) {
    const dataToSign = `${timestamp}.${JSON.stringify(body)}.${secretKey}`;
    const hash = CryptoJS.SHA256(dataToSign);
    return hash.toString(CryptoJS.enc.Hex);
}
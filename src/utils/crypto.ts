import CryptoJS from 'crypto-js';

export function generateSignature(timestamp:string |number, body:string | number, secretKey:string | number) {
    const dataToSign = `${timestamp}.${JSON.stringify(body)}.${secretKey}`;
    const hash = CryptoJS.SHA256(dataToSign);
    return hash.toString(CryptoJS.enc.Hex);
}
// src/api/signature.js
import CryptoJS from "crypto-js";

/**
 * Returns { unixTs, signature }
 * dataToSign = unixTs + "." + jsonBody + "." + secret-key
 */
export function buildSignatureForBody(jsonBodyString) {
    const secretKey = import.meta.env.VITE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("VITE_SECRET_KEY is not set");
    }

    const unixTs = Math.round(Date.now() / 1000).toString();
    const dataToSign = `${unixTs}.${jsonBodyString}.${secretKey}`;

    const hash = CryptoJS.SHA256(dataToSign);
    const signature = hash.toString(CryptoJS.enc.Hex);

    return { unixTs, signature };
}

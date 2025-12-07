// src/api/cryptoHelpers.js
import CryptoJS from "crypto-js";

export function encryptAESWithSecret(text) {
    const secretKey = import.meta.env.VITE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("VITE_SECRET_KEY is not set");
    }

    const key = CryptoJS.enc.Utf8.parse(secretKey);
    const iv = CryptoJS.enc.Utf8.parse(secretKey);

    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.toString(); // same as pm.environment.set("login-encrypt", encrypted.toString())
}

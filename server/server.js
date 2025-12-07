import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import CryptoJS from "crypto-js";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const BASE = process.env.INS_BASE_URL;
const SECRET = process.env.SECRET_KEY;
const USER = process.env.USER_LOGIN_ID;

// helpers ----------------------------------------------------------
const unix = () => Math.round(Date.now() / 1000).toString();
const sha256 = str => CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
const aesEncrypt = (txt, key = SECRET) => {
    const k = CryptoJS.enc.Utf8.parse(key);
    const iv = CryptoJS.enc.Utf8.parse(key);
    return CryptoJS.AES.encrypt(txt, k, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
};
const signHeader = (body, ts) =>
    `${ts}.${sha256(`${ts}.${body ?? ""}.${SECRET}`)}`;

// ------------------------------------------------------------------
// 1. SESSION  (/v1/common/session-id)  ->  returns process_key
app.post("/api/session", async (_req, res) => {
    const ts = unix();
    const body = {
        device_id: USER,
        device_name: process.env.DEVICE_OS,
        device_os: process.env.DEVICE_OS,
        app_version: process.env.APP_VERSION
    };
    const sig = signHeader(JSON.stringify(body), ts);
    const r = await axios.post(`${BASE}/v1/common/session-id`, body, {
        headers: { "split-signature": sig, "Content-Type": "application/json" }
    });
    res.json(r.data); // {process_key: "..."}
});

// ------------------------------------------------------------------
// 2. SEND OTP  (/v1/common/onetime-otp)
app.post("/api/send-otp", async (req, res) => {
    const { mobile, process_key } = req.body;
    const ts = unix();
    const encMobile = aesEncrypt(mobile);
    const body = {
        mobile_number: encMobile,
        language: "en",
        issue_type: "07"
    };
    const sig = signHeader(JSON.stringify(body), ts);
    const r = await axios.post(`${BASE}/v1/common/onetime-otp`, body, {
        auth: { username: USER, password: process_key },
        headers: { "verify-signature": sig }
    });
    res.json(r.data);
});

// ------------------------------------------------------------------
// 3. VALIDATE OTP  (/v1/common/onetime-otp/validate)
app.post("/api/validate-otp", async (req, res) => {
    const { otp, otp_process_id, process_key } = req.body;
    const ts = unix();
    const encOtp = aesEncrypt(otp);
    const body = {
        issue_type: "07",
        process_id: otp_process_id,
        verification_code: encOtp
    };
    const sig = signHeader(JSON.stringify(body), ts);
    const r = await axios.post(`${BASE}/v1/common/onetime-otp/validate`, body, {
        auth: { username: USER, password: process_key },
        headers: { "verify-signature": sig }
    });
    res.json(r.data); // often contains access_token & refresh_token
});

// ------------------------------------------------------------------
// 4. LOGIN  (/v1/common/login)
app.post("/api/login", async (req, res) => {
    const { username, password, process_key } = req.body;
    const ts = unix();
    const encUser = aesEncrypt(username);
    const encPwd = aesEncrypt(password);
    const body = {
        username: encUser,
        password: encPwd,
        grant_type: "password"
    };
    const sig = signHeader(JSON.stringify(body), ts);
    const r = await axios.post(`${BASE}/v1/common/login`, body, {
        auth: { username: USER, password: process_key },
        headers: { "verify-signature": sig }
    });
    res.json(r.data);
});

app.listen(process.env.PORT || 4000, () =>
    console.log("Proxy server running on port", process.env.PORT)
);

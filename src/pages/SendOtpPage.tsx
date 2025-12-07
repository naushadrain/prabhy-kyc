// src/pages/SendOtpPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOneTimeOtp } from "../api/otpClient";

export default function SendOtpPage() {
    const [mobile, setMobile] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const validateMobile = (value) => {
        if (!value) return "Mobile number is required";
        if (!/^[0-9]{10}$/.test(value)) return "Enter valid 10-digit mobile number";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");

        const vError = validateMobile(mobile);
        if (vError) {
            setError(vError);
            return;
        }

        try {
            setLoading(true);
            const data = await sendOneTimeOtp(mobile);

            // ✅ NEW LOGIC: if process_id is present, treat as success
            if (data?.process_id) {
                // save OTP process id and go to validation page
                localStorage.setItem("otp_process_id", data.process_id);

                setInfo("OTP process started. Redirecting to validation page...");
                navigate("/otp-validate");
            } else {
                // no process_id => real failure – show first error message
                const err = data?.error_list?.[0];
                if (err) {
                    setError(`${err.error_message} (Code: ${err.error_code})`);
                } else {
                    setError("Failed to send OTP. Please try again.");
                }
            }
        } catch (err) {
            setError(err.message || "Unexpected error");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={{ maxWidth: 400, margin: "40px auto", padding: 16 }}>
            <h2>Send One-Time OTP</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>
                        Mobile Number
                        <input
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="98XXXXXXXX"
                            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
                        />
                    </label>
                </div>

                {error && (
                    <p style={{ color: "red", marginBottom: 8 }}>
                        {error}
                    </p>
                )}

                {info && (
                    <p style={{ color: "green", marginBottom: 8 }}>
                        {info}
                    </p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                </button>
            </form>
        </div>
    );
}

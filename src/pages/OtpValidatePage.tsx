// src/pages/OtpValidatePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateOneTimeOtp } from "../api/otpClient";

export default function OtpValidatePage() {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const otpProcessId = localStorage.getItem("otp_process_id");

    const validateOtpInput = (value) => {
        if (!value) return "OTP is required";
        if (!/^[0-9]{6}$/.test(value)) return "Enter a valid 6-digit OTP";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");

        const vError = validateOtpInput(otp);
        if (vError) {
            setError(vError);
            return;
        }

        try {
            setLoading(true);
            const data = await validateOneTimeOtp(otp);

            // If we reach here, validateOneTimeOtp did not throw → success
            setInfo("OTP verified successfully. Redirecting to dashboard...");
            navigate("/client-register");
        } catch (err) {
            setError(err.message || "Failed to validate OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "40px auto", padding: 16 }}>
            <h2>OTP Validation</h2>

            <p style={{ fontSize: 14, color: "#555" }}>
                otp_process_id: {otpProcessId || "not found"}
            </p>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>
                        Enter OTP
                        <input
                            type="number"          // numeric input
                            inputMode="numeric"
                            value={otp}
                            onChange={(e) => {
                                // keep only digits
                                const onlyDigits = e.target.value.replace(/\D/g, "");
                                setOtp(onlyDigits);
                            }}
                            placeholder="6-digit code"
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
                    {loading ? "Verifying..." : "Verify OTP"}
                </button>
            </form>
        </div>
    );
}

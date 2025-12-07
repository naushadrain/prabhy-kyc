import React, { useRef } from "react";

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (val: string) => void;
    autoFocus?: boolean;
}

export default function OtpInput({
    length = 6,
    value,
    onChange,
    autoFocus = false,
}: OtpInputProps) {
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const handleChange = (index: number, val: string) => {
        if (!/^\d*$/.test(val)) return; // only digits
        const otpArr = value.split("");
        otpArr[index] = val.slice(-1);
        const newOtp = otpArr.join("").slice(0, length);
        onChange(newOtp);

        if (val && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        onChange(pasted);
        if (pasted.length === length) inputsRef.current[length - 1]?.focus();
    };

    return (
        <div
            className="flex justify-center gap-3"
            onPaste={handlePaste}
        >
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={value[i] || ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    autoFocus={autoFocus && i === 0}
                    className="w-12 h-12 text-center border-2 rounded-xl text-xl font-semibold
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     outline-none transition-all"
                />
            ))}
        </div>
    );
}

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import NepaliKeyboard from "nepali-keyboard";

export default function NepaliNameField({ t }) {
    const [nepaliName, setNepaliName] = useState("");

    // Keyboard instance
    const keyboard = new NepaliKeyboard();

    const handleChange = (e) => {
        const typed = keyboard.getNepali(e.target.value); // direct Nepali typing
        setNepaliName(typed);
    };

    return (
        <div>
            <Label>{t("kycAdd.fullName")} (नेपालीमा) *</Label>

            <Input
                className="mt-2"
                value={nepaliName}
                onChange={handleChange}
                placeholder="नेपालीमा पुरा नाम लेख्नुहोस्"
            />
        </div>
    );
}

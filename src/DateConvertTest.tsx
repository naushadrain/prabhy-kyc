import { useState } from "react";
// import { convertToUnicode } from "";

export default function NepaliType() {
  const [eng, setEng] = useState("");
  const [np, setNp] = useState("");

  return (
    <div>
      <textarea
        value={eng}
        onChange={(e) => {
          setEng(e.target.value);
        //   setNp(convertToUnicode(e.target.value)); // SAME OUTPUT AS ASHESH
        }}
      />

      <textarea value={np} readOnly />
    </div>
  );
}

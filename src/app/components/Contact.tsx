"use client";

import React, { useRef, useState } from "react";
import { Mailbox } from "lucide-react";

export default function Contact({ title }: any) {
  const [emailCopied, setEmailCopied] = useState(false);

  const emailRef = useRef<any>(null);

  const handleEmailCopy = () => {
    const email = emailRef.current.textContent;
    navigator.clipboard.writeText(email);
    setEmailCopied(true);
    setTimeout(() => {
      setEmailCopied(false);
    }, 2000);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full px-4 py-20 m-auto border-t-4 border-black">
      <Mailbox size={150} />
      <h1 className="mt-8 text-3xl font-extrabold md:text-5xl">{title}</h1>
      <div className="max-w-4xl">
        <div
          onClick={handleEmailCopy}
          className={`group relative flex gap-4 justify-center items-center py-4 px-8 border-8 border-black my-10 rounded-2xl shadow-neobrutalism cursor-pointer w-full`}
        >
          <h2 className={`md:text-3xl text-xl font-extrabold`} ref={emailRef}>
            {emailCopied ? "Email copiado 🫱🏽‍🫲🏽" : "contato@felipegomes.me"}
          </h2>
        </div>
      </div>
      <p className="absolute bottom-8">the code ®</p>
    </div>
  );
}

"use client";

import { Mailbox } from "lucide-react";
// Importe o ícone de WhatsApp se necessário
// import { FaWhatsapp } from 'react-icons/fa';

import React, { useRef, useState } from "react";

export default function Contact({ title, wppCall }: any) {
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

  const phoneNumber = "+5571994178164";

  const whatsappLink = `https://wa.me/${phoneNumber}`;

  return (
    <div className="relative flex flex-col items-center justify-center w-full px-4 py-10 m-auto pb-28">
      <div className="grid gap-4 place-items-center">
        <Mailbox size={150} />
        <h1 className="text-3xl font-extrabold md:text-5xl">{title}</h1>
      </div>
      <div className="max-w-4xl">
        <div
          onClick={handleEmailCopy}
          className={`group relative flex gap-4 justify-center items-center py-4 px-8 border-4 border-black my-10 rounded-2xl cursor-pointer w-full`}
        >
          <h2 className={`md:text-3xl text-xl font-extrabold`} ref={emailRef}>
            {emailCopied ? "Email copiado 🫱🏽‍🫲🏽" : "contato@felipegomes.me"}
          </h2>
        </div>
        <h2>
          {wppCall}{" "}
          <a
            href={whatsappLink}
            className="font-bold text-emerald-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </h2>
      </div>
    </div>
  );
}

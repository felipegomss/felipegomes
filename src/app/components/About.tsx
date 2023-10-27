"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";

export default function About({ paragraph, button }: any) {
  const [download, setDownload] = useState(false);
  const handleDownload = () => {
    setDownload(true);
    setTimeout(() => {
      setDownload(false);
    }, 1000);
  };

  return (
    <div
      id="about"
      className="relative flex items-center justify-center min-h-screen p-8 text-white bg-black"
    >
      <main className="z-40 flex flex-col-reverse gap-16 m-auto max-w-7xl md:grid md:grid-cols-2">
        <article className="flex flex-col justify-between py-8">
          <div className="flex flex-col gap-8">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-yellow-200 via-emerald-200 to-yellow-200">
              Felipe Gomes
            </h1>
            <p className="text-zinc-400">{paragraph}</p>
          </div>
          <Link
            href="/curriculum"
            className={` group relative flex gap-4 justify-center items-center py-4 px-8 border-2 border-white rounded-2xl cursor-pointer`}
            target="_blank"
          >
            <h2
              className={`md:text-3xl text-xl font-extrabold flex gap-4 items-center`}
            >
              {button}
            </h2>
          </Link>
        </article>
        <div className="w-full">
          <Image
            src="/felipephoto.webp"
            alt=""
            width={500}
            height={500}
            className="w-full"
          />
        </div>
      </main>
    </div>
  );
}

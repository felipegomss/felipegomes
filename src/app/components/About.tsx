"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";

export default function About({ paragraph, button }: any) {
  return (
    <div
      id="about"
      className="relative flex items-center justify-center min-h-screen p-8 text-white bg-black"
    >
      <main className="z-40 flex flex-col-reverse m-auto max-w-7xl md:grid md:grid-cols-2">
        <article className="flex flex-col justify-between gap-16 py-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-yellow-200 via-emerald-200 to-yellow-200">
              Felipe Gomes
            </h1>
            <span className="text-zinc-400">
              {paragraph.split("\n").map((c: string, k: number) => {
                return <p key={k}>{c}</p>;
              })}
            </span>
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
        <div className="flex items-center justify-center w-full md:justify-end">
          <Image
            src="/memoji-felipe.png"
            alt=""
            width={350}
            height={350}
            className="rounded-full"
          />
        </div>
      </main>
    </div>
  );
}

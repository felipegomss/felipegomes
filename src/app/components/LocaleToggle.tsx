"use client";

import { useParams } from "next/navigation";

import React from "react";
import Link from "next-intl/link";

export default function LocaleToggle() {
  const params = useParams();
  const locale = params.locale;
  return (
    <div className="fixed z-50 hidden bg-black border-4 border-whiteß rounded-full cursor-pointer md:flex flex-row drop-shadow-xl right-10 bottom-8 divide-x-4 divide-y-0">
      <div
        className={`${
          locale == "pt-BR" ? "shadow-inner bg-zinc-500" : ""
        }w-10 h-10`}
      >
        <Link
          href={"/"}
          locale={"pt-BR"}
          className="flex items-center justify-center w-10 h-10 text-white"
        >
          🇧🇷
        </Link>
      </div>
      <div
        className={`${
          locale == "en" ? "shadow-inner bg-zinc-500" : ""
        }w-10 h-10`}
      >
        <Link
          href={"/"}
          locale={"en"}
          className="flex items-center justify-center w-10 h-10 text-white"
        >
          🇺🇸
        </Link>
      </div>
    </div>
  );
}

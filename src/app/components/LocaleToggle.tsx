"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import Link from "next-intl/link";

export default function LocaleToggle() {
  const router = useParams();
  const currentLocale = router.locale;

  const [isChecked, setIsChecked] = useState(currentLocale === "en");

  const newLocale = isChecked ? "pt-BR" : "en";

  const toggleSwitch = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className="fixed z-50 right-10 bottom-16">
      <Link
        href={"/"}
        locale={newLocale}
        className={`relative hidden md:inline-block w-20 h-10 rounded-full ${
          isChecked ? "bg-emerald-500" : "bg-gray-300"
        }`}
        onClick={toggleSwitch}
      >
        <div className="grid w-full h-full grid-cols-2 rounded-full place-items-center">
          <div className={isChecked ? "opacity-100" : "opacity-0"}>🇺🇸</div>
          <div className={!isChecked ? "opacity-100" : "opacity-0"}>🇧🇷</div>
        </div>
        <motion.div
          className="absolute top-0 left-0 w-10 h-10 bg-white rounded-full shadow-md"
          draggable="false"
          animate={{ x: isChecked ? "100%" : "0%" }}
          transition={{ ease: "easeInOut", duration: 0.3 }}
        ></motion.div>
      </Link>
    </div>
  );
}

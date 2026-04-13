"use client";
import { Bell, Menu } from "lucide-react";
import React from "react";

const NavBar = () => {
  return (
    <div className="flex justify-between items-center w-full mb-7">
      {/* Leftside */}
      <div className="flex justify-between items-center gap-5"></div>
      {/*Right side*/}
      <div className="flex justify-between items-center gap-5">
        <div className="hidden md:flex justify-between items-center gap-5">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 "> Image</div>
            <span className="font-semibold">
              {localStorage.getItem("username")}{" "}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;

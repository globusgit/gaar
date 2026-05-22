"use client";
import { useSession } from "next-auth/react";
import React from "react";

function dasboardpage() {
  const { data: session } = useSession();
  console.log(session);
  return <div>Dashboard</div>;
}

export default dasboardpage;

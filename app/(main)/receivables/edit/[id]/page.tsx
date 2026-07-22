"use client";

import { useParams } from "next/navigation";
import ReceivableForm from "@/app/_components/receivable/ReceivableForm";

export default function EditPage() {
  const { id } = useParams();

  return <ReceivableForm id={id as string} />;
}

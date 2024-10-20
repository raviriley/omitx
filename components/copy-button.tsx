"use client";

import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function CopyButton({
  value,
  toastMessage,
  className,
}: {
  value: string;
  toastMessage: string;
  className?: string;
}) {
  return (
    <Copy
      className={cn(
        "w-4 h-4 hover:text-gray-500 dark:hover:text-gray-300 text-gray-400 cursor-pointer",
        className,
      )}
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success(toastMessage);
      }}
    />
  );
}

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PrivateKeyDisplay({ privateKey }: { privateKey: string }) {
  const [isRevealed, setIsRevealed] = useState(false);

  const toggleReveal = () => {
    setIsRevealed(!isRevealed);
  };

  return (
    <div className="flex items-center">
      <Input
        value={
          isRevealed
            ? privateKey
            : "******************************************************************"
        }
        disabled
        className="text-sm font-medium break-all cursor-text"
      />
      <button onClick={toggleReveal} className="ml-2">
        {isRevealed ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

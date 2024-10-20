"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { updateOmiId } from "@/lib/omi-action";
import { cn } from "@/lib/utils";

const OmiIdEditor = ({
  initialOmiId,
  className,
}: {
  initialOmiId: string;
  className?: string;
}) => {
  const [omiId, setOmiId] = useState(initialOmiId);
  const { update } = useSession();

  const handleSave = async () => {
    try {
      await updateOmiId(omiId);
      console.log("Omi ID updated successfully");
      await update({ omiId });
    } catch (error) {
      console.error("Error updating Omi ID:", error);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex-grow">
        <Input
          value={omiId}
          onChange={(e) => setOmiId(e.target.value)}
          placeholder="Enter your Omi ID"
          className={cn(
            "bg-indigo-700 text-indigo-100 placeholder-indigo-300 border-indigo-600",
            "focus:border-indigo-500 focus:ring-indigo-500",
          )}
        />
      </div>
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};

export default OmiIdEditor;

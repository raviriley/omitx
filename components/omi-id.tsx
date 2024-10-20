"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { updateOmiId } from "@/lib/omi-action";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="flex-grow">
          <Tooltip>
            <TooltipTrigger>
              <Input
                value={omiId}
                onChange={(e) => setOmiId(e.target.value)}
                placeholder="Enter your Omi ID"
                className={cn(
                  "bg-blue-700 text-blue-100 placeholder-blue-300 border-blue-600",
                  "dark:bg-indigo-700 dark:text-indigo-100 dark:placeholder-indigo-300 dark:border-indigo-600",
                  "focus:border-indigo-500 focus:ring-indigo-500",
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                To find your Omi ID, open the Omi app and go to Settings &gt;
                Profile &gt; Other &gt; Your User ID
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </TooltipProvider>
  );
};

export default OmiIdEditor;

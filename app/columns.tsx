"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Transaction = {
  timestamp: Date;
  hash: string;
  to: string;
  amount: number;
  chain: string;
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "timestamp",
    header: () => <div className="text-right">Timestamp</div>,
    cell: ({ row }) => {
      const timestamp = new Date(row.original.timestamp);
      return <div className="text-right">{timestamp.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "hash",
    header: "Hash",
  },
  {
    accessorKey: "to",
    header: "To",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "chain",
    header: "Chain",
  },
  {
    id: "copy",
    cell: ({ row }) => {
      const transaction = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(transaction.hash)}
            >
              Copy transaction hash
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View on explorer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

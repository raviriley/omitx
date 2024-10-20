"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const NETWORK_EXPLORERS = {
  //   base: "https://basescan.org/tx/",
  base: "https://sepolia.basescan.org/tx/",
  polygon: "https://polygonscan.com/tx/",
  arbitrum: "https://basescan.org/tx/",
  ethereum: "https://etherscan.io/tx/",
};

type Transaction = {
  timestamp: Date;
  hash: string;
  transcript: string;
  to: string;
  amount: number;
  chain: string;
  currency: string;
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "timestamp",
    header: () => <div className="text-left">Timestamp</div>,
    cell: ({ row }) => {
      const timestamp = new Date(row.original.timestamp);
      return <div className="text-left">{timestamp.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "hash",
    header: "Hash",
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <div className="truncate">
          {transaction.hash.slice(0, 6)}...{transaction.hash.slice(-4)}
        </div>
      );
    },
  },
  {
    accessorKey: "currency",
    header: "Currency",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "to",
    header: "To",
  },
  {
    accessorKey: "chain",
    header: "Chain",
  },
  {
    accessorKey: "transcript",
    header: "Transcript",
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <ScrollArea className="max-w-md">
          <div className="truncate">{transaction.transcript}</div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );
    },
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
              onClick={() => {
                navigator.clipboard.writeText(transaction.hash);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy transaction hash
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const explorer =
                  NETWORK_EXPLORERS[
                    transaction.chain as keyof typeof NETWORK_EXPLORERS
                  ];
                if (explorer) {
                  console.log(`${explorer}${transaction.hash}`);
                  window.open(`${explorer}${transaction.hash}`, "_blank");
                } else {
                  console.error(
                    `No explorer found for chain: ${transaction.chain}`,
                  );
                }
              }}
            >
              <Search className="h-4 w-4" />
              View on explorer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

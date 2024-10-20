import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Menu, Webhook } from "lucide-react";
import Link from "next/link";
import { AuthButton } from "./auth-button";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/api/auth/signin", label: "Sign In" },
];

const linkClasses = "text-foreground transition-colors hover:text-foreground";
const logo = <Webhook className="h-6 w-6" />;

export function Navbar() {
  return (
    <div className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          {logo}
          <span className="sr-only">Map Notes</span>
        </Link>
        {navigation.map((link) => (
          <Button
            key={link.href}
            variant={"link"}
            className={cn(linkClasses, "p-0")}
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              {logo}
              <span className="sr-only">Map Notes</span>
            </Link>
            {navigation.map((link) => (
              <Link key={link.href} href={link.href} className={linkClasses}>
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <div className="flex justify-end gap-2">
            <div className="text-xs text-muted-foreground my-auto mr-1 flex items-center gap-1">
              <Link href="https://github.com/raviriley/omitx/">
                <GitHubLogoIcon className="h-4 w-4 hover:text-foreground" />
              </Link>
              created by{" "}
              <Button asChild variant={"link"} className="text-xs p-0">
                <Link href="https://x.com/cryptokidf">Rohan</Link>
              </Button>
              &{" "}
              <Button asChild variant={"link"} className="text-xs p-0">
                <Link href="https://x.com/ravi_riley">Ravi</Link>
              </Button>
            </div>
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>
      </div>
    </div>
  );
}

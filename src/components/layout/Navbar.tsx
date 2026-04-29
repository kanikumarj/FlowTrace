"use client";

import { signOut, useSession } from "next-auth/react";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          id="menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex h-6 items-center rounded-md bg-primary/10 px-2.5">
            <span className="text-xs font-medium text-primary">Workspace</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {user?.name ? `${user.name}'s Workspace` : "My Workspace"}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
              id="user-menu-trigger"
            >
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight text-foreground">
                  {user?.name ?? "User"}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              id="logout-button"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

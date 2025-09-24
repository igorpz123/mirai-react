// components/layout/nav-user.tsx
"use client"

import { useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotificationsRT } from '@/contexts/RealtimeContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavUserProps {
  user: {
    id?: number;
    nome: string;
    email: string;
    avatar?: string;
    cargoId?: number;
    cargo?: string;
  };
  onSignOut: () => void;
}

export function NavUser({ user, onSignOut }: NavUserProps) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { unread } = useNotificationsRT()

  const handleLogout = () => {
    onSignOut();
    navigate("/login");
  };

  const userInfo = () => {
    navigate(`/admin/usuario/${user.id}`);
  };

  const userNotifications = () => {
    navigate("/notificacoes");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={`${user.nome}`} />
                ) : (
                  <AvatarFallback className="rounded-lg">
                    {user.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.nome}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={`${user.nome}`} />
                  ) : (
                    <AvatarFallback className="rounded-lg">
                      {user.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.nome}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem onClick={userInfo} className="cursor-pointer">
                  <BadgeCheck />
                  Minha Conta
                </DropdownMenuItem>
              <DropdownMenuItem onClick={userNotifications} className="cursor-pointer flex items-center gap-2">
                <Bell />
                <span className="flex-1">Notificações</span>
                {unread > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
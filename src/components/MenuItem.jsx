import React from 'react';
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';

export default function MenuItem({ item, isActive }) {
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = () => {
    navigate(item.url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleClick}
        isActive={isActive}
        className="w-full flex items-center gap-2 md:gap-3 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors data-[active=true]:bg-red-100 dark:data-[active=true]:bg-red-900/70 data-[active=true]:font-semibold"
        tooltip={item.title}
      >
        <item.icon size={18} className="flex-shrink-0" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}


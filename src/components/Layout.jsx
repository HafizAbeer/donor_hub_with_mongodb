import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Shield,
  UserCircle,
  LogOut,
  HeartHandshake,
  Settings,
  History,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MenuItem from "./MenuItem";

const menuItemsByRole = {
  superadmin: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Manage Events", url: "/events-manager", icon: Calendar },
    { title: "Create Admin", url: "/create-admin", icon: Shield },
    { title: "Add User", url: "/add-user", icon: UserPlus },
    { title: "All Donors", url: "/donors", icon: Users },
    { title: "All Admins", url: "/admins", icon: Shield },
    { title: "Patient History", url: "/patient-history", icon: History },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Manage Events", url: "/events-manager", icon: Calendar },
    { title: "Add User", url: "/add-user", icon: UserPlus },
    { title: "All Donors", url: "/donors", icon: Users },
    { title: "Patient History", url: "/patient-history", icon: History },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  user: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Patient History", url: "/patient-history", icon: History },
    { title: "My Profile", url: "/profile", icon: UserCircle },
  ],
};

function SidebarContentInner() {
  const { user } = useAuth();
  const location = useLocation();
  const menuItems = menuItemsByRole[user?.role] || [];

  return (
    <>
      <SidebarHeader className="p-2 md:p-4 border-b border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2 md:gap-3 px-2">
          <img
            src={logo}
            alt="Donor Hub Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base md:text-lg text-red-700 dark:text-red-400 truncate">
              Donor Hub
            </span>
            <span className="text-xs text-red-600 dark:text-red-500 truncate">
              Blood Donation Network
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 md:px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-red-700 dark:text-red-400 font-semibold px-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <MenuItem key={item.title} item={item} isActive={isActive} />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

function SidebarFooterInner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarFooter className="p-2 md:p-4 border-t border-red-200 dark:border-red-900">
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center gap-2 md:gap-3 px-2 py-2 rounded-md bg-red-50 dark:bg-red-900/30">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-red-900 dark:text-red-100 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          <LogOut size={16} className="md:mr-2" />
          Logout
        </Button>
      </div>
    </SidebarFooter>
  );
}

export default function Layout({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 dark:from-red-950 dark:via-pink-950 dark:to-red-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 dark:text-red-300">Loading...</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      const rolePrefix =
        user?.role === "superadmin"
          ? "Super Admin"
          : user?.role === "admin"
            ? "Admin"
            : "Donor";
      return `${rolePrefix} Dashboard`;
    }

    const pageTitles = {
      "/create-admin": "Create Admin",
      "/add-user": "Add User",
      "/donors": "All Donors",
      "/profile": "My Profile",
      "/patient-history": "Patient History",
      "/settings": "Settings",
    };

    return pageTitles[path] || "Page";
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar
          side="left"
          variant="sidebar"
          collapsible="none"
          className="bg-gradient-to-b from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border-r border-red-200 dark:border-red-900"
        >
          <SidebarContentInner />
          <SidebarFooterInner />
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="h-14 md:h-16 border-b border-red-200 dark:border-red-900 bg-white dark:bg-red-950/50 flex items-center px-3 md:px-4 flex-shrink-0">
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-red-900 dark:text-red-100 truncate">
                {getPageTitle()}
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-red-50 via-pink-50 to-red-50 dark:from-red-950 dark:via-pink-950 dark:to-red-950 p-3 md:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

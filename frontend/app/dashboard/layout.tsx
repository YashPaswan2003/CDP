"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Search,
  Monitor,
  Smartphone,
  MessageCircle,
  Upload,
  Presentation,
  Settings,
  LogOut,
} from "lucide-react";
import { getAuthToken, removeAuthToken } from "@/lib/utils";
import { AccountProvider, useAccount } from "@/lib/accountContext";

function SidebarContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // default true until we check
  const [isReady, setIsReady] = useState(false);
  const { currentUser, selectedAccount, accessibleAccounts, switchAccount } =
    useAccount();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/auth");
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
    setIsReady(true);
  }, [router]);

  const handleLogout = async () => {
    removeAuthToken();
    router.push("/auth");
  };

  // Show loading until auth check completes
  if (!isReady) {
    return <div className="min-h-screen bg-slate-950">Loading...</div>;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-slate-950">Redirecting...</div>;
  }

  if (!currentUser || !selectedAccount) {
    return <div className="min-h-screen bg-slate-950">Loading account data...</div>;
  }

  // Check if viewing Ethinos master account (can see Clients)
  const canManageClients = selectedAccount?.id === "ethinos";

  // Main nav items
  const navItems = [
    { label: "Portfolio", href: "/dashboard", icon: LayoutDashboard },
    ...(canManageClients
      ? [{ label: "Clients", href: "/dashboard/clients", icon: Users }]
      : []),
    { label: "Google Ads", href: "/dashboard/analytics/google-ads", icon: Search },
    { label: "DV360", href: "/dashboard/analytics/dv360", icon: Monitor },
    { label: "Meta", href: "/dashboard/analytics/meta", icon: Smartphone },
  ];

  // Bottom nav items
  const bottomNavItems = [
    { label: "Chat", href: "/dashboard/chat", icon: MessageCircle },
    { label: "Upload", href: "/dashboard/upload", icon: Upload },
    { label: "Presentations", href: "/dashboard/presentations", icon: Presentation },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isNavItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex">
      <style>{`
        :root {
          --client-primary: ${selectedAccount?.brandColors?.primary ?? '#003f5c'};
          --client-secondary: ${selectedAccount?.brandColors?.secondary ?? '#954e9b'};
          --client-accent: ${selectedAccount?.brandColors?.accent ?? '#ffa600'};
        }
      `}</style>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 fixed h-screen left-0 top-0 z-40 flex flex-col overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-900">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.05 }}
            className="w-full text-left text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent cursor-pointer transition-transform"
          >
            {sidebarOpen ? "Ethinos" : "E"}
          </motion.button>
        </div>

        {/* Account Switcher */}
        {sidebarOpen && (
          <div className="p-4 border-b border-slate-800 bg-slate-800/30">
            <p className="text-xs text-text-tertiary mb-2">Current Account</p>
            <select
              value={selectedAccount?.id || ""}
              onChange={(e) => switchAccount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
            >
              {accessibleAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-tertiary mt-2">
              Role: {currentUser.role}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Main nav items */}
          {navItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div key={item.href} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
                <Link
                  href={item.href}
                  style={
                    isNavItemActive(item.href)
                      ? {
                          backgroundColor: 'color-mix(in srgb, var(--client-primary) 15%, transparent)',
                          color: 'var(--client-primary)',
                          borderLeft: '2px solid var(--client-primary)',
                          paddingLeft: '12px',
                        }
                      : {}
                  }
                  className={`flex items-center gap-3 px-4 py-2 rounded transition-all cursor-pointer ${
                    isNavItemActive(item.href)
                      ? ""
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </motion.div>
            );
          })}

          {/* Divider */}
          {sidebarOpen && (
            <div className="my-2 border-t border-slate-800"></div>
          )}

          {/* Bottom nav items */}
          {bottomNavItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div key={item.href} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (navItems.length + idx) * 0.05 }}>
                <Link
                  href={item.href}
                  style={
                    isNavItemActive(item.href)
                      ? {
                          backgroundColor: 'color-mix(in srgb, var(--client-primary) 15%, transparent)',
                          color: 'var(--client-primary)',
                          borderLeft: '2px solid var(--client-primary)',
                          paddingLeft: '12px',
                        }
                      : {}
                  }
                  className={`flex items-center gap-3 px-4 py-2 rounded transition-all cursor-pointer ${
                    isNavItemActive(item.href)
                      ? ""
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 ${
          sidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300`}
      >
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <SidebarContent>{children}</SidebarContent>
    </AccountProvider>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

export interface ClientAccount {
  id: string;
  name: string;
  industry: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
  platforms: ("google" | "dv360" | "meta")[];
  clientType: "app" | "web";
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  accessibleAccountIds: string[];
}

interface AccountContextType {
  currentUser: UserProfile | null;
  selectedAccount: ClientAccount | null;
  accessibleAccounts: ClientAccount[];
  switchAccount: (accountId: string) => void;
  isLoading: boolean;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | null>(null);

// Mock data: 1 master account + 1 client account (Kotak Mutual Fund)
const MOCK_ACCOUNTS: ClientAccount[] = [
  {
    id: "ethinos",
    name: "Ethinos (All Accounts)",
    industry: "Agency",
    currency: "INR",
    platforms: ["google", "dv360", "meta"],
    clientType: "web",
    brandColors: {
      primary: "#003f5c",
      secondary: "#954e9b",
      accent: "#ffa600",
    },
  },
  {
    id: "kotak-mf",
    name: "Kotak Mutual Fund",
    industry: "Financial Services",
    currency: "INR",
    platforms: ["google", "dv360", "meta"],
    clientType: "web",
    brandColors: {
      primary: "#EC1D24",
      secondary: "#003087",
      accent: "#FFB81C",
    },
  },
];

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<ClientAccount[]>(MOCK_ACCOUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  // Fetch accounts from API on mount
  useEffect(() => {
    const initializeAccounts = async () => {
      await refreshAccounts();
      setAccountsLoaded(true);
    };
    initializeAccounts();
  }, []);

  // Initialize user and account from JWT token AFTER accounts are loaded
  useEffect(() => {
    if (!accountsLoaded) return; // Wait for accounts to load from API

    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      // No token — user not logged in, layout will redirect to /auth
      setIsLoading(false);
      return;
    }

    // Decode JWT to get user info
    try {
      const decoded = jwtDecode<{ sub: string; role: string; name: string }>(token);
      const user: UserProfile = {
        id: decoded.sub,
        name: decoded.name,
        email: "",
        role: decoded.role as UserProfile["role"],
        accessibleAccountIds: accounts.map(a => a.id), // Will be filtered by what API returns
      };
      setCurrentUser(user);

      // Default to ethinos account for admin, first account for others
      const defaultAccountId = user.role === "admin" ? (accounts[0]?.id || "ethinos") : (accounts[0]?.id || "");
      const storedAccountId = localStorage.getItem("ethinos_account_id");

      // Admin always defaults to first account (ethinos), non-admin respects stored preference
      let selectedId = defaultAccountId;
      if (user.role !== "admin" && storedAccountId) {
        const storedAccount = accounts.find(a => a.id === storedAccountId);
        if (storedAccount && accounts.map(a => a.id).includes(storedAccountId)) {
          selectedId = storedAccountId;
        }
      }
      setSelectedAccountId(selectedId);
    } catch (err) {
      // Invalid token
      localStorage.removeItem("token");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [accountsLoaded]);

  // Get accounts accessible to the current user
  const accessibleAccounts = currentUser
    ? accounts.filter((acc) =>
        currentUser.accessibleAccountIds.includes(acc.id)
      )
    : [];

  // Get the currently selected account
  const selectedAccount =
    accounts.find((acc) => acc.id === selectedAccountId) || null;

  // Switch to a different account (with validation)
  const switchAccount = (accountId: string) => {
    if (
      currentUser &&
      currentUser.accessibleAccountIds.includes(accountId)
    ) {
      setSelectedAccountId(accountId);
      localStorage.setItem("ethinos_account_id", accountId);
    }
  };

  // Refresh accounts list from API (or mock)
  const refreshAccounts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${apiUrl}/api/accounts`, { headers });
      if (res.ok) {
        const data = await res.json();
        // Map API response to ClientAccount shape
        const apiAccounts: ClientAccount[] = data.map((a: Record<string, any>) => ({
          id: a.id,
          name: a.name,
          industry: a.industry || "Unknown",
          currency: (a.currency as ClientAccount["currency"]) || "INR",
          platforms: Array.isArray(a.platforms) ? a.platforms : (a.platforms?.split(",") || ["google"]) as ClientAccount["platforms"],
          clientType: (a.client_type as ClientAccount["clientType"]) || "web",
          brandColors: {
            primary: a.brand_primary || "#003f5c",
            secondary: a.brand_secondary || "#954e9b",
            accent: a.brand_accent || "#ffa600",
          },
        }));
        const loaded = apiAccounts.length > 0 ? apiAccounts : MOCK_ACCOUNTS;
        setAccounts(loaded);
        // Update current user's accessibleAccountIds to match API response
        setCurrentUser(prev => prev ? {
          ...prev,
          accessibleAccountIds: loaded.map(a => a.id)
        } : null);
      } else {
        console.warn("Failed to fetch accounts from API, using mock data");
        setAccounts([...MOCK_ACCOUNTS]);
      }
    } catch (error) {
      console.warn("Failed to load accounts from API, using mock data:", error);
      setAccounts([...MOCK_ACCOUNTS]);
    }
  };

  const value: AccountContextType = {
    currentUser,
    selectedAccount,
    accessibleAccounts,
    switchAccount,
    isLoading,
    refreshAccounts,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

// Hook to use account context
export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return context;
}

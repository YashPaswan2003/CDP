"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

// Mock users: admin sees ethinos + kotak-mf, viewer sees only kotak-mf
const MOCK_USERS: UserProfile[] = [
  {
    id: "user-001",
    name: "Admin User",
    email: "admin@ethinos.com",
    role: "admin",
    accessibleAccountIds: ["ethinos", "kotak-mf"],
  },
  {
    id: "user-002",
    name: "Viewer User",
    email: "viewer@ethinos.com",
    role: "viewer",
    accessibleAccountIds: ["kotak-mf"],
  },
];

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<ClientAccount[]>(MOCK_ACCOUNTS);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user and account from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("ethinos_user_id") || "user-001";
    const storedAccountId = localStorage.getItem("ethinos_account_id");

    const user = MOCK_USERS.find((u) => u.id === storedUserId) || MOCK_USERS[0];
    setCurrentUser(user);

    // Default to ethinos account for admin, first accessible account for others
    const defaultAccountId =
      user.role === "admin" ? "ethinos" : user.accessibleAccountIds[0] || "kotak-mf";

    // Validate stored account ID exists in accounts, otherwise use default
    const validStored = storedAccountId && accounts.find(a => a.id === storedAccountId);
    setSelectedAccountId(validStored ? storedAccountId : defaultAccountId);

    setIsLoading(false);
  }, [accounts]);

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
      // TODO: Replace with real API call to GET /api/accounts
      // const res = await fetch('/api/accounts');
      // const newAccounts = await res.json();
      // setAccounts(newAccounts);

      // For now, just trigger a state update with mock data
      setAccounts([...MOCK_ACCOUNTS]);
    } catch (error) {
      console.error("Failed to refresh accounts:", error);
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

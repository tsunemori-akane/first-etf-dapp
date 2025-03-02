"use client";

import { useStore } from "zustand";
import { type WalletStore, createWalletStore } from "@/stores/useWalletStore";
import { type ReactNode, createContext, useContext, useRef } from "react";

export type WalletStoreApi = ReturnType<typeof createWalletStore>;
export const WalletStoreContext = createContext<WalletStoreApi | undefined>(
  undefined
);
export interface WallwtStoreProviderProps {
  children: ReactNode;
}

export const WalletStoreProvider = ({ children }: WallwtStoreProviderProps) => {
  const storeRef = useRef<WalletStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createWalletStore();
  }

  return (
    <WalletStoreContext.Provider value={storeRef.current}>
      {children}
    </WalletStoreContext.Provider>
  );
};

export const useWalletStore = <T,>(selector: (store: WalletStore) => T): T => {
  const walletStoreContext = useContext(WalletStoreContext);
  if (!walletStoreContext) {
    throw new Error("useWalletStore must be used within WalletStoreProvider");
  }
  return useStore(walletStoreContext, selector);
};

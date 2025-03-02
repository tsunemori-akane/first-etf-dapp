import { createStore } from "zustand";
import { Chain } from "viem";

export type WalletState = {
  address: `0x${string}` | undefined;
  chain: Chain | undefined;
  balance: bigint | undefined;
  isConnected: boolean;
};
export type WalletActions = {
  setAddress: (address: `0x${string}` | undefined) => void;
  setChain: (chain: Chain | undefined) => void;
  setBalance: (balance: bigint) => void;
  setConnect: (isConnect: boolean) => void;
  reset: () => void;
};

export type WalletStore = WalletState & WalletActions;

export const defaultWalletState: WalletState = {
  address: undefined,
  chain: undefined,
  balance: undefined,
  isConnected: false,
};

export const createWalletStore = (
  initState: WalletState = defaultWalletState
) => {
  return createStore<WalletStore>()((set) => ({
    ...initState,
    setAddress: (address) => set((state) => ({ address })),
    setChain: (chain) => set((state) => ({ chain })),
    setBalance: (balance) => set((state) => ({ balance })),
    setConnect: (connect) => set((state) => ({ isConnected: connect })),
    reset: () => set(() => defaultWalletState),
  }));
};

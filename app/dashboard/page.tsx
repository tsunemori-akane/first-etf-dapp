"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import Invest from "./components/invest";
import Redeem from "./components/redeem";
import { useAccount } from "wagmi";
import { useWalletStore } from "../providers/wallet-store-provider";
import { createContext, useEffect } from "react";

type PageContextType = {
  needRefresh: boolean;
  refetchETFHolding: () => void;
  refetchTokensHolding: () => void;
};
const PageContext = createContext<PageContextType | null>(null);
export default function Page() {
  const { isConnected, address } = useAccount();

  const { setConnect, setAddress } = useWalletStore((state) => state);
  const contextVal = {
    needRefresh: false,
    refetchETFHolding: () => {},
    refetchTokensHolding: () => {},
  };
  useEffect(() => {
    if (isConnected) {
      setConnect(isConnected);
      setAddress(address);
    }
  }, [isConnected]);

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>ETF App</title>
        <meta
          content="Generated by @rainbow-me/create-rainbowkit"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className="h-full flex-1 p-5">
        <div className="flex justify-between items-center">
          <div></div>
          <ConnectButton />
        </div>
        <PageContext.Provider value={contextVal}>
          <div className="flex px-5 py-5">
            <Invest />
            <Redeem />
          </div>
        </PageContext.Provider>
      </main>

      <footer className="flex items-center justify-center">
        <a href="https://rainbow.me" rel="noopener noreferrer" target="_blank">
          Made with ❤️ by your frens at 🌈
        </a>
      </footer>
    </div>
  );
}

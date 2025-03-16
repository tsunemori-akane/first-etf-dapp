"use client";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { TanstackProvider } from "./query-client-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../wagmi";

const queryClient = new QueryClient();

type Props = {
  children: React.ReactNode;
  cookie: string | null;
};

export default function Providers({ children, cookie }: Props) {
  const initialState = cookieToInitialState(config, cookie);
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <TanstackProvider>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </TanstackProvider>
    </WagmiProvider>
  );
}

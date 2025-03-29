"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import Invest from "./components/invest";
import Redeem from "./components/redeem";
import { v4_abi } from "dashboard/abis/etfv4-abi";
import { erc20Abi } from "dashboard/abis/erc20";
import { etfAddressv4 } from "dashboard/constants";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { useWalletStore } from "../providers/wallet-store-provider";
import { useEffect, useRef, useState, useMemo } from "react";
import type { TokenDetail, RedeemExpose } from "./interface";
import { PageContext } from "./context";

export default function Page() {
  const { isConnected, address } = useAccount();
  const [tokens, setDetailsOfToken] = useState<TokenDetail[]>([]);
  const tokensMap = useMemo<Record<string, TokenDetail>>(() => {
    const obj: Record<string, TokenDetail> = {};
    tokens.forEach((e) => {
      obj[e.symbol] = e;
    });
    return obj;
  }, [tokens]);
  function updateTokensMap<K extends keyof TokenDetail>(
    symbol_: string,
    key_: K,
    value: TokenDetail[K]
  ) {
    tokensMap[symbol_][key_] = value;
  }
  const { setConnect, setAddress } = useWalletStore((state) => state);
  const investRef = useRef(null);
  const redeemRef = useRef<RedeemExpose>(null);
  const contextVal = {
    needRefresh: false,
    refetchETFHolding: () => {
      console.log("重新获取ETF余额");
      redeemRef.current?.refetchEtfBalance();
    },
    refetchTokensHolding: () => {},
    updateTokensMap,
    tokensMap,
    setDetailsOfToken,
  };
  useEffect(() => {
    if (isConnected) {
      setConnect(isConnected);
      setAddress(address);
    }
  }, [isConnected]);

  // 读取 ETF 合约中的 tokens
  const { data: tokenAddresses } = useReadContract({
    abi: v4_abi,
    address: etfAddressv4,
    functionName: "getTokens",
    query: {
      enabled: !!etfAddressv4,
    },
  });
  /**
   * 0: "0x73093c5EFc127d1C61c1fdec24E769bCC74c5303"
   * 1: "0x1C8BB894f270E953154cc9f3c94a1820f5174602"
   * 2: "0xc612141C90D3467f966C5b572c4E6192414D1613"
   * 3: "0x316f1417f60A10A31117fD6724B0C6860215Cd68"
   */
  // 构建获取 symbol 和 decimals 的读取请求
  const symbolDecimalsReads = useMemo(() => {
    if (!tokenAddresses || !Array.isArray(tokenAddresses)) {
      return [];
    }

    const symbolCalls = tokenAddresses.map((tokenAddress: string) => ({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "symbol",
    }));

    const decimalsCalls = tokenAddresses.map((tokenAddress: string) => ({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals",
    }));

    return [...symbolCalls, ...decimalsCalls];
  }, [tokenAddresses]);

  // 使用 useReadContracts 获取 symbol 和 decimals
  const { data: symbolDecimalsData } = useReadContracts({
    contracts: symbolDecimalsReads,
    query: {
      enabled: !!symbolDecimalsReads,
    },
  });
  // 构建获取 balanceOf 的读取请求，仅在连接钱包时
  const balanceReads = useMemo(() => {
    if (
      !tokenAddresses ||
      !Array.isArray(tokenAddresses) ||
      !isConnected ||
      !address
    ) {
      return [];
    }

    return tokenAddresses.map((tokenAddress: string) => ({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }));
  }, [tokenAddresses, isConnected, address]);

  // 使用 useContractReads 获取 balanceOf
  const { data: balanceData, refetch: refetchBalanceData } = useReadContracts({
    contracts: balanceReads,
    query: {
      enabled: !!balanceReads,
    },
  });

  // 处理 symbol 和 decimals 数据
  useEffect(() => {
    if (
      symbolDecimalsData &&
      Array.isArray(symbolDecimalsData) &&
      tokenAddresses &&
      Array.isArray(tokenAddresses)
    ) {
      const tokensWithDetails: TokenDetail[] = tokenAddresses.map(
        (tokenAddress, index) => {
          const symbol = symbolDecimalsData[index]?.result as string;
          const decimals = symbolDecimalsData[index + tokenAddresses.length]
            ?.result as number;

          return {
            address: tokenAddress,
            symbol,
            decimals,
            payAmount: "0",
            redeemAmount: "0",
          };
        }
      );
      setDetailsOfToken(tokensWithDetails);
    }
  }, [symbolDecimalsData, tokenAddresses]);

  // 处理 balanceOf 数据
  useEffect(() => {
    if (
      balanceData &&
      Array.isArray(balanceData) &&
      tokenAddresses &&
      Array.isArray(tokenAddresses)
    ) {
      setDetailsOfToken((prevTokens) =>
        prevTokens.map((token, index) => {
          const balance = balanceData[index]?.result as bigint | undefined;
          const available = balance
            ? (Number(balance) / Math.pow(10, token.decimals)).toFixed(2) // 修改为带小数的格式，最多两位
            : "0";
          return {
            ...token,
            available,
          };
        })
      );
    }
  }, [balanceData, tokenAddresses]);

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
            <Invest ref={investRef} />
            <Redeem ref={redeemRef} />
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

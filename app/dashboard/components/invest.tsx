import { InputFeild } from "./common";
import { useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { erc20Abi } from "dashboard/abis/erc20";
import { v1_abi } from "dashboard/abis/etfv1-abi";
import { etfAddressv1 } from "dashboard/constants";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { useEffect, useMemo, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { Spin, Message } from "@arco-design/web-react";
import type { TokenDetail } from "./interface";

export default function Invest() {
  const { address, isConnected } = useWalletStore((state) => state);
  const [tokens, setDetailsOfToken] = useState<TokenDetail[]>([]);
  const [mintETFAmount, setMintETFAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const tokensMap = useMemo<Record<string, TokenDetail>>(() => {
    const obj: Record<string, TokenDetail> = {};
    tokens.forEach((e) => {
      obj[e.symbol] = e;
    });
    return obj;
  }, [tokens]);
  function updateTokenMap<K extends keyof TokenDetail>(
    symbol_: string,
    key_: K,
    value: TokenDetail[K]
  ) {
    tokensMap[symbol_][key_] = value;
  }
  // 读取 ETF 合约中的 tokens
  const { data: tokenAddresses } = useReadContract({
    abi: v1_abi,
    address: etfAddressv1,
    functionName: "getTokens",
    query: {
      enabled: !!etfAddressv1,
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
  const { data: balanceData } = useReadContracts({
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

  // 根据 mintETFAmount 读取 investTokenAmounts
  // 前端？？
  const { data: investAmountsData, refetch: refetchGetInvestAmounts } =
    useReadContract({
      abi: v1_abi,
      address: etfAddressv1,
      functionName: "getInvestTokenAmounts",
      args: [parseUnits(mintETFAmount, 18) ?? BigInt(0)],
      query: {
        enabled: !!mintETFAmount && !Number.isNaN(mintETFAmount),
      },
    });
  useEffect(() => {
    if (mintETFAmount && !Number.isNaN(mintETFAmount)) {
      refetchGetInvestAmounts();
    }
  }, [mintETFAmount]);
  useEffect(() => {
    if (investAmountsData as bigint[]) {
      setDetailsOfToken((prevTokens) =>
        prevTokens.map((token, index) => {
          const payAmount = (investAmountsData as bigint[])[index]; // 获取对应的 payAmount
          const formattedPayAmount = formatUnits(payAmount, token.decimals);
          return {
            ...token,
            payAmount: formattedPayAmount,
          };
        })
      );
    }
  }, [investAmountsData]);

  const { writeContract, isSuccess, error, isPending } = useWriteContract();
  function handleInvest() {
    if (!mintETFAmount) {
      setModalMsg("input the amount of ETF you want to mint");
      const el = document.getElementById(
        "alert_model-one"
      ) as HTMLDialogElement;
      el && el.showModal();
      return;
    }

    writeContract({
      address: etfAddressv1,
      abi: v1_abi,
      functionName: "invest",
      args: [address ?? "0x", parseUnits(mintETFAmount, 18) ?? BigInt(0)],
    });
  }
  useEffect(() => {
    if (isSuccess) {
      alert("Invest successful!"); // 弹出提示
      refetchGetInvestAmounts();
    } else if (error) {
      Message.error("Invest failed, check your available or your gas.");
    }
  }, [error, isSuccess]);
  useEffect(() => {
    if (isPending) {
      setLoading(true);
    } else setLoading(false);
  }, [isPending]);
  return (
    <Spin loading={loading}>
      <div className="card w-96 bg-base-100 card-xl shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Invest</h2>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">You Receive</legend>
            <label className="input input-lg">
              <input
                type="text"
                placeholder="Type here"
                value={mintETFAmount}
                onChange={(e) => {
                  setMintETFAmount(e.target.value);
                }}
              />
              rETF
            </label>
          </fieldset>

          <div className="divider"></div>
          {tokens &&
            tokens.length > 0 &&
            Object.values(tokensMap).map((token, index) => {
              // console.log("out", token);
              return (
                <InputFeild
                  updateTokensMap={updateTokenMap}
                  token={token}
                  key={index}
                />
              );
            })}
          <div className="justify-end card-actions">
            <button className="btn btn-primary" onClick={() => handleInvest()}>
              Invest
            </button>
            <dialog id="alert_model-one" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">Hello!</h3>
                <p className="py-4">{modalMsg}</p>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>
        </div>
      </div>
    </Spin>
  );
}

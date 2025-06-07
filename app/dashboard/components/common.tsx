import type { TokenDetail, SingleInvestExpose } from "../interface";
import {
  useSimulateContract,
  useWriteContract,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi } from "dashboard/abis/erc20";
import { etfAddressv4, usdcAddress, wethAddress } from "../constants";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { usePageContext } from "../context";
import { Select } from "antd";
import styles from "./components.module.scss";

export function TokenHoldings({
  holdingNum,
  decimal,
}: {
  holdingNum?: bigint;
  decimal?: number;
}) {
  return (
    <div className="flex flex-row-reverse">
      <div className="badge badge-warning badge-sm font-bold">
        hold:{" "}
        {Number(formatUnits(holdingNum ?? BigInt(0), decimal!)).toFixed(2) ?? 0}
      </div>
    </div>
  );
}
// <K extends keyof TokenDetail>
type InputFeildProps = {
  children?: React.ReactNode;
  token: TokenDetail;
  index: number;
};

export const InputFeildForSingleInvest = forwardRef<
  SingleInvestExpose,
  { payMount: string }
>((props, ref) => {
  useImperativeHandle(ref, () => ({
    currentToken,
  }));
  const { address, isConnected } = useWalletStore((state) => state);
  const pageContext = usePageContext();
  const [investToken, setInvestToken] = useState<number>();
  const [currentToken, setCurrentToken] = useState<
    (TokenDetail & { index: number }) | null
  >(null);

  const { data: balanceofEth } = useReadContract({
    address: wethAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // 使用 useMemo 包装 ETH_TOKEN 的初始化
  const ETH_TOKEN = useMemo<TokenDetail>(
    () => ({
      address: wethAddress,
      symbol: "ETH",
      decimals: 18,
      available: balanceofEth ?? BigInt(0),
    }),
    [balanceofEth]
  );

  const readRank: Array<keyof TokenDetail> = [
    "symbol",
    "decimals",
    "available",
    "allowance",
  ];
  const readUsdcParams = [
    {
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "symbol",
    },
    {
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "decimals",
    },
    {
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address!],
    },
    {
      abi: erc20Abi,
      address: usdcAddress,
      functionName: "allowance",
      args: [address!, etfAddressv4],
    },
  ];
  // 使用 useReadContracts 获取usdc 的 symbol 和 decimals
  const {
    data: usdcSymbolDecimalsData,
    refetch,
    isRefetching,
  } = useReadContracts({
    contracts: readUsdcParams,
  });

  const tokenOptions = useMemo<Array<TokenDetail & { index: number }>>(() => {
    const usdcDetail: Partial<TokenDetail> = {
      address: usdcAddress,
    };

    (usdcSymbolDecimalsData || []).forEach((e, i: number) => {
      usdcDetail[readRank[i]] = e.result;
    });
    return (
      pageContext?.tokens
        .concat([(usdcDetail as TokenDetail) || []])
        .concat([ETH_TOKEN || []])
        .map((e, i) => ({ index: i, ...e })) || []
    );
  }, [pageContext?.tokens, usdcSymbolDecimalsData, ETH_TOKEN]);

  const {
    writeContract,
    isPending,
    isSuccess: isSuccessOfAuth,
  } = useWriteContract({});

  const { data: simulateRes } = useSimulateContract({
    address: currentToken?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "approve",
    args: [
      etfAddressv4,
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      ),
    ],
    query: {
      enabled: !!currentToken,
    },
  });

  const authorizingStatus = useMemo(
    () => isPending || isRefetching,
    [isPending, isRefetching]
  );
  function handleSelectChange(e: number) {
    setInvestToken(e);
    setCurrentToken(tokenOptions[e]);
  }
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend w-full">
        <div className="w-full inline-flex items-center justify-between">
          <div className="whitespace-nowrap">You Pay</div>
          {tokenOptions && (
            <Select
              className={styles.ant_select}
              value={investToken}
              onChange={(e) => handleSelectChange(e)}
              placeholder="select token"
              variant="borderless"
              style={{ width: "130px" }}
              options={tokenOptions}
              fieldNames={{ label: "symbol", value: "index" }}
            />
          )}
        </div>
      </legend>

      <TokenHoldings
        holdingNum={currentToken?.available}
        decimal={currentToken?.decimals}
      />
      <label className="input input-lg">
        {" "}
        {!currentToken?.allowance && (
          <button
            className={cn("btn btn-xs", "btn-error")}
            disabled={authorizingStatus}
            onClick={() =>
              simulateRes?.request && writeContract(simulateRes.request)
            }
          >
            {authorizingStatus ? "Authorizing" : "Unauthorized"}
          </button>
        )}
        {!!currentToken?.allowance && (
          <div className="badge badge-accent cursor-none">Authorized</div>
        )}
        <input
          type="text"
          className="grow"
          placeholder=""
          readOnly={true}
          value={currentToken?.payAmount || 0}
        />
      </label>
    </fieldset>
  );
});
export function InputFeildForInvest({ token, index }: InputFeildProps) {
  const { address, isConnected } = useWalletStore((state) => state);
  const pageContext = usePageContext();

  const {
    writeContract,
    isPending,
    isSuccess: isSuccessOfAuth,
  } = useWriteContract({});

  const {
    data: allowanceData,
    refetch: refetchAllowance,
    isRefetching,
  } = useReadContract({
    abi: erc20Abi,
    address: token?.address as `0x${string}`,
    functionName: "allowance",
    args: [address!, etfAddressv4],
    query: {
      enabled: !!address && isConnected,
    },
  });

  const { data: simulateRes } = useSimulateContract({
    address: token?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "approve",
    args: [
      etfAddressv4,
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      ),
    ],
    query: {
      enabled: !!token,
    },
  });

  useEffect(() => {
    if (isSuccessOfAuth) {
      refetchAllowance();
    }
  }, [isSuccessOfAuth]);

  useEffect(() => {
    if (allowanceData) {
      pageContext?.setDetailsOfToken((tokens) => {
        tokens[index].allowance = allowanceData;
        return [...tokens];
      });
    }
  }, [allowanceData]);

  const authorizingStatus = useMemo(
    () => isPending || isRefetching,
    [isPending, isRefetching]
  );
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">You Pay</legend>
      {token && (
        <TokenHoldings
          holdingNum={token?.available}
          decimal={token?.decimals}
        />
      )}

      <label className="input input-lg">
        {" "}
        {!allowanceData && (
          <button
            className={cn("btn btn-xs", "btn-error")}
            disabled={authorizingStatus}
            onClick={() =>
              simulateRes?.request && writeContract(simulateRes.request)
            }
          >
            {authorizingStatus ? "Authorizing" : "Unauthorized"}
          </button>
        )}
        {!!allowanceData && (
          <div className="badge badge-accent cursor-none">Authorized</div>
        )}
        <input
          type="text"
          className="grow"
          placeholder=""
          readOnly={true}
          value={token?.payAmount}
        />
        {token?.symbol}
      </label>
    </fieldset>
  );
}

export function InputFeildForRedeem({
  token,
  index,
}: {
  children?: React.ReactNode;
  token: TokenDetail;
  index: number;
}) {
  const { address, isConnected } = useWalletStore((state) => state);

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">You Receive</legend>
      <TokenHoldings holdingNum={token?.available} decimal={token?.decimals} />
      <label className="input input-lg">
        {" "}
        <input
          type="text"
          className="grow"
          placeholder=""
          readOnly={true}
          value={token?.redeemAmount}
        />
        {token?.symbol}
      </label>
    </fieldset>
  );
}

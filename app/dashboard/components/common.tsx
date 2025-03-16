import type { TokenDetail } from "./interface";
import { useSimulateContract, useWriteContract, useReadContract } from "wagmi";
import { erc20Abi } from "dashboard/abis/erc20";
import { etfAddressv1 } from "../constants";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
export function TokenHoldings({ holdingNum }: { holdingNum?: string }) {
  return (
    <div className="flex flex-row-reverse">
      <div className="badge badge-warning badge-sm font-bold">
        hold: {holdingNum ?? 0}
      </div>
    </div>
  );
}
// <K extends keyof TokenDetail>
type InputFeildProps = {
  children?: React.ReactNode;
  token: TokenDetail;
  updateTokensMap: <K extends keyof TokenDetail>(
    symbol: string,
    key: K,
    num: TokenDetail[K]
  ) => void;
};
export function InputFeild({ token, updateTokensMap }: InputFeildProps) {
  const { address, isConnected } = useWalletStore((state) => state);
  const { writeContract, isPending, isSuccess } = useWriteContract({});
  const {
    data: allowanceData,
    refetch: refetchAllowance,
    isRefetching,
  } = useReadContract({
    abi: erc20Abi,
    address: token?.address as `0x${string}`,
    functionName: "allowance",
    args: [address!, etfAddressv1],
    query: {
      enabled: !!address && isConnected,
    },
  });

  const { data: simulateRes } = useSimulateContract({
    address: token?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "approve",
    args: [
      etfAddressv1,
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      ),
    ],
    query: {
      enabled: !!token,
    },
  });

  useEffect(() => {
    if (isSuccess) {
      refetchAllowance();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (allowanceData)
      updateTokensMap(token.symbol, "allowance", allowanceData);
  }, [allowanceData]);

  const authorizingStatus = useMemo(
    () => isPending || isRefetching,
    [isPending, isRefetching]
  );
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">You Pay</legend>
      <TokenHoldings holdingNum={token?.available} />
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
          value={token.payAmount}
        />
        {token?.symbol}
      </label>
    </fieldset>
  );
}

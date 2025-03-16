import { TokenHoldings } from "./common";
import { etfAddressv1 } from "dashboard/constants";
import { useReadContract, useReadContracts } from "wagmi";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { erc20Abi } from "dashboard/abis/erc20";
import { formatUnits } from "viem";
import { useEffect, useState, useImperativeHandle } from "react";
export default function Redeem() {
  // const rerender = useState({})[1];
  // useEffect(() => {
  //   console.log("Re");
  // }, []);
  // useImperativeHandle(ref, () => {
  //   return {
  //     getHoldOfETF: () => {
  //       refetchEtfBalance();
  //     },
  //   };
  // });
  const { address, isConnected } = useWalletStore((state) => state);
  // 读取用户的 ETF 余额
  const { data: etfBalance, refetch: refetchEtfBalance } = useReadContract({
    abi: erc20Abi,
    address: etfAddressv1,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });
  return (
    <>
      <div className="card w-96 bg-base-100 card-xl shadow-sm">
        <div className="card-body flex flex-column justify-between">
          <div>
            <h2 className="card-title">Redeem</h2>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">You Receive</legend>
              <TokenHoldings
                holdingNum={formatUnits(etfBalance ?? BigInt(0), 18)}
              />
              <label className="input input-lg">
                <input type="text" placeholder="Type here" />
                rETF
              </label>
            </fieldset>
          </div>

          <div className="justify-end card-actions">
            <button className="btn btn-primary">Redeem</button>
          </div>
        </div>
      </div>
    </>
  );
}

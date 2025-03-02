import { InputFeild } from "./common";
import { useReadContract } from "wagmi";
import { erc20Abi } from "dashboard/abis/erc20";
import { etfAddress } from "dashboard/constants";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { useEffect } from "react";
export default function Invest() {
  const { address } = useWalletStore((state) => state);
  // 读取用户的 ETF 余额
  console.log(address);
  const { data: etfBalance, refetch: refetchEtfBalance } = useReadContract({
    abi: erc20Abi,
    address: etfAddress,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    console.log("etfBalance", etfBalance);
  }, [etfBalance]);
  return (
    <>
      <div className="card w-96 bg-base-100 card-xl shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Invest</h2>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">You Receive</legend>
            <label className="input input-lg">
              <input type="text" placeholder="Type here" />
              rETF
            </label>
          </fieldset>

          <div className="divider"></div>
          <InputFeild symbol="WBTC" />
          <InputFeild symbol="WETH" />
          <InputFeild symbol="LINK" />

          <div className="justify-end card-actions">
            <button className="btn btn-primary">Invest</button>
          </div>
        </div>
      </div>
    </>
  );
}

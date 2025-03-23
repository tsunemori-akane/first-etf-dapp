import { InputFeildForInvest as InputFeild } from "./common";
import { useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { v4_abi } from "dashboard/abis/etfv4-abi";
import { etfAddressv4 } from "dashboard/constants";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import {
  useEffect,
  useMemo,
  useState,
  forwardRef,
  Dispatch,
  SetStateAction,
} from "react";
import { parseUnits, formatUnits } from "viem";
import { Spin, message } from "antd";
import type { TokenDetail } from "../interface";
import { usePageContext } from "../context";
type InvestProps = {
  tokensMap: Record<string, TokenDetail>;
  setDetailsOfToken: Dispatch<SetStateAction<TokenDetail[]>>;
};
const Invest = forwardRef<HTMLElement, InvestProps>((props, ref) => {
  // useImperativeHandle(ref, () => ({
  //   refetchBalanceData,
  // }));
  const { tokensMap, setDetailsOfToken } = props;
  const { address, isConnected } = useWalletStore((state) => state);
  const [mintETFAmount, setMintETFAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const pageContext = usePageContext();
  console.log(pageContext);
  // 根据 mintETFAmount 读取 investTokenAmounts
  // 前端？？
  const { data: investAmountsData, refetch: refetchGetInvestAmounts } =
    useReadContract({
      abi: v4_abi,
      address: etfAddressv4,
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
      address: etfAddressv4,
      abi: v4_abi,
      functionName: "invest",
      args: [address ?? "0x", parseUnits(mintETFAmount, 18) ?? BigInt(0)],
    });
  }
  useEffect(() => {
    if (isSuccess) {
      //Message.success("Invest successful!");
      pageContext?.refetchETFHolding();
    } else if (error) {
      console.error("Invest failed, check your available or your gas.");
      // Message.error("Invest failed, check your available or your gas.");
    }
  }, [error, isSuccess]);
  useEffect(() => {
    if (isPending) {
      setLoading(true);
    } else setLoading(false);
  }, [isPending]);
  return (
    <Spin spinning={loading}>
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
          {tokensMap &&
            Object.values(tokensMap).map((token, index) => {
              // console.log("out", token);
              return <InputFeild token={token} key={index} />;
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
});
export default Invest;

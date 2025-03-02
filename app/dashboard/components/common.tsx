export function TokenHoldings({ holdingNum }: { holdingNum?: number }) {
  return (
    <div className="flex flex-row-reverse">
      <div className="badge badge-warning badge-sm font-bold">
        hold: {holdingNum ?? 0}
      </div>
    </div>
  );
}

export function InputFeild({
  symbol,
  isAuthorized,
}: {
  symbol: string;
  isAuthorized?: boolean;
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">You Pay</legend>
      <TokenHoldings />
      <label className="input input-lg">
        <span className="badge badge-error badge-sm">
          {" "}
          {isAuthorized ? "athorized" : "unAthorized"}
        </span>
        <input type="text" className="grow" placeholder="" />
        {symbol}
      </label>
    </fieldset>
  );
}

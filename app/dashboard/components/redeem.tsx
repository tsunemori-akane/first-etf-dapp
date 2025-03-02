import { InputFeild } from "./common";
export default function Redeem() {
  return (
    <>
      <div className="card w-96 bg-base-100 card-xl shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Redeem</h2>
          <InputFeild symbol="rETF" />
          <div className="justify-end card-actions">
            <button className="btn btn-primary">Redeem</button>
          </div>
        </div>
      </div>
    </>
  );
}

import { redirect } from "next/navigation";
import "@ant-design/v5-patch-for-react-19";

export default function Home() {
  return redirect("/dashboard");
}

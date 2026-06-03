import { redirect } from "next/navigation";

const CANCEL_REDIRECT = "https://www.purgolabs.is/checkout";

export default function CancelPage() {
  redirect(CANCEL_REDIRECT);
}

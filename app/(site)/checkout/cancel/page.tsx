import { redirect } from "next/navigation";

const CANCEL_REDIRECT = "https://www.purgolabs.com/checkout";

/**
 * PayPal / legacy flows: user cancelled checkout here before completing payment.
 * We then redirect them to Purgo Labs checkout.
 */
export default function CheckoutCancelPage() {
  redirect(CANCEL_REDIRECT);
}

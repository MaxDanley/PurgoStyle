import { redirect } from "next/navigation";

const CANCEL_REDIRECT = "https://www.purgolabs.com/checkout";

/**
 * Stripe sends users here when they cancel checkout.
 * We then redirect them to Purgo Labs checkout.
 */
export default function CheckoutCancelPage() {
  redirect(CANCEL_REDIRECT);
}

import Link from "next/link";

export default async function SuccessErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="max-w-md text-center p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment verification issue</h1>
        <p className="text-gray-600 mb-6">
          {reason === "no_session"
            ? "No session was provided. Please complete checkout from the beginning."
            : reason === "invalid_status"
              ? "We couldn't confirm your payment status."
              : "Something went wrong verifying your payment. If you were charged, we'll process your order shortly."}{" "}
          Contact us at{" "}
          <a href="mailto:help@summersteez.com" className="text-brand-600 hover:underline">
            help@summersteez.com
          </a>
          .
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Return to home
        </Link>
    </div>
  );
}

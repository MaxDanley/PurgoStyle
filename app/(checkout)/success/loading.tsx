export default function SuccessLoading() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"
        aria-hidden
      />
      <p className="text-sm text-gray-500">Verifying payment…</p>
    </div>
  );
}

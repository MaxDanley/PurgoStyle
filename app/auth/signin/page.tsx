"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { trackPageView } from "@/lib/analytics";
import { usePathname } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Track page view
  useEffect(() => {
    if (pathname) {
      trackPageView(window.location.href, 'Sign In - Purgo Style Labs', {
        page_type: 'signin',
      });
    }
  }, [pathname]);

  // Redirect if already signed in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/account");
    }
  }, [status, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Signed in successfully!");
        // Force refresh to update session state
        window.location.href = "/account";
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-block">
            <Image
              src="/logo-small-copy.png"
              alt="Purgo Style Labs"
              width={80}
              height={80}
              className="mx-auto mb-6 drop-shadow-2xl hover:scale-110 transition-transform duration-300"
            />
          </Link>
          <h1 className="sr-only">Sign In to Your Account</h1>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>

        {/* Sign In Card */}
        <div className="card p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-gray-600">
          🔒 Your data is protected with industry-standard encryption
        </p>
      </div>
    </div>
  );
}

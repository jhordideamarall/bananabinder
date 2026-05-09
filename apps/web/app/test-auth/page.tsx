"use client";

import { useState } from "react";

export default function AuthTestPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: request, 2: verify
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<unknown>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        setMessage(
          "OTP sent! " + (data.debug_otp ? `(Debug: ${data.debug_otp})` : "")
        );
        setStep(2);
      } else {
        setMessage(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setMessage("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Login success!");
        setSession(data.session);
      } else {
        setMessage(data.error || "Invalid OTP");
      }
    } catch (err) {
      setMessage("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Test (WhatsApp OTP)</h1>

      {step === 1 ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Phone Number (62...)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="628123456789"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-blue-300"
          >
            {loading ? "Sending..." : "Request OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <p className="text-sm mb-2">Sent to: {phone}</p>
            <label className="block text-sm font-medium">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white p-2 rounded disabled:bg-green-300"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm text-gray-500"
          >
            Change Number
          </button>
        </form>
      )}

      {message && (
        <div
          className={`mt-4 p-2 rounded ${message.includes("Error") || message.includes("Failed") ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
        >
          {message}
        </div>
      )}

      {session && (
        <div className="mt-8">
          <h2 className="font-bold">Session Data:</h2>
          <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto max-h-40">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

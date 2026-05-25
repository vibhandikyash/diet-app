"use client";

import { FormEvent, useState } from "react";

interface HydrationLog {
  id: string;
  cupsConsumed: number;
  cupSize: number;
  loggedAt?: string;
}

export default function QuickHydrationLog() {
  const [selectedCupSize, setSelectedCupSize] = useState(8);
  const [customAmount, setCustomAmount] = useState("");
  const [todayLogs, setTodayLogs] = useState<HydrationLog[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function logWater(cupSize: number) {
    setIsLogging(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/hydration/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cupsConsumed: 1,
          cupSize,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to log water");
      }

      const createdLog = data.log || data;
      setTodayLogs((logs) => [createdLog, ...logs]);
      setSuccessMessage("Logged water.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log water");
    } finally {
      setIsLogging(false);
    }
  }

  function handleCustomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customCupSize = Number(customAmount);

    if (!Number.isInteger(customCupSize) || customCupSize < 1) {
      setErrorMessage("Enter a whole ounce amount.");
      return;
    }

    logWater(customCupSize);
  }

  return (
    <section className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Quick water log</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {[8, 12, 16].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSelectedCupSize(amount);
                logWater(amount);
              }}
              disabled={isLogging}
              className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm ${
                selectedCupSize === amount
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isLogging && selectedCupSize === amount ? "Logging..." : `${amount}oz`}
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="mt-4 flex gap-3">
          <input
            type="number"
            min="1"
            step="1"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            className="block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
            aria-label="Custom cup size in ounces"
          />
          <button
            type="submit"
            disabled={isLogging}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Log custom
          </button>
        </form>

        {errorMessage && (
          <p className="mt-3 text-sm text-red-700" aria-live="assertive">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="mt-3 text-sm text-green-700" aria-live="polite">
            {successMessage}
          </p>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900">Today&apos;s water log</h4>
          {todayLogs.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No water logged yet today.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {todayLogs.map((log) => (
                <li key={log.id} className="py-2 text-sm text-gray-700">
                  {log.cupsConsumed} cup, {log.cupSize}oz
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

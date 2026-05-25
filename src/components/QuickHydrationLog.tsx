"use client";

import { useState } from "react";

type HydrationLog = {
  id: string;
  cupsConsumed: number;
  cupSize: number;
  loggedAt: string;
};

const presetCupSizes = [
  { cupSize: 8, label: "8oz" },
  { cupSize: 12, label: "12oz" },
  { cupSize: 16, label: "16oz" },
];

export default function QuickHydrationLog() {
  const [customAmount, setCustomAmount] = useState("");
  const [todayLogs, setTodayLogs] = useState<HydrationLog[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function logHydration(cupSize: number) {
    setIsLogging(true);
    setErrorMessage("");
    setSuccessMessage("");

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

      if (!response.ok) {
        throw new Error("Unable to log water");
      }

      const data = (await response.json()) as { log: HydrationLog };
      const createdLog = data.log;
      setTodayLogs((currentLogs) => [createdLog, ...currentLogs]);
      setSuccessMessage(`Logged ${cupSize}oz`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log water");
    } finally {
      setIsLogging(false);
    }
  }

  function logCustomAmount() {
    const cupSize = Number(customAmount);

    if (!Number.isInteger(cupSize) || cupSize <= 0) {
      setErrorMessage("Enter a valid custom cup size");
      return;
    }

    logHydration(cupSize);
    setCustomAmount("");
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Quick water log</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {presetCupSizes.map(({ cupSize, label }) => (
          <button
            key={cupSize}
            type="button"
            onClick={() => logHydration(cupSize)}
            disabled={isLogging}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isLogging ? "Logging..." : label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex max-w-sm gap-2">
        <input
          type="number"
          min="1"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          aria-label="Custom cup size"
        />
        <button
          type="button"
          onClick={logCustomAmount}
          disabled={isLogging}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          Log custom
        </button>
      </div>

      {successMessage && (
        <p className="mt-3 text-sm font-medium text-green-700">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="mt-3 text-sm font-medium text-red-700">{errorMessage}</p>
      )}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-gray-900">Today's water log</h3>
        {todayLogs.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">No water logged yet today.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {todayLogs.map((log) => (
              <li key={log.id} className="flex justify-between py-2 text-sm">
                <span className="text-gray-700">{new Date(log.loggedAt).toLocaleTimeString()}</span>
                <span className="font-medium text-gray-900">
                  {log.cupsConsumed} cup, {log.cupSize}oz
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

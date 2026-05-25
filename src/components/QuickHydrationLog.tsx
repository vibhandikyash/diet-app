"use client";

import { useState } from "react";

type HydrationLog = {
  id: string;
  cupsConsumed: number;
  cupSize: number;
  loggedAt?: string;
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

  async function logWater(cupSize: number) {
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

      const data = await response.json();
      const createdLog = data.log as HydrationLog;
      setTodayLogs((currentLogs) => [createdLog, ...currentLogs]);
      setSuccessMessage(`Logged ${cupSize}oz`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log water");
    } finally {
      setIsLogging(false);
    }
  }

  function handleCustomLog() {
    const cupSize = Number(customAmount);

    if (!Number.isInteger(cupSize) || cupSize <= 0) {
      setErrorMessage("Enter a valid amount");
      return;
    }

    void logWater(cupSize);
    setCustomAmount("");
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick hydration</h2>
        <p className="text-sm text-gray-600">Log a cup without leaving the dashboard.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetCupSizes.map(({ cupSize, label }) => (
          <button
            key={cupSize}
            type="button"
            disabled={isLogging}
            onClick={() => logWater(cupSize)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          min="1"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Custom oz"
        />
        <button
          type="button"
          disabled={isLogging}
          onClick={handleCustomLog}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Log custom
        </button>
      </div>

      <div className="mt-3 min-h-5 text-sm">
        {isLogging && <span className="text-gray-600">Logging...</span>}
        {successMessage && <span className="text-emerald-700">{successMessage}</span>}
        {errorMessage && <span className="text-red-600">{errorMessage}</span>}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-medium text-gray-900">{"Today's water log"}</h3>
        {todayLogs.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No water logged yet today.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 text-sm text-gray-700">
            {todayLogs.map((log) => (
              <li key={log.id} className="py-2">
                Added {log.cupsConsumed} cup at {log.cupSize}oz
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type HydrationLog = {
  id: string;
  cupsConsumed: number;
  cupSize: number;
  loggedAt: string;
};

type HydrationSummary = {
  totalCups: number;
  goalAchieved?: boolean | null;
};

const cupSizeOptions = [
  { size: 8, label: "8oz" },
  { size: 12, label: "12oz" },
  { size: 16, label: "16oz" },
];
const dailyGoalCups = 8;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isTodayLog(log: HydrationLog) {
  return new Date(log.loggedAt).toISOString().slice(0, 10) === todayKey();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function QuickHydrationLog() {
  const [selectedCupSize, setSelectedCupSize] = useState(8);
  const [customAmount, setCustomAmount] = useState("");
  const [todayLogs, setTodayLogs] = useState<HydrationLog[]>([]);
  const [summary, setSummary] = useState<HydrationSummary>({ totalCups: 0 });
  const [isLogging, setIsLogging] = useState(false);
  const [savingLogId, setSavingLogId] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editCupsConsumed, setEditCupsConsumed] = useState("1");
  const [editCupSize, setEditCupSize] = useState("8");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.round((summary.totalCups / dailyGoalCups) * 100));
  }, [summary.totalCups]);

  useEffect(() => {
    const loadHydration = async () => {
      try {
        const date = todayKey();
        const [logsResponse, summaryResponse] = await Promise.all([
          fetch(`/api/hydration/logs?date=${date}`),
          fetch(`/api/hydration/summary?startDate=${date}&endDate=${date}`),
        ]);

        if (logsResponse.ok) {
          const data = await logsResponse.json();
          setTodayLogs(data.logs ?? []);
        }

        if (summaryResponse.ok) {
          const data = await summaryResponse.json();
          setSummary(data.summaries?.[0] ?? { totalCups: 0 });
        }
      } catch {
        setErrorMessage("Could not load hydration logs.");
      }
    };

    loadHydration();
  }, []);

  async function logWater(cupSize: number) {
    setIsLogging(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/hydration/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cupsConsumed: 1, cupSize }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not log water.");
      }

      const createdLog = data.log;
      setTodayLogs((current) => [createdLog, ...current]);
      setSummary(data.summary);
      setSuccessMessage("Logged");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not log water.");
    } finally {
      setIsLogging(false);
    }
  }

  function handleCustomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(customAmount);

    if (!Number.isInteger(amount) || amount <= 0) {
      setErrorMessage("Enter a whole-ounce cup size.");
      return;
    }

    setSelectedCupSize(amount);
    setCustomAmount("");
    logWater(amount);
  }

  function startEdit(log: HydrationLog) {
    setEditingLogId(log.id);
    setEditCupsConsumed(String(log.cupsConsumed));
    setEditCupSize(String(log.cupSize));
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleEditLog(logId: string) {
    setSavingLogId(logId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/hydration/logs/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cupsConsumed: Number(editCupsConsumed),
          cupSize: Number(editCupSize),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update hydration log.");
      }

      setTodayLogs((current) =>
        current.map((log) => (log.id === logId ? data.log : log))
      );
      setSummary(data.summary);
      setEditingLogId(null);
      setSuccessMessage("Updated");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update hydration log.");
    } finally {
      setSavingLogId(null);
    }
  }

  async function handleDeleteLog(log: HydrationLog) {
    if (!window.confirm("Delete this hydration log?")) {
      return;
    }

    setDeletingLogId(log.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/hydration/logs/${log.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete hydration log.");
      }

      setTodayLogs((current) => current.filter((item) => item.id !== log.id));
      setSummary(data.summary);
      setSuccessMessage("Deleted");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not delete hydration log.");
    } finally {
      setDeletingLogId(null);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Hydration</h2>
          <p className="mt-1 text-sm text-gray-600">
            {summary.totalCups} of {dailyGoalCups} cups today
          </p>
        </div>
        <div className="flex gap-2">
          {cupSizeOptions.map(({ size, label }) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                setSelectedCupSize(size);
                logWater(size);
              }}
              disabled={isLogging}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isLogging && selectedCupSize === size ? "Logging" : label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleCustomSubmit} className="mt-5 flex gap-2">
        <input
          type="number"
          min="1"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          placeholder="Custom oz"
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isLogging}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          Log custom
        </button>
      </form>

      {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
      {successMessage && <p className="mt-3 text-sm text-emerald-700">{successMessage}</p>}

      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900">{"Today's water log"}</h3>
        <div className="mt-3 divide-y divide-gray-100 rounded-md border border-gray-200">
          {todayLogs.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No water logged yet.</p>
          ) : (
            todayLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                {editingLogId === log.id ? (
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="number"
                      min="1"
                      value={editCupsConsumed}
                      onChange={(event) => setEditCupsConsumed(event.target.value)}
                      className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      aria-label="Cups consumed"
                    />
                    <input
                      type="number"
                      min="1"
                      value={editCupSize}
                      onChange={(event) => setEditCupSize(event.target.value)}
                      className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      aria-label="Cup size"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.cupsConsumed} cup{log.cupsConsumed === 1 ? "" : "s"} at {log.cupSize}oz
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(log.loggedAt)}
                      {!isTodayLog(log) && <span> · Read-only historical entry</span>}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {editingLogId === log.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditLog(log.id)}
                        disabled={savingLogId === log.id}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                      >
                        {savingLogId === log.id ? "Saving" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLogId(null)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(log)}
                        disabled={!isTodayLog(log) || deletingLogId === log.id}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log)}
                        disabled={!isTodayLog(log) || deletingLogId === log.id}
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        {deletingLogId === log.id ? "Deleting" : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

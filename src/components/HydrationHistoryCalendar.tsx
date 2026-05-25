"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatHydrationDate,
  getHydrationStatus,
  getSevenDayHydrationWindow,
} from "@/lib/hydration-history";

type HydrationSummary = {
  id: string;
  date: string;
  totalCups: number;
};

type HydrationGoal = {
  dailyTargetCups: number;
};

type HydrationLog = {
  id: string;
  cupsConsumed: number;
  cupSize: number;
  loggedAt: string;
};

const statusClasses = {
  green: "border-green-300 bg-green-50 text-green-900",
  yellow: "border-yellow-300 bg-yellow-50 text-yellow-900",
  red: "border-red-300 bg-red-50 text-red-900",
};

function formatDayLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

function formatLogTime(loggedAt: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(loggedAt));
}

export default function HydrationHistoryCalendar() {
  const [todayKey, setTodayKey] = useState(() => formatHydrationDate(new Date()));
  const [summaries, setSummaries] = useState<HydrationSummary[]>([]);
  const [dailyTargetCups, setDailyTargetCups] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailedLogs, setDetailedLogs] = useState<HydrationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const days = useMemo(
    () => getSevenDayHydrationWindow(new Date(`${todayKey}T12:00:00.000Z`)),
    [todayKey]
  );

  const summaryByDate = useMemo(() => {
    return new Map(
      summaries.map((summary) => [
        formatHydrationDate(new Date(summary.date)),
        summary,
      ])
    );
  }, [summaries]);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const startDate = days[0];
      const endDate = days[days.length - 1];
      const [goalResponse, summaryResponse] = await Promise.all([
        fetch("/api/hydration/goal"),
        fetch(`/api/hydration/summary?startDate=${startDate}&endDate=${endDate}`),
      ]);

      if (goalResponse.ok) {
        const goal = (await goalResponse.json()) as HydrationGoal;
        setDailyTargetCups(goal.dailyTargetCups);
      } else if (goalResponse.status === 404) {
        setDailyTargetCups(null);
      } else {
        throw new Error("Unable to load hydration goal");
      }

      if (!summaryResponse.ok) {
        throw new Error("Unable to load hydration history");
      }

      const data = (await summaryResponse.json()) as { summaries: HydrationSummary[] };
      setSummaries(data.summaries ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load hydration history");
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  const loadDetailedLogs = useCallback(async (dateKey: string) => {
    setSelectedDate(dateKey);
    setIsLoadingLogs(true);

    try {
      const response = await fetch(`/api/hydration/logs?date=${dateKey}`);

      if (!response.ok) {
        throw new Error("Unable to load hydration logs");
      }

      const data = (await response.json()) as { logs: HydrationLog[] };
      setDetailedLogs(data.logs ?? []);
    } catch (error) {
      setDetailedLogs([]);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load hydration logs");
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextTodayKey = formatHydrationDate(new Date());
      setTodayKey((currentTodayKey) =>
        currentTodayKey === nextTodayKey ? currentTodayKey : nextTodayKey
      );
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Hydration history</h2>
        <p className="mt-1 text-sm text-gray-600">
          Past seven days ending today.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((dateKey) => {
          const summary = summaryByDate.get(dateKey);
          const totalCups = summary?.totalCups ?? 0;
          const status = getHydrationStatus(totalCups, dailyTargetCups);
          const isSelected = selectedDate === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => loadDetailedLogs(dateKey)}
              className={`rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${statusClasses[status.tone]} ${
                isSelected ? "ring-2 ring-indigo-500 ring-offset-2" : ""
              }`}
              aria-pressed={isSelected}
            >
              <span className="block text-sm font-medium">{formatDayLabel(dateKey)}</span>
              <span className="mt-3 block text-2xl font-semibold">
                {totalCups} / {dailyTargetCups ?? "-"}
              </span>
              <span
                className="mt-1 block text-xs uppercase tracking-wide"
                aria-label="cups consumed / dailyTargetCups"
              >
                cups / goal
              </span>
              <span className="mt-3 inline-flex rounded-full bg-white/70 px-2 py-1 text-xs font-medium">
                {status.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedDate ? `Logs for ${formatDayLabel(selectedDate)}` : "Select a day"}
        </h3>

        {!selectedDate && (
          <p className="mt-2 text-sm text-gray-600">
            Choose a calendar day to inspect individual hydration entries.
          </p>
        )}

        {selectedDate && isLoadingLogs && (
          <p className="mt-3 text-sm text-gray-600">Loading logs...</p>
        )}

        {selectedDate && !isLoadingLogs && detailedLogs.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No hydration logs for this date.</p>
        )}

        {detailedLogs.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100">
            {detailedLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-700">{formatLogTime(log.loggedAt)}</span>
                <span className="text-sm font-medium text-gray-900">
                  {log.cupsConsumed} cups, {log.cupSize}oz cup
                </span>
              </li>
            ))}
          </ul>
        )}

        {isLoading && (
          <p className="mt-3 text-sm text-gray-600">Refreshing seven-day history...</p>
        )}
      </div>
    </section>
  );
}

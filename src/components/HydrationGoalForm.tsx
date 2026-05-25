"use client";

import { FormEvent, useEffect, useState } from "react";

interface HydrationGoal {
  id: string;
  dailyTargetCups: number;
}

export default function HydrationGoalForm() {
  const [currentGoal, setCurrentGoal] = useState<HydrationGoal | null>(null);
  const [dailyTargetCups, setDailyTargetCups] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadGoal() {
      try {
        const response = await fetch("/api/hydration/goal");

        if (response.status === 404) {
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load hydration goal");
        }

        setCurrentGoal(data);
        setDailyTargetCups(String(data.dailyTargetCups));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load hydration goal"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadGoal();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetCups = Number(dailyTargetCups);

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!Number.isInteger(targetCups) || targetCups < 1 || targetCups > 30) {
      setErrorMessage("Daily target cups must be a whole number between 1 and 30.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/hydration/goal", {
        method: currentGoal ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dailyTargetCups: targetCups }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save hydration goal");
      }

      setCurrentGoal(data);
      setDailyTargetCups(String(data.dailyTargetCups));
      setSuccessMessage("Goal saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save hydration goal"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {currentGoal ? "Current goal" : "Set your first daily water goal"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Most adults use 8 to 12 cups as a practical daily intake target.
              Adjust your goal for activity, climate, and medical guidance.
            </p>

            <div className="mt-5 rounded-md bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                {currentGoal
                  ? `${currentGoal.dailyTargetCups} cups per day`
                  : "No daily hydration goal is set yet."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="dailyTargetCups"
                className="block text-sm font-medium text-gray-700"
              >
                Daily target cups
              </label>
              <input
                id="dailyTargetCups"
                name="dailyTargetCups"
                type="number"
                min="1"
                max="30"
                step="1"
                required
                value={dailyTargetCups}
                onChange={(event) => setDailyTargetCups(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {errorMessage && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-700"
                aria-live="assertive"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                className="rounded-md bg-green-50 p-3 text-sm text-green-700"
                aria-live="polite"
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isSaving}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : currentGoal ? "Update goal" : "Save goal"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

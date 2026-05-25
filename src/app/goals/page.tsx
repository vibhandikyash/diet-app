import AppLayout from "@/components/AppLayout";
import HydrationGoalForm from "@/components/HydrationGoalForm";

export default function GoalsPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Goals
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set and track your nutrition and hydration targets.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Daily hydration goal
          </h3>
        </div>

        <HydrationGoalForm />
      </div>
    </AppLayout>
  );
}

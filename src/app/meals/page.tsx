import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export default function MealsPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-2xl font-semibold text-gray-900">Meals</h2>
            <p className="mt-2 text-sm text-gray-700">
              Track and manage your daily meals here.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/meals/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Log Meal
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

import AppLayout from "@/components/AppLayout";
import QuickHydrationLog from "@/components/QuickHydrationLog";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Dashboard
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Track today&apos;s nutrition and hydration.
                </p>
              </div>
              <Link
                href="/goals"
                className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 sm:mt-0"
              >
                Set hydration goal
              </Link>
            </div>
          </div>
        </div>

        <QuickHydrationLog />
      </div>
    </AppLayout>
  );
}

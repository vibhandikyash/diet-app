import AppLayout from "@/components/AppLayout";
import QuickHydrationLog from "@/components/QuickHydrationLog";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome to your Dashboard!
          </h2>
          <p className="text-gray-600">
            This is a protected route. Only authenticated users can see this page.
          </p>
        </div>
        <QuickHydrationLog />
      </div>
    </AppLayout>
  );
}

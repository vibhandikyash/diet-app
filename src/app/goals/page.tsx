import AppLayout from "@/components/AppLayout";

export default function GoalsPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Goals</h2>
          <p className="text-gray-600">
            Set and track your nutrition goals here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

import AppLayout from "@/components/AppLayout";

export default function MealsPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Meals</h2>
          <p className="text-gray-600">
            Track and manage your daily meals here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

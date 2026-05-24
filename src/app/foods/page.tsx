import AppLayout from "@/components/AppLayout";

export default function FoodsPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Foods</h2>
          <p className="text-gray-600">
            Browse and manage your food database here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

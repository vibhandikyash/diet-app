import AppLayout from "@/components/AppLayout";
import HydrationHistoryCalendar from "@/components/HydrationHistoryCalendar";

export default function HistoryPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <HydrationHistoryCalendar />
      </div>
    </AppLayout>
  );
}

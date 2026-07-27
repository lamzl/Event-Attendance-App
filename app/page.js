import { CheckInApp } from "@/components/CheckInApp";
import { getPublicEventConfig } from "@/lib/event-config";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <CheckInApp event={getPublicEventConfig()} />;
}

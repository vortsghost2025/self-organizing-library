import { SystemPulseClient } from "@/app/system-pulse/SystemPulseClient";

export default function SystemPulsePage() {
  return (
    <div className="p-8 max-w-7xl" data-pagefind-body>
      <SystemPulseClient />
    </div>
  );
}

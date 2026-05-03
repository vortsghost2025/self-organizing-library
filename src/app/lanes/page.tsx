import { LaneArchitecture } from "@/components/LaneArchitecture";

export default function LanesPage() {
  return (
    <div className="p-8" data-pagefind-body>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">The 4 Lanes</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        The Deliberate Ensemble governance system operates through four specialized lanes, each with distinct authority and responsibilities.
      </p>
      <LaneArchitecture />
    </div>
  );
}

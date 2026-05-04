"use client";

import { useEffect, useMemo, useState } from "react";
import SystemInterpretation from "@/components/graph/SystemInterpretation";

interface GraphNode {
  title: string;
  status: "UNVERIFIED" | "VERIFIED" | "CONFLICTED" | "QUARANTINED";
  contradictionCount: number;
}

export default function HomeSystemStateStrip() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/graph-data");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNodes(data.nodes || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryInstability = useMemo(() => {
    const sorted = [...nodes].sort((a, b) => b.contradictionCount - a.contradictionCount);
    const top = sorted[0];
    if (!top) return null;
    return { title: top.title, contradictionCount: top.contradictionCount };
  }, [nodes]);

  const conflictedCount = nodes.filter((n) => n.status === "CONFLICTED").length;
  const quarantinedCount = nodes.filter((n) => n.status === "QUARANTINED").length;
  const verifiedCount = nodes.filter((n) => n.status === "VERIFIED").length;

  return (
    <SystemInterpretation
      className="mb-8"
      viewModeLabel="CONTRADICTION HUB"
      visibleNodeCount={nodes.length}
      conflictedCount={conflictedCount}
      quarantinedCount={quarantinedCount}
      verifiedCount={verifiedCount}
      primaryInstability={primaryInstability}
      loading={loading}
    />
  );
}


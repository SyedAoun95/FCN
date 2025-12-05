"use client";

import React, { useEffect, useState } from "react";
import MetricsCards from "./components/MetricsCards";
import SearchSection from "./components/SearchSection";
import DataTable from "./components/DataTable";
import { initDB } from "./services/db";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any[] | undefined>(undefined);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null); // null = loading

  // 🔐 Check login state
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) {
      router.push("/"); // user must login first
      setAuthenticated(false);
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (!authenticated) return; // don't load data if not authenticated

    let cancelled = false;
    let changesHandle: any = null;
    let intervalHandle: any = null;

    const recalc = async (db: any) => {
      try {
        const now = new Date();
        const monthSum = await db.monthlyRevenue(now.getFullYear(), now.getMonth() + 1);
        const grand = await db.grandTotalRevenue();
        const totalConn = await db.totalConnections();
        const areas = await db.getAreas();
        const areasCount = Array.isArray(areas) ? areas.length : 0;

        const m = [
          { title: 'Monthly Revenue', value: `$${Number(monthSum).toFixed(2)}`, change: '', trend: 'up', description: 'Revenue for current month' },
          { title: 'All-Time Revenue', value: `$${Number(grand).toFixed(2)}`, change: '', trend: 'up', description: 'Cumulative revenue' },
          { title: 'Active Areas', value: String(areasCount), change: '', trend: 'up', description: 'Number of areas' },
          { title: 'Active Connections', value: String(totalConn), change: '', trend: 'up', description: 'Number of person connections' },
        ];

        if (!cancelled) setMetrics(m as any);
      } catch (err) {
        console.warn('failed to load metrics', err);
      }
    };

    const load = async () => {
      const db = await initDB();
      if (!db) return;
      await recalc(db);

      try {
        changesHandle = db.listenChanges((doc: any) => {
          if (doc.type === 'person' || doc.type === 'area') {
            recalc(db);
          }
        });
      } catch (err) {
        console.warn('listenChanges failed', err);
      }

      intervalHandle = setInterval(() => recalc(db), 1000 * 60 * 60);
    };

    load();

    return () => {
      cancelled = true;
      if (changesHandle && typeof changesHandle.cancel === 'function') {
        try { changesHandle.cancel(); } catch (e) {}
      }
      if (intervalHandle) clearInterval(intervalHandle);
    };
  }, [authenticated]);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  if (authenticated === null) {
    // still checking auth
    return <div>Loading...</div>;
  }

  if (authenticated === false) {
    return null; // redirecting
  }

  return (
    <>
      <MetricsCards metrics={metrics} />
      <SearchSection onSearch={handleSearch} />
      <DataTable />
    </>
  );
}

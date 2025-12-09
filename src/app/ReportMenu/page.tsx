"use client";
// this is the report menu page and needs upgeadtaion
import React, { useEffect, useState } from "react";
import { initDB } from "../services/db";

export default function ReportMenuPage() {
  const [db, setDb] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [areaQuery, setAreaQuery] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState("");

  const [personsInArea, setPersonsInArea] = useState<any[]>([]);
  const [connectionQuery, setConnectionQuery] = useState("");
  const [connectionSuggestions, setConnectionSuggestions] = useState<any[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedPersonName, setSelectedPersonName] = useState("");
  const [selectedPersonFee, setSelectedPersonFee] = useState<number | null>(null);
  const [selectedPersonCreatedAt, setSelectedPersonCreatedAt] = useState<string | null>(null);
  const [monthlyBalances, setMonthlyBalances] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [monthTransactions, setMonthTransactions] = useState<any[]>([]);

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setup = async () => {
      const pouch = await initDB();
      if (!pouch) return;
      setDb(pouch);
      try {
        const a = await pouch.getAreas();
        setAreas(a || []);
      } catch (e) {
        console.warn("failed to load areas", e);
      }
      setLoading(false);
    };
    setup();
  }, []);

  const onAreaSelect = async (areaId: string) => {
    setSelectedArea(areaId);
    setSelectedPersonId("");
    setSelectedPersonName("");
    setRecords([]);
    setConnectionQuery("");
    setConnectionSuggestions([]);
    setSelectedMonth("");
    if (!db || !areaId) return;
    try {
      const p = await db.getPersonsByArea(areaId);
      setPersonsInArea(p || []);
    } catch (e) {
      console.warn("failed to load persons for area", e);
    }
  };

  const onPersonSelect = async (personId: string) => {
    setSelectedPersonId(personId);
    let person = personsInArea.find((x) => x._id === personId);
    // if not found in current area cache, fetch directly
    if (!person && db) {
      try {
        person = await db.localDB.get(personId);
      } catch (e) {
        // ignore
      }
    }
    setSelectedPersonName(person?.name || "");
    setSelectedPersonFee(person?.amount ?? null);
    setSelectedPersonCreatedAt(person?.createdAt ?? null);
    setConnectionSuggestions([]);
    setConnectionQuery(person ? String(person.connectionNumber ?? person.number ?? person.name ?? "") : "");
    setSelectedMonth("");
    await loadRecordsForPerson(personId, person?.amount ?? null);
    // also clear month transactions
    setMonthTransactions([]);
  };

  // load combined transactions (payments + person create/update) for selected month
  const loadMonthTransactions = async (month: string) => {
    if (!db || !month) {
      setMonthTransactions([]);
      return;
    }

    // helper to get YYYY-MM from date string
    const toMonth = (dStr?: string) => {
      if (!dStr) return null;
      try {
        const d = new Date(dStr);
        if (Number.isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return null;
      }
    };

    try {
      // fetch debit records (payments)
      await db.localDB.createIndex({ index: { fields: ['type', 'areaId', 'personId', 'createdAt', 'month'] } });
      const debRes = await db.localDB.find({ selector: { type: 'debit' } });
      const debits = (debRes.docs || []).filter((d: any) => {
        // area filter if selected
        if (selectedArea && d.areaId && d.areaId !== selectedArea) return false;
        // if selectedPersonId exists, show transactions for that person only
        if (selectedPersonId && d.personId && d.personId !== selectedPersonId) return false;
        const m = d.month || toMonth(d.createdAt);
        return m === month;
      }).map((d: any) => ({ type: 'payment', doc: d, date: d.createdAt || null }));

      // fetch person docs (creates/updates)
      await db.localDB.createIndex({ index: { fields: ['type', 'areaId', 'createdAt', 'updatedAt'] } });
      const perRes = await db.localDB.find({ selector: { type: 'person' } });
      const persons = (perRes.docs || []).flatMap((p: any) => {
        // area filter if selected
        if (selectedArea && p.areaId && p.areaId !== selectedArea) return [];
        // if selectedPersonId defined, and it's not this person, skip
        if (selectedPersonId && p._id !== selectedPersonId) return [];

        const rows: any[] = [];
        const mCreated = toMonth(p.createdAt);
        if (mCreated === month) rows.push({ type: 'person-created', doc: p, date: p.createdAt });
        const mUpdated = toMonth(p.updatedAt);
        if (mUpdated === month) rows.push({ type: 'person-updated', doc: p, date: p.updatedAt });
        return rows;
      });

      // combine and sort by date desc
      const combined = [...debits, ...persons].sort((a: any, b: any) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const dbt = b.date ? new Date(b.date).getTime() : 0;
        return dbt - da;
      });

      setMonthTransactions(combined);
    } catch (err) {
      console.warn('failed to load month transactions', err);
      setMonthTransactions([]);
    }
  };

  // watch selectedMonth and db
  React.useEffect(() => {
    if (!selectedMonth) {
      setMonthTransactions([]);
      return;
    }
    loadMonthTransactions(selectedMonth);
  }, [selectedMonth, db, selectedArea, selectedPersonId]);

  const loadRecordsForPerson = async (personId: string, expectedFeeOverride: number | null = null) => {
    if (!db || !personId) return;
    try {
      await db.localDB.createIndex({ index: { fields: ["type", "personId"] } });
      const res = await db.localDB.find({ selector: { type: "debit", personId } });
      const docs = res.docs || [];
      setRecords(docs);

      // compute per-month aggregates and running balance
      const byMonth: Record<string, { paid: number; lastPaidAt?: string }> = {};
      docs.forEach((d: any) => {
        const m = d.month || (d.createdAt ? `${new Date(d.createdAt).getFullYear()}-${String(new Date(d.createdAt).getMonth() + 1).padStart(2, '0')}` : null);
        if (!m) return;
        if (!byMonth[m]) byMonth[m] = { paid: 0, lastPaidAt: d.createdAt };
        byMonth[m].paid += Number(d.amount) || 0;
        if (d.createdAt && (!byMonth[m].lastPaidAt || new Date(d.createdAt) > new Date(byMonth[m].lastPaidAt))) {
          byMonth[m].lastPaidAt = d.createdAt;
        }
      });

      // build months range from earliest payment to current month
      let months: string[] = [];
      if (docs.length > 0) {
        const earliest = docs.reduce((min: any, r: any) => {
          if (!r.createdAt) return min;
          const d = new Date(r.createdAt);
          return !min || d < min ? d : min;
        }, null);
        const start = earliest ? new Date(earliest.getFullYear ? earliest.getFullYear() : new Date(earliest).getFullYear(), earliest.getMonth ? earliest.getMonth() : new Date(earliest).getMonth(), 1) : new Date();
        const now = new Date();
        for (let d = new Date(start); d <= new Date(now.getFullYear(), now.getMonth(), 1); d.setMonth(d.getMonth() + 1)) {
          months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      } else {
        // no payments yet: show current month only
        const now = new Date();
        months = [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`];
      }

      const expected = Number(expectedFeeOverride ?? selectedPersonFee) || 0;
      let cumulative = 0;
      const mb = months.map((m) => {
        const paid = Number(byMonth[m]?.paid || 0);
        const pending = expected - paid;
        cumulative += pending;
        return {
          month: m,
          expected,
          paid,
          pending,
          cumulativePending: cumulative,
          lastPaidAt: byMonth[m]?.lastPaidAt,
        };
      });

      setMonthlyBalances(mb);
    } catch (e) {
      console.warn("failed to load records for person", e);
    }
  };

  // compute paid in selected month and all-time balance using records and person's start date
  const toMonth = (dStr?: string | null) => {
    if (!dStr) return null;
    try {
      const d = new Date(dStr);
      if (Number.isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch (e) {
      return null;
    }
  };

  const paidInSelectedMonth = selectedMonth
    ? records
        .filter((r: any) => {
          const m = r.month || toMonth(r.createdAt);
          return m === selectedMonth;
        })
        .reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0)
    : 0;

  const expectedPerMonth = Number(selectedPersonFee) || 0;
  const selectedPendingAmount = selectedMonth ? Math.max(0, expectedPerMonth - paidInSelectedMonth) : 0;

  // all-time: determine person start (createdAt) or earliest payment, compute months between then and now
  const earliestRecordDate = records.reduce((min: string | null, r: any) => {
    if (!r.createdAt) return min;
    const d = new Date(r.createdAt);
    if (!min) return d.toISOString();
    return new Date(min) > d ? d.toISOString() : min;
  }, null as string | null);

  const startDate = selectedPersonCreatedAt ? new Date(selectedPersonCreatedAt) : earliestRecordDate ? new Date(earliestRecordDate) : null;

  const monthsBetween = (start?: Date | null, end: Date = new Date()) => {
    if (!start) return 1;
    const sy = start.getFullYear();
    const sm = start.getMonth();
    const ey = end.getFullYear();
    const em = end.getMonth();
    return (ey - sy) * 12 + (em - sm) + 1;
  };

  const monthsCount = monthsBetween(startDate, new Date());
  const totalExpectedAllTime = expectedPerMonth * monthsCount;
  const totalPaidAllTime = records.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
  const allTimeBalance = totalExpectedAllTime - totalPaidAllTime;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Report Menu</h1>
        <p className="text-sm text-gray-600">Search for a person to view all paid amounts (read-only)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
            <div className="relative">
              <input
                type="text"
                value={areaQuery}
                onChange={(e) => {
                  const q = String(e.target.value || "");
                  setAreaQuery(q);
                  if (!q) {
                    setAreaSuggestions([]);
                    return;
                  }
                  const qLower = q.toLowerCase();
                  const filtered = areas.filter((ar) => String(ar.name || "").toLowerCase().startsWith(qLower));
                  setAreaSuggestions(filtered.slice(0, 20));
                }}
                placeholder="Type area name (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
              {areaSuggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded max-h-44 overflow-auto shadow-lg">
                  {areaSuggestions.map((a) => (
                    <li
                      key={a._id}
                      onClick={() => {
                        setAreaQuery(a.name || "");
                        setAreaSuggestions([]);
                        onAreaSelect(a._id);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-black"
                    >
                      {a.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Connection / Name</label>
            <div className="relative">
              <input
                type="text"
                value={connectionQuery}
                onChange={async (e) => {
                  const q = String(e.target.value || "");
                  setConnectionQuery(q);
                  if (!q) {
                    setConnectionSuggestions([]);
                    return;
                  }

                  const qLower = q.toLowerCase();
                  if (selectedArea) {
                    const filtered = personsInArea.filter((p) => {
                      const conn = String(p.connectionNumber ?? p.number ?? p.name ?? "");
                      return conn.toLowerCase().startsWith(qLower) || String(p.name || "").toLowerCase().startsWith(qLower);
                    });
                    setConnectionSuggestions(filtered.slice(0, 20));
                  } else if (db && db.searchPersons) {
                    try {
                      const res = await db.searchPersons(q);
                      setConnectionSuggestions(res || []);
                    } catch (err) {
                      console.warn('searchPersons failed', err);
                      setConnectionSuggestions([]);
                    }
                  }
                }}
                placeholder="Type connection # or name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />

              {connectionSuggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded max-h-44 overflow-auto shadow-lg">
                  {connectionSuggestions.map((p) => {
                    const label = p.connectionNumber ?? p.number ?? p.name ?? "";
                    return (
                      <li
                        key={p._id}
                        onClick={() => onPersonSelect(p._id)}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-black"
                      >
                        {label} {p.name ? `— ${p.name}` : ''}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Person</label>
            <input readOnly value={selectedPersonName} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month (optional)</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">All Records</h2>
        {monthlyBalances.length === 0 ? (
          <div className="text-sm text-gray-500">No monthly data for selected person</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyBalances
                  .filter((m: any) => (selectedMonth ? m.month === selectedMonth : true))
                  .map((m: any) => (
                    <tr key={m.month} className={m.pending > 0 ? 'bg-orange-50' : m.pending === 0 ? 'bg-green-50' : 'bg-blue-50'}>
                      <td className="px-6 py-3 text-sm text-gray-900">{m.month}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">${Number(m.expected).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">${Number(m.paid).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{m.lastPaidAt ? new Date(m.lastPaidAt).toLocaleString() : '-'}</td>
                      <td className="px-6 py-3 text-sm text-red-600 font-semibold">${Number(m.cumulativePending).toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          )}

          {monthlyBalances.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMonth && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="text-xs text-gray-600">Pending for {selectedMonth}</div>
                  <div className="text-lg font-semibold text-red-600">${Number(selectedPendingAmount).toFixed(2)}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Expected per month: ${Number(expectedPerMonth).toFixed(2)} — Paid: ${Number(paidInSelectedMonth).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-600">All-time balance</div>
                <div className="text-lg font-semibold text-black">${Number(allTimeBalance).toFixed(2)}</div>
              </div>
            </div>
          )}
      </div>
      {selectedMonth && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Transactions for {selectedMonth}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connection #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records
                  .filter((r: any) => {
                    const m = r.month || (r.createdAt ? `${new Date(r.createdAt).getFullYear()}-${String(new Date(r.createdAt).getMonth() + 1).padStart(2, '0')}` : null);
                    return m === selectedMonth;
                  })
                  .map((r: any) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 font-semibold">${Number(r.amount).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{r.month || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{r.personName || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{r.connectionNumber || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{r.personAddress || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

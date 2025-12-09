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
  const [monthlyBalances, setMonthlyBalances] = useState<any[]>([]);

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
    setConnectionSuggestions([]);
    setConnectionQuery(person ? String(person.connectionNumber ?? person.number ?? person.name ?? "") : "");
    await loadRecordsForPerson(personId, person?.amount ?? null);
  };

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
                {monthlyBalances.map((m: any) => (
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
      </div>
    </div>
  );
}

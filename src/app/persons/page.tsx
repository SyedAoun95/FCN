"use client";

import React, { useEffect, useState } from "react";
import { initDB } from "../services/db";

export default function PersonsPage() {
  const [db, setDb] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [persons, setPersons] = useState<any[]>([]);
  const [personName, setPersonName] = useState("");
  const [connectionNumber, setConnectionNumber] = useState<string | number>("");
  const [amount, setAmount] = useState<number>(0);
  const [monthTotal, setMonthTotal] = useState<number>(0);
  const [connectionWarning, setConnectionWarning] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupDB = async () => {
      const pouch = await initDB();
      if (pouch) {
        pouch.syncDB();
        setDb(pouch);
        const allAreas = await pouch.getAreas();
        setAreas(allAreas);
        setLoading(false);
      }
    };
    setupDB();
  }, []);

  const loadPersons = async (areaId: string) => {
    if (!db) return;
    setSelectedArea(areaId);
    const allPersons = await db.getPersonsByArea(areaId);
    setPersons(allPersons);
  };

  const addPerson = async () => {
    if (!db || !String(connectionNumber).trim() || !personName.trim() || !selectedArea)
      return;

    // double-check uniqueness before attempting create
    try {
      const existing = await db.getPersonByConnectionNumber(String(connectionNumber));
      if (existing) {
        setConnectionWarning(`Connection number already assigned to ${existing.name ?? 'another person'}`);
        return;
      }

      await db.createPerson(connectionNumber, personName, amount || 0, monthTotal || 0, selectedArea);
    } catch (err: any) {
      setConnectionWarning(err?.message || 'Failed to create person');
      return;
    }
    const allPersons = await db.getPersonsByArea(selectedArea);
    setPersons(allPersons);
    setPersonName("");
    setConnectionNumber("");
    setAmount(0);
    setMonthTotal(0);
    setConnectionWarning("");
  };

  const deletePerson = async (person: any) => {
    if (!db) return;
    await db.deletePerson(person);
    const allPersons = await db.getPersonsByArea(selectedArea);
    setPersons(allPersons);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-lg text-gray-600">Loading Database...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Persons Management</h1>
        <p className="text-gray-600">Add and manage persons in different areas</p>
      </div>

      {/* Area Selection Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Area</h2>
        <div className="flex gap-4 items-center">
          <select
            value={selectedArea}
            onChange={(e) => loadPersons(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
          >
            <option value="">-- Select Area --</option>
            {areas.map((area) => (
              <option key={area._id} value={area._id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Person Form Card - Only show when area is selected */}
      {selectedArea && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Person</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Number
              </label>
              <input
                type="text"
                value={connectionNumber}
                onChange={(e) => setConnectionNumber(e.target.value)}
                onBlur={async () => {
                  if (!db) return;
                  if (!String(connectionNumber).trim()) {
                    setConnectionWarning("");
                    return;
                  }
                  const existing = await db.getPersonByConnectionNumber(String(connectionNumber));
                  if (existing) setConnectionWarning(`Connection number already assigned to ${existing.name ?? 'another person'}`);
                  else setConnectionWarning("");
                }}
                placeholder="Enter connection number..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
              {connectionWarning && (
                <p className="text-sm text-red-600 mt-2">{connectionWarning}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Person Name
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Enter person name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter amount..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month Total
              </label>
              <input
                type="number"
                value={monthTotal || ""}
                onChange={(e) => setMonthTotal(Number(e.target.value))}
                placeholder="Enter month total..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
            </div>
          </div>
          <button 
            onClick={addPerson}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg hover:from-blue-700 hover:to-purple-800 transition-colors duration-200 font-medium"
          >
            Add Person
          </button>
        </div>
      )}

      {/* Persons List Card - Only show when area is selected */}
      {selectedArea && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Persons in Selected Area</h2>
            <p className="text-sm text-gray-500 mt-1">{persons.length} person(s) found</p>
          </div>

          {persons.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">No persons found in this area</div>
              <p className="text-gray-500">Add your first person using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connection #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Person Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {persons.map((person) => (
                    <tr key={person._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{person.connectionNumber ?? person.number ?? '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{person.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{person.amount ?? 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{person.monthTotal ?? 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => deletePerson(person)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded-md transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards - Similar to dashboard metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Persons</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{persons.length}</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">
              +0%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-4">All persons in selected area</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Areas</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{areas.length}</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800">
              {areas.length > 0 ? 'Ready' : 'None'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-4">Total areas available</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected Area</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {selectedArea ? areas.find(a => a._id === selectedArea)?.name : 'None'}
              </p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              selectedArea ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {selectedArea ? '✓' : '✗'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {selectedArea ? 'Area selected' : 'No area selected'}
          </p>
        </div>
      </div>
    </div>
  );
}
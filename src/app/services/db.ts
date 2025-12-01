// src/app/services/db.ts
export const initDB = async () => {
  if (typeof window === "undefined") return null; // only run in browser

  const PouchDB = (await import("pouchdb-browser")).default;
  const PouchDBFind = (await import("pouchdb-find")).default;

  PouchDB.plugin(PouchDBFind);

  const localDB = new PouchDB("crud-database");
  const remoteDB = new PouchDB(
    "http://admin:syedaoun12345@127.0.0.1:5984/db_fcn"
  );

  // ---------------------------
  // LIVE TWO-WAY SYNC
  // ---------------------------
  const syncDB = () => {
    localDB
      .sync(remoteDB, { live: true, retry: true })
      .on("change", (info) => console.log("DB Change:", info))
      .on("paused", () => console.log("Sync paused"))
      .on("active", () => console.log("Sync active"))
      .on("error", (err) => console.error("Sync error:", err));
  };

  // ---------------------------
  // REAL-TIME CHANGES LISTENER
  // ---------------------------
  const listenChanges = (onChange: (doc: any) => void) => {
    const changes = localDB
      .changes({
        since: "now",
        live: true,
        include_docs: true,
      })
      .on("change", (change) => {
        if (change.deleted) {
          onChange({ ...change.doc, _deleted: true });
        } else {
          onChange(change.doc);
        }
      });

    return changes;
  };

  // ---------------------------
  // AREA CRUD
  // ---------------------------
  const createArea = async (name: string) => {
    if (!name.trim()) throw new Error("Area name cannot be empty");

    const doc = {
      _id: `area_${name.toLowerCase()}_${Date.now()}`,
      type: "area",
      name,
      createdAt: new Date().toISOString(),
    };

    return localDB.put(doc);
  };

  const getAreas = async () => {
    await localDB.createIndex({ index: { fields: ["type"] } });
    const res = await localDB.find({ selector: { type: "area" } });
    return res.docs;
  };

  const deleteArea = async (area: any) => {
    return localDB.remove(area);
  };

  // ---------------------------
  // PERSON CRUD
  // ---------------------------
  const createPerson = async (
    connectionNumber: string | number,
    name: string,
    amount: number,
    monthTotal: number,
    areaId: string
  ) => {
    if (!String(connectionNumber).trim() || !name.trim() || !areaId)
      throw new Error("Invalid input");

    // Prevent duplicate connection numbers (also check legacy `number` field)
    await localDB.createIndex({ index: { fields: ["type", "connectionNumber", "number"] } });

    const existing = await localDB.find({
      selector: {
        type: "person",
        $or: [
          { connectionNumber: String(connectionNumber) },
          { number: String(connectionNumber) },
        ],
      },
      limit: 1,
    });

    if (existing.docs && existing.docs.length > 0) {
      throw new Error("Connection number already assigned");
    }

    const doc = {
      _id: `person_${areaId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: "person",
      connectionNumber: String(connectionNumber),
      name,
      amount: typeof amount === 'number' ? amount : 0,
      monthTotal: typeof monthTotal === 'number' ? monthTotal : 0,
      areaId,
      createdAt: new Date().toISOString(),
    };

    return localDB.put(doc);
  };

  const getPersonByConnectionNumber = async (connectionNumber: string | number) => {
    if (!String(connectionNumber).trim()) return null;

    await localDB.createIndex({ index: { fields: ["type", "connectionNumber", "number"] } });

    const res = await localDB.find({
      selector: {
        type: "person",
        $or: [
          { connectionNumber: String(connectionNumber) },
          { number: String(connectionNumber) },
        ],
      },
      limit: 1,
    });

    return res.docs && res.docs.length > 0 ? res.docs[0] : null;
  };

  const getPersonsByArea = async (areaId: string) => {
    await localDB.createIndex({
      index: { fields: ["type", "areaId"] },
    });

    const res = await localDB.find({
      selector: { type: "person", areaId },
    });

    return res.docs;
  };

  const updatePerson = async (person: any, updates: any) => {
    if (!person._id || !person._rev)
      throw new Error("_id and _rev required");
    return localDB.put({ ...person, ...updates });
  };

  const deletePerson = async (person: any) => {
    return localDB.remove(person);
  };

  // ---------------------------
  // REAL-TIME SEARCH (NAME OR NUMBER)
  // ---------------------------
  const searchPersons = async (query: string) => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();

    await localDB.createIndex({
      index: { fields: ["type", "name", "number", "connectionNumber"] },
    });

    const result = await localDB.find({
      selector: {
        type: "person",
        $or: [
          { name: { $regex: new RegExp(q, "i") } },
          { number: { $regex: new RegExp(q, "i") } },
          { connectionNumber: { $regex: new RegExp(q, "i") } },
        ],
      },
    });

    return result.docs;
  };

  // ---------------------------
  // AUTOMATIC SYNC ON INIT
  // ---------------------------
  syncDB();

  return {
    localDB,
    remoteDB,
    syncDB,
    listenChanges,
    createArea,
    getAreas,
    deleteArea,
    createPerson,
    getPersonByConnectionNumber,
    getPersonsByArea,
    updatePerson,
    deletePerson,
    searchPersons,
  };
};

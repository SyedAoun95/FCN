// src/app/services/db.ts
export const initDB = async () => {
  if (typeof window === "undefined") return null;

  const PouchDB = (await import("pouchdb-browser")).default;
  const PouchDBFind = (await import("pouchdb-find")).default;

  PouchDB.plugin(PouchDBFind);

  const localDB = new PouchDB("crud-database");
  const remoteDB = new PouchDB(
    "http://admin:syedaoun1234@127.0.0.1:5984/db_fcn"
  );

  // Sync
  const syncDB = () => {
    localDB
      .sync(remoteDB, { live: true, retry: true })
      .on("change", (info) => console.log("DB Change:", info))
      .on("error", (err) => console.error("Sync error:", err));
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
    name: string,
    number: number,
    areaId: string
  ) => {
    if (!name.trim() || !number || !areaId)
      throw new Error("Invalid input");

    const doc = {
      _id: `person_${areaId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: "person",
      name,
      number,
      areaId,
      createdAt: new Date().toISOString(),
    };

    return localDB.put(doc);
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
      index: { fields: ["type", "name", "number"] },
    });

    const result = await localDB.find({
      selector: {
        type: "person",
        $or: [
          { name: { $regex: new RegExp(q, "i") } },
          { number: { $regex: new RegExp(q, "i") } },
        ],
      },
    });

    return result.docs;
  };

  return {
    localDB,
    remoteDB,
    syncDB,
    createArea,
    getAreas,
    deleteArea,
    createPerson,
    getPersonsByArea,
    updatePerson,
    deletePerson,
    searchPersons, // <-- added
  };
};

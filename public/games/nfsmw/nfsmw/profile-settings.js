// Original Options persist in the profile registry. Seed browser quality only
// before those values exist; opening/reloading never rewrites a player's files.
export async function browserBindings(id, storage = navigator.storage) {
  try {
    const root = await storage.getDirectory();
    const game = await root.getDirectoryHandle(id);
    const profile = await game.getDirectoryHandle("profile");
    const controls = await profile.getDirectoryHandle("controls");
    return await (await (await controls.getFileHandle("binding.txt")).getFile()).text();
  } catch (error) {
    if (error.name !== "NotFoundError") throw error;
    return "";
  }
}

export async function browserDefaults(id, defaults, savedOverrides = {}, preferenceKeys = [], storage = navigator.storage) {
  const result = { ...defaults };
  if (!Object.keys(savedOverrides).length || !preferenceKeys.length) return result;
  const keys = new Set(preferenceKeys.map(key => key.toLowerCase()));
  try {
    const root = await storage.getDirectory();
    const game = await root.getDirectoryHandle(id);
    const profile = await game.getDirectoryHandle("profile");
    const file = await (await profile.getFileHandle("registry.json")).getFile();
    const registry = JSON.parse(await file.text());
    const saved = Object.values(registry).some(values => values && typeof values === "object" &&
      Object.keys(values).some(key => keys.has(key.toLowerCase())));
    if (saved) Object.assign(result, savedOverrides);
  } catch (error) {
    // A missing profile is the normal first run. Refuse to override preferences
    // when an existing registry is unreadable, locked or malformed.
    if (error.name !== "NotFoundError") {
      Object.assign(result, savedOverrides);
      console.warn("Saved graphics preferences could not be read:", error.message);
    }
  }
  return result;
}

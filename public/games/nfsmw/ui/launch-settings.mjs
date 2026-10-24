const marker = ".web-presentation-v1.json";

async function readOptional(directory, name) {
  try { return await (await directory.getFileHandle(name)).getFile(); }
  catch (error) { if (error.name === "NotFoundError") return null; throw error; }
}

async function write(directory, name, text) {
  const handle = await directory.getFileHandle(name, {create: true});
  const stream = await handle.createWritable();
  try { await stream.write(text); await stream.close(); }
  catch (error) { await stream.abort().catch(() => {}); throw error; }
}

// Run under the player session lock, before the runtime opens its OPFS files.
// Migrate old browser profiles once; later explicit user choices take priority.
// `resolution` is the launch page's choice: "WxH" fixes the game's size (the
// core.nfsmw width/height settings, which take precedence over Options ->
// Video), "game" hands the size back to Options -> Video, anything else leaves
// the profile as it is. Guest Options and save files are never written here.
export async function preparePresentation(id, resolution = null) {
  const root = await navigator.storage.getDirectory();
  const game = await root.getDirectoryHandle(id, {create: true});
  const profile = await game.getDirectoryHandle("profile", {create: true});
  const migrated = !!await readOptional(profile, marker);
  const existing = await readOptional(profile, "mod-settings.json");
  const before = existing ? await existing.text() : "";
  const settings = before ? JSON.parse(before) : {};
  if (!settings || typeof settings !== "object" || Array.isArray(settings))
    throw new Error("Unable to read profile settings. Existing saves have not been changed.");
  if (!migrated) settings["host.display/performance_overlay"] = 0;
  const size = resolution?.match(/^(\d{3,5})x(\d{3,5})$/);
  if (size) {
    settings["core.nfsmw/width"] = +size[1];
    settings["core.nfsmw/height"] = +size[2];
  } else if (resolution === "game") {
    delete settings["core.nfsmw/width"];
    delete settings["core.nfsmw/height"];
  }
  const text = JSON.stringify(settings, null, 2) + "\n";
  if (text !== before) await write(profile, "mod-settings.json", text);
  if (!migrated) await write(profile, marker, JSON.stringify({version: 1}) + "\n");
}



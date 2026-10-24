// WebGPU can redact the device model. A vendor alone does not prove that a
// GPU is integrated: AMD gcn-5 covers both integrated and discrete devices.
export function describeGPU(info = {}) {
  const model = info.description || info.device || "";
  const name = [info.vendor, info.architecture, info.description].filter(Boolean).join(" · ") || "WebGPU (model hidden by the browser)";
  let kind = "unknown";
  if (info.isFallbackAdapter || /swiftshader|llvmpipe|software rasterizer|microsoft basic render/i.test(model)) kind = "software";
  else if (/Intel.*(?:UHD|HD Graphics|Iris)|AMD Radeon\(TM\) Graphics|Radeon (?:Graphics|Vega \d+ Graphics|\d{3,4}M\b)/i.test(model)) kind = "integrated";
  else if (/NVIDIA.*(?:GeForce|RTX|GTX|Quadro)|Radeon (?:RX|Pro)\b|Intel.*Arc\b/i.test(model) || /nvidia/i.test(info.vendor || "")) kind = "dedicated";
  const warning = kind === "software" ? "Software rendering selected. The game needs a hardware GPU."
    : kind === "integrated" ? "Integrated graphics selected — FPS may be low."
    : kind === "unknown" ? "Integrated or weak graphics may produce low FPS." : "";
  return {name, kind, warning};
}

export async function probeGPU(gpu = navigator.gpu) {
  if (!gpu) return {name: "WebGPU unavailable", kind: "unavailable", warning: "Chrome or Edge with WebGPU and hardware acceleration is required."};
  try {
    const adapter = await gpu.requestAdapter({powerPreference: "high-performance"});
    if (!adapter) return {name: "WebGPU could not find a GPU", kind: "unavailable", warning: "Check browser hardware acceleration and your graphics driver."};
    return describeGPU({vendor: adapter.info?.vendor, architecture: adapter.info?.architecture,
      description: adapter.info?.description, device: adapter.info?.device,
      isFallbackAdapter: adapter.isFallbackAdapter || adapter.info?.isFallbackAdapter});
  } catch {
    return {name: "GPU model unavailable", kind: "unknown", warning: "Integrated or weak graphics may produce low FPS."};
  }
}

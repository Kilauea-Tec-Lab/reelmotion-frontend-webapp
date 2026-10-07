// Estética "consola": etiquetas mono, puntos de estado, bordes finos con glow del acento.
export const STATUS_DOT = {
  draft: "bg-gray-500",
  ready: "bg-emerald-400",
  queued: "bg-[#F2D543] animate-pulse",
  processing: "bg-[#F2D543] animate-pulse",
  generating: "bg-[#F2D543] animate-pulse",
  completed: "bg-emerald-400",
  failed: "bg-red-500",
};

export const BUSY = ["queued", "processing", "generating"];

export const CARD =
  "bg-[#171717] border border-gray-800 rounded-xl transition-all hover:border-[#DC569D]/60 hover:shadow-[0_0_0_1px_rgba(220,86,157,0.25),0_0_24px_rgba(220,86,157,0.12)]";

export const INPUT =
  "w-full bg-[#2f2f2f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D]";

export const BTN_PRIMARY =
  "px-4 py-2 bg-[#DC569D] text-white text-sm rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2";
export const BTN_SECONDARY =
  "px-4 py-2 bg-[#2f2f2f] text-gray-300 text-sm rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50";


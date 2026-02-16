import { FlaskConical, Sparkles, ImagePlus, Send, Diamond } from "lucide-react";

const MODELS = [
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    description:
      "State-of-the-art 4K visuals with flawless typography in any language",
    badges: ["Multi-image input", "4K"],
    isNew: false,
  },
  {
    id: "artist-original",
    name: "Artist Original 1.0",
    description: "Cinema-grade visuals and creative control for high-end scenes",
    badges: ["1K", "Styles"],
    isNew: false,
  },
  {
    id: "kling-30",
    name: "Kling 3.0",
    description: "Cinematic visuals with strong style consistency for professional use",
    badges: ["Image input", "2K"],
    isNew: true,
  },
  {
    id: "kling-03",
    name: "Kling 03",
    description: "High-fidelity visuals with precise control over fine details",
    badges: ["4K", "Multi image input"],
    isNew: true,
  },
  {
    id: "grok-imagine",
    name: "Grok Imagine",
    description: "Creative, expressive image generation with fast results by xAI",
    badges: ["Fast", "Expressive"],
    isNew: true,
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    description:
      "Efficient, detailed image creation for high-volume production tasks",
    badges: ["1K", "Budget"],
    isNew: false,
  },
];

function ModelCard({ model }) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-2xl border border-gray-800 bg-[#171717]/95 p-4 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gray-300" />
          <h3 className="text-white font-semibold text-xl leading-tight">{model.name}</h3>
          {model.isNew && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#F2D543] text-black uppercase">
              New
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white text-black uppercase">
          Free
        </span>
      </div>
      <p className="text-gray-300 text-sm leading-5">{model.description}</p>
      <div className="flex gap-2 mt-3 flex-wrap">
        {model.badges.map((badge) => (
          <span
            key={badge}
            className="text-xs px-3 py-1 rounded-full bg-[#2f2f2f] text-gray-200"
          >
            {badge}
          </span>
        ))}
      </div>
    </button>
  );
}

function AiLab() {
  return (
    <main className="flex-1 bg-[#212121] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto min-h-full flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-[#DC569D]/20">
            <FlaskConical className="text-[#DC569D]" size={20} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">AI Lab</h1>
            <p className="text-gray-400 text-sm">Create images and videos with AI models</p>
          </div>
        </div>

        <section className="rounded-3xl border border-gray-800 bg-[#171717] p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODELS.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-gray-800 bg-[#171717]/95 p-4">
          <div className="rounded-2xl border border-gray-800 bg-[#212121] p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <button
                type="button"
                className="h-10 w-10 rounded-xl border border-gray-700 text-gray-300 flex items-center justify-center hover:bg-[#2a2a2a]"
                title="Add image"
              >
                <ImagePlus size={18} />
              </button>
              <button
                type="button"
                className="h-10 w-10 rounded-xl border border-gray-700 text-white bg-[#DC569D] flex items-center justify-center"
                title="Generate"
              >
                <Send size={16} />
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Describe the image you want to create"
              className="w-full resize-none bg-transparent text-white placeholder:text-gray-500 outline-none"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full text-sm bg-[#0C0C0D] border border-gray-700 text-white">
                Nano Banana Pro
              </span>
              <span className="px-3 py-1.5 rounded-full text-sm bg-[#2f2f2f] text-gray-200 border border-gray-700">
                1:1
              </span>
              <span className="px-3 py-1.5 rounded-full text-sm bg-[#2f2f2f] text-gray-200 border border-gray-700 inline-flex items-center gap-2">
                <Diamond size={14} /> 2K
              </span>
              <span className="px-3 py-1.5 rounded-full text-sm bg-[#2f2f2f] text-gray-200 border border-gray-700">
                1 Image
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AiLab;

import { Helmet } from "react-helmet-async";

const DEFAULTS = {
  title: "Reelmotion AI — Create Professional Videos, Images & Audio with AI",
  description:
    "Generate studio-quality AI videos, images, and voiceovers without writing a single prompt. ReelBot guides you step by step. 15+ AI models including Sora 2, Veo 3.1 & Kling V3. Free to start.",
  image: "https://reelmotion.ai/logos/logo_reelmotion_new.png",
  url: "https://reelmotion.ai/",
};

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
  lang = "en",
}) {
  const t = title || DEFAULTS.title;
  const d = description || DEFAULTS.description;
  const img = image || DEFAULTS.image;
  const u = url || DEFAULTS.url;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={u} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={u} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:image" content={img} />
      <meta property="og:site_name" content="Reelmotion AI" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}

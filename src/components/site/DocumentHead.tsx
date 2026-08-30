import { useEffect } from "react";

const DEFAULT = {
  title: "Arena for grads — Your MBA Journey Starts Here",
  description:
    "Arena for grads — MBA mentorship, hackathons, playbooks and B-school comparisons. Your CAT-to-campus companion.",
  image: "https://arenafograds.com/og-image.png",
  url: "https://arenafograds.com",
};

export function DocumentHead({
  title,
  description = DEFAULT.description,
  image = DEFAULT.image,
  path = "",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
}) {
  const fullTitle = title ? `${title} | Arena for grads` : DEFAULT.title;
  const canonical = `${DEFAULT.url}${path ? `/${path.replace(/^\//, "")}` : ""}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:image", image, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image", "property");
    setMeta("twitter:title", fullTitle, "property");
    setMeta("twitter:description", description, "property");
    setMeta("twitter:image", image, "property");
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }, [fullTitle, description, image, canonical, noIndex]);

  return null;
}

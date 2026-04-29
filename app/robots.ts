import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
            },
            {
                userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "anthropic-ai", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot"],
                allow: "/",
            }
        ],
        sitemap: "https://www.bondimdp.com.ar/sitemap.xml",
    };
}

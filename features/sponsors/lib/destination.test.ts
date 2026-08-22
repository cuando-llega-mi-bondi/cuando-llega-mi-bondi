import { describe, expect, it } from "vitest";
import { composeAdHref, detectAdPlatform, googleFaviconUrl } from "./destination";

describe("composeAdHref", () => {
  it("arma Instagram desde el usuario", () => {
    expect(composeAdHref("instagram", "bondimdp")).toBe("https://instagram.com/bondimdp");
  });

  it("arma X y YouTube", () => {
    expect(composeAdHref("x", "@bondimdp")).toBe("https://x.com/bondimdp");
    expect(composeAdHref("youtube", "bondimdp")).toBe("https://youtube.com/@bondimdp");
  });

  it("acepta un link externo completo", () => {
    expect(composeAdHref("web", "nexovet.aeterna.red")).toBe("https://nexovet.aeterna.red/");
  });
});

describe("detectAdPlatform", () => {
  it("reconoce redes y el resto como web", () => {
    expect(detectAdPlatform("https://instagram.com/foo")).toBe("instagram");
    expect(detectAdPlatform("https://x.com/foo")).toBe("x");
    expect(detectAdPlatform("https://youtube.com/@foo")).toBe("youtube");
    expect(detectAdPlatform("https://bondimdp.com.ar")).toBe("web");
  });
});

describe("googleFaviconUrl", () => {
  it("pide el icono al CDN de Google por dominio", () => {
    expect(googleFaviconUrl("https://bondimdp.com.ar/consultar")).toBe(
      "https://www.google.com/s2/favicons?domain=bondimdp.com.ar&sz=64",
    );
  });
});

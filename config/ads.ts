// Adsterra ad units for this site. Values are copied verbatim from the
// Adsterra "GET CODE" output for this domain — do not substitute keys or URLs
// from any other site.

export interface AdsterraBannerUnit {
  key: string;
  format: "iframe";
  height: number;
  width: number;
  params: Record<string, never>;
  invokeUrl: string;
}

export const desktopBanner728x90: AdsterraBannerUnit = {
  key: "4a0cb5868bc780d39c501f97fd50dcf5",
  format: "iframe",
  height: 90,
  width: 728,
  params: {},
  invokeUrl: "https://www.highrevenueformat.com/4a0cb5868bc780d39c501f97fd50dcf5/invoke.js",
};

export const mobileBanner320x50: AdsterraBannerUnit = {
  key: "861ed9c097f1ff76c6076aba3d3da4d2",
  format: "iframe",
  height: 50,
  width: 320,
  params: {},
  invokeUrl: "https://www.highrevenueformat.com/861ed9c097f1ff76c6076aba3d3da4d2/invoke.js",
};

export const nativeBanner = {
  scriptUrl: "https://pl31582249.profitableratecpmnetwork.com/0eeb44fdf9067303da148f4e7e8a55a1/invoke.js",
  containerId: "container-0eeb44fdf9067303da148f4e7e8a55a1",
};

export const socialBar = {
  scriptUrl: "https://pl31582248.profitableratecpmnetwork.com/a5/3c/75/a53c753fe3b0e30e3d09229ce615e0a1.js",
};

export function bannerInvokeCode(unit: AdsterraBannerUnit): string {
  const params = Object.keys(unit.params).length
    ? `'${Object.entries(unit.params).map(([k, v]) => `${k}':'${v}`).join("','")}'`
    : "{}";
  return `<script>atOptions = {'key' : '${unit.key}','format' : '${unit.format}','height' : ${unit.height},'width' : ${unit.width},'params' : ${params}};</script><script src="${unit.invokeUrl}"></script>`;
}

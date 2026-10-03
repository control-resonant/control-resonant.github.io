"use client";

import { useSyncExternalStore } from "react";
import { bannerInvokeCode, desktopBanner728x90, mobileBanner320x50 } from "@/config/ads";

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export function AdBannerSlot() {
  const viewportWidth = useSyncExternalStore(subscribe, () => window.innerWidth, () => 0);

  const unit = viewportWidth === 0
    ? null
    : viewportWidth < 768
      ? mobileBanner320x50
      : desktopBanner728x90;
  const device = viewportWidth === 0 ? "pending" : viewportWidth < 768 ? "mobile" : "desktop";

  return (
    <div className="ad-banner-slot" data-device={device}>
      <div className="ad-label">Advertisement</div>
      {unit ? (
        <iframe
          title="Advertisement"
          srcDoc={bannerInvokeCode(unit)}
          width={unit.width}
          height={unit.height}
          scrolling="no"
          style={{ border: 0, display: "block", maxWidth: "100%" }}
        />
      ) : null}
    </div>
  );
}

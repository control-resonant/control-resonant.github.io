"use client";

import { useEffect } from "react";
import { bannerInvokeCode, desktopBanner728x90, mobileBanner320x50, nativeBanner } from "@/config/ads";

function mountBanner(marker: HTMLElement) {
  const device = window.innerWidth < 768 ? "mobile" : "desktop";
  const unit = device === "mobile" ? mobileBanner320x50 : desktopBanner728x90;
  const wrapper = document.createElement("div");
  wrapper.className = "ad-banner-slot";
  wrapper.dataset.device = device;
  const label = document.createElement("div");
  label.className = "ad-label";
  label.textContent = "Advertisement";
  const frame = document.createElement("iframe");
  frame.title = "Advertisement";
  frame.srcdoc = bannerInvokeCode(unit);
  frame.width = String(unit.width);
  frame.height = String(unit.height);
  frame.scrolling = "no";
  frame.style.border = "0";
  frame.style.display = "block";
  frame.style.maxWidth = "100%";
  wrapper.append(label, frame);
  marker.replaceChildren(wrapper);
}

function mountNative(marker: HTMLElement) {
  const wrapper = document.createElement("div");
  wrapper.className = "ad-native-slot";
  const label = document.createElement("div");
  label.className = "ad-label";
  label.textContent = "Sponsored";
  const script = document.createElement("script");
  script.async = true;
  script.src = nativeBanner.scriptUrl;
  script.dataset.cfasync = "false";
  const container = document.createElement("div");
  container.id = nativeBanner.containerId;
  wrapper.append(label, script, container);
  marker.replaceChildren(wrapper);
}

export function FixedAdSlots() {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-adsterra-banner]").forEach((el) => {
      if (el.dataset.adsterraDone) return;
      el.dataset.adsterraDone = "1";
      mountBanner(el);
    });
    document.querySelectorAll<HTMLElement>("[data-adsterra-native]").forEach((el) => {
      if (el.dataset.adsterraDone) return;
      el.dataset.adsterraDone = "1";
      mountNative(el);
    });
  }, []);
  return null;
}

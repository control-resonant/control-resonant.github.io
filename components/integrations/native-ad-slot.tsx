import { nativeBanner } from "@/config/ads";
import { NativeAdClient } from "./native-ad-client";

export function NativeAdSlot() {
  return (
    <div className="ad-native-slot">
      <div className="ad-label">Sponsored</div>
      <NativeAdClient scriptUrl={nativeBanner.scriptUrl} containerId={nativeBanner.containerId} />
    </div>
  );
}

import Script from "next/script";
import { socialBar } from "@/config/ads";

export function SocialBar() {
  return <Script src={socialBar.scriptUrl} id="adsterra-social-bar" strategy="afterInteractive" />;
}

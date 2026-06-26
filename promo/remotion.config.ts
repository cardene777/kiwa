import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(1);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
// kiwa-promo Studio / render port — avoid colliding with the common 3000 dev
// server slot. Fixed to 3737 so multiple Vite / Next dev servers can keep
// running while we iterate on the promo video.
Config.setStudioPort(3737);

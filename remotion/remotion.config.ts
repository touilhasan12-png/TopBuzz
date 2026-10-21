import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setChromiumDisableWebSecurity(false);
Config.setEntryPoint("src/index.ts");
Config.setJpegQuality(88);

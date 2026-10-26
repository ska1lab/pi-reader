import { disposePiSession } from "../utils/pi-session";

export default defineNitroPlugin((nitroApp) => {
  // 服务关闭时 执行 disposePiSession
  nitroApp.hooks.hook("close", disposePiSession);
});

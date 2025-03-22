import "server-only";

export const env = {
  get SESSION_ID() {
    return required("SESSION_ID");
  },
  get PASSWORD() {
    return required("PASSWORD");
  },
  get MINECRAFT_USER_NAME() {
    return required("MINECRAFT_USER_NAME");
  },
  get MINECRAFT_USER_ID() {
    return required("MINECRAFT_USER_ID");
  },
  get MINECRAFT_GROUP_ID() {
    return required("MINECRAFT_GROUP_ID");
  },
  get MINECRAFT_PATH() {
    return required("MINECRAFT_PATH");
  },
  get SYSTEMD_PATH() {
    return required("SYSTEMD_PATH");
  },
};

type Env = typeof process.env;
function required<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const env = process.env[key];

  if (env === undefined) {
    throw new Error(`Missing required environment variable '${key}'`);
  }

  return env;
}

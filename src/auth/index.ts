import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";

export async function authenticate() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return redirect("/login");
  if (!timingSafeEqual(Buffer.from(session), Buffer.from(env.SESSION_ID))) {
    redirect("/login");
  }
}

const SAMPLE_PASSWORD = "".padStart(env.PASSWORD.length, "_");

export async function login(password: string) {
  if (
    timingSafeEqual(
      Buffer.from(
        password.length === env.PASSWORD.length ? password : SAMPLE_PASSWORD,
      ),
      Buffer.from(env.PASSWORD),
    )
  ) {
    (await cookies()).set("session", env.SESSION_ID, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    redirect("/");
  }
}

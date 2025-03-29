import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Logo from "../icon1.svg";
import { Button } from "../../components";
import { authenticate } from "../../auth";

export default function ServersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 p-4 container mx-auto">
      <div className="flex items-center gap-2">
        <Image alt="logo" src={Logo} height={48} />
        <h1 className="text-xl">Minecraft Server Manager</h1>
        <form className="ml-auto" action={logout}>
          <Button variant="ghost" type="submit">
            Logout
          </Button>
        </form>
      </div>
      <div className="px-2 grid gap-4">{children}</div>
    </div>
  );
}

async function logout() {
  "use server";
  await authenticate();
  (await cookies()).delete("session");
  redirect("/login");
}

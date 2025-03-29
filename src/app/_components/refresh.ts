"use server";

import { revalidateTag } from "next/cache";

export async function refresh(...tags: string[]) {
  tags.forEach(revalidateTag);
}

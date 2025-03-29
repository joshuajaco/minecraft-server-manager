import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../auth";
import { streamLogs } from "../../../minecraft-server";

export async function GET(request: NextRequest) {
  const dir = new URL(request.url).searchParams.get("dir");
  if (!dir) return new NextResponse("Missing dir", { status: 400 });

  await authenticate();

  const logs = streamLogs(dir);

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await logs.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });

  return new NextResponse(stream);
}

import { NextRequest, NextResponse } from "next/server";
import { streamLogs } from "../../../minecraft-server";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  const dir = new URL(request.url).searchParams.get("dir");
  if (!dir) return new NextResponse("Missing dir", { status: 400 });

  const logs = streamLogs(dir);

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await logs.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(encoder.encode(value));
      }
    },
  });

  return new NextResponse(stream);
}

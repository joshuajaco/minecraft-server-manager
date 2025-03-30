import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../auth";
import { streamLogs } from "../../../minecraft-server";
import { assert } from "../../../lib/result";
import { Json } from "../../../lib/json";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const dir = searchParams.get("dir");
  if (!dir) return new NextResponse("Missing dir", { status: 400 });

  const cursor = searchParams.get("cursor");

  await authenticate();

  const logs = streamLogs(dir, cursor ?? undefined);

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await logs.next();

      if (done) {
        controller.close();
        assert(value);
      } else {
        controller.enqueue(encoder.encode(Json.stringify(value) + "\n"));
      }
    },
  });

  return new NextResponse(stream);
}

import { type MinecraftServer } from "../../db";
import {
  _delete,
  getStatus,
  restart,
  start,
  stop,
} from "../../minecraft-server";
import {
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  Tooltip,
  TooltipTrigger,
} from "../../components";
import * as Icons from "lucide-react";
import { Form } from "../../form";
import { authenticate } from "../../auth";
import { revalidateTag } from "next/cache";
import { Err, Ok, Result } from "../../result";

export async function Server({ name, dir }: MinecraftServer) {
  const status = await getStatus(dir);
  return (
    <div className="not-last:border-b border-foreground p-4">
      <div className="flex items-center gap-3">
        <h3 className="text-2xl">{name}</h3>
        <form className="flex items-center gap-1">
          {status === "active" ? (
            <TooltipTrigger>
              <Button
                type="submit"
                variant="icon"
                formAction={restartServer.bind(null, dir)}
              >
                <Icons.RotateCcw />
              </Button>
              <Tooltip>Restart</Tooltip>
            </TooltipTrigger>
          ) : (
            <TooltipTrigger>
              <Button
                type="submit"
                variant="icon"
                formAction={startServer.bind(null, dir)}
              >
                <Icons.CirclePlay />
              </Button>
              <Tooltip>Start</Tooltip>
            </TooltipTrigger>
          )}
          <TooltipTrigger>
            <Button
              isDisabled={status !== "active"}
              type="submit"
              variant="icon"
              formAction={stopServer.bind(null, dir)}
            >
              <Icons.CircleStop />
            </Button>
            <Tooltip>Stop</Tooltip>
          </TooltipTrigger>
          <DialogTrigger>
            <TooltipTrigger>
              <Button variant="icon">
                <Icons.Trash2 />
              </Button>
              <Tooltip>Delete</Tooltip>
            </TooltipTrigger>
            <Modal>
              <Dialog>
                <div className="px-2 grid gap-4">
                  <Heading slot="title" className="text-3xl">
                    Delete {name}
                  </Heading>
                  <Form
                    action={deleteServer}
                    validate={deleteServer.validate}
                    className="grid gap-4"
                  >
                    <input type="hidden" value={dir} name="dir" />
                    <Checkbox name="removeFiles">Delete all files</Checkbox>
                    <div className="flex gap-2">
                      <Button type="submit" variant="destructive">
                        Delete
                      </Button>
                      <Button slot="close" variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </div>
              </Dialog>
            </Modal>
          </DialogTrigger>
        </form>
      </div>
      Status: {status}
    </div>
  );
}

async function startServer(dir: string): Promise<void> {
  "use server";
  await authenticate();
  if (typeof dir !== "string") throw new Error("Invalid dir");
  await start(dir);
  revalidateTag("servers");
}

async function restartServer(dir: string): Promise<void> {
  "use server";
  await authenticate();
  if (typeof dir !== "string") throw new Error("Invalid dir");
  await restart(dir);
  revalidateTag("servers");
}

async function stopServer(dir: string): Promise<void> {
  "use server";
  await authenticate();
  if (typeof dir !== "string") throw new Error("Invalid dir");
  await stop(dir);
  revalidateTag("servers");
}

async function deleteServer({
  dir,
  removeFiles,
}: {
  dir: string;
  removeFiles: boolean;
}): Promise<Result<string, string>> {
  "use server";
  await _delete(dir, { removeFiles });
  revalidateTag("servers");
  return Ok("Server deleted");
}

deleteServer.validate = async (
  formData: FormData,
): Promise<Result<{ dir: string; removeFiles: boolean }, string>> => {
  "use server";
  await authenticate();
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const dir = formData.get("dir");
  if (typeof dir !== "string") return Err("Invalid form data");
  const removeFiles = formData.get("removeFiles") === "on";
  return Ok({ dir, removeFiles });
};

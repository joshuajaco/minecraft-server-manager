import Image from "next/image";
import { Result, Ok, Err } from "../../lib/result";
import { login } from "../../auth";
import { Form } from "../../form";
import Logo from "../icon1.svg";
import { Button, TextField } from "../../components";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="border border-foreground rounded-lg w-fit flex flex-col items-center gap-3 px-6 py-3">
        <Image alt="logo" src={Logo} />
        <h1 className="text-xl text-center">Minecraft Server Manager</h1>
        <Form
          action={action}
          validate={validate}
          className="flex flex-col gap-3 p-3 items-center"
        >
          <TextField
            type="password"
            name="password"
            placeholder="Password"
            aria-label="Password"
          />
          <Button type="submit">Login</Button>
        </Form>
      </div>
    </div>
  );
}

async function validate(formData: FormData): Promise<Result<string, string>> {
  "use server";
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const password = formData.get("password");
  if (typeof password !== "string") return Err("Invalid form data");
  return Ok(password);
}

async function action(password: string): Promise<Result<string, string>> {
  "use server";
  await login(password);
  return Err("Password incorrect");
}

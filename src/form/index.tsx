import { ReactNode } from "react";
import { Result } from "../result";
import { Validation } from "./validation";
import { FormClient } from "./client";

type Props<T> = {
  action: (values: T) => Promise<Result<string | undefined | void, string>>;
  validate: Validation<T>;
  reset?: boolean;
  className?: string;
  children?: ReactNode;
};

export function Form<T>({
  action,
  reset,
  validate,
  className,
  children,
}: Props<T>) {
  async function serverAction(
    formData: FormData,
  ): Promise<Result<string | undefined | void, string>> {
    "use server";
    const values = await validate(formData);
    if (!values.ok) return values;
    return action(values.val);
  }

  return (
    <FormClient action={serverAction} reset={reset} className={className}>
      {children}
    </FormClient>
  );
}

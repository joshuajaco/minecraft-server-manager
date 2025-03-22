"use client";

import { ReactNode, useActionState } from "react";
import { Result } from "../result";

type Props = {
  action: (_: unknown, formData: FormData) => Promise<Result<string, string>>;
  className?: string;
  children?: ReactNode;
};

export function FormClient({ action, className, children }: Props) {
  const [submitResult, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {submitResult && (
        <div>{submitResult.ok ? submitResult.val : submitResult.err}</div>
      )}
    </form>
  );
}

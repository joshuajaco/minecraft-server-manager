"use client";

import React, { ReactNode, useActionState } from "react";
import { Result } from "../result";
import { AlertCircleIcon, InfoIcon } from "lucide-react";

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
        <div className={"flex items-center gap-2"}>
          {submitResult.ok ? (
            <InfoIcon aria-hidden />
          ) : (
            <AlertCircleIcon aria-hidden className="text-red-600" />
          )}
          {submitResult.ok ? submitResult.val : submitResult.err}
        </div>
      )}
    </form>
  );
}

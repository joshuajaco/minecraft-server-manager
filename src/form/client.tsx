"use client";

import React, { ReactNode, useActionState, useContext } from "react";
import { OverlayTriggerStateContext } from "react-aria-components";
import { AlertCircleIcon, InfoIcon } from "lucide-react";
import { Result } from "../result";

type Props = {
  action: (formData: FormData) => Promise<Result<string, string>>;
  className?: string;
  children?: ReactNode;
};

export function FormClient({ action, className, children }: Props) {
  const overlayTrigger = useContext(OverlayTriggerStateContext);

  async function clientAction(
    _: unknown,
    formData: FormData,
  ): Promise<Result<string, string>> {
    const result = await action(formData);
    if (result.ok) overlayTrigger?.close();
    return result;
  }

  const [submitResult, formAction] = useActionState(clientAction, null);

  return (
    <form action={formAction} className={className}>
      {children}
      {submitResult?.ok && !overlayTrigger && (
        <div className="flex items-center gap-2">
          <InfoIcon aria-hidden />
          {submitResult.val}
        </div>
      )}
      {submitResult?.ok === false && (
        <div className="flex items-center gap-2">
          <AlertCircleIcon aria-hidden className="text-red-600" />
          {submitResult.err}
        </div>
      )}
    </form>
  );
}

"use client";

import {
  FormEvent,
  ReactNode,
  startTransition,
  useContext,
  useState,
} from "react";
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

  const [submitResult, setSubmitResult] = useState<Result<string, string>>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const result = await action(new FormData(form));
      if (result.ok) overlayTrigger?.close();
      setSubmitResult(result);
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
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

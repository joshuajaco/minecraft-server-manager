"use client";

import { ReactNode, useState } from "react";
import {
  Provider,
  SelectContext,
  TextFieldContext,
} from "react-aria-components";

export type AutofillProps = {
  defaultValue?: string;
  transform?: (value: string) => string;
  children: ReactNode;
};

export function Autofill({ defaultValue, transform, children }: AutofillProps) {
  const [source, setSource] = useState(defaultValue);
  const [target, setTarget] = useState<string>();

  return (
    <Provider
      values={[
        [
          TextFieldContext,
          {
            slots: {
              source: { defaultValue, onChange: setSource },
              target: {
                value: target ?? (transform ? transform(source ?? "") : source),
                onChange: setTarget,
              },
            },
          },
        ],
        [
          SelectContext,
          {
            slots: {
              source: {
                onSelectionChange: (key) => setSource(key.toString()),
              },
            },
          },
        ],
      ]}
    >
      {children}
    </Provider>
  );
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function sanitize(value: string): string {
  return value
    .trim()
    .replace(/ /g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

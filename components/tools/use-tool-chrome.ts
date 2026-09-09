"use client";

import { useEffect } from "react";
import type { ToolExample } from "@/config/tool-share";
import type { ShareCodec } from "@/lib/share-url";
import { shareHref } from "@/lib/use-shareable-state";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useOptionalToolSession } from "@/components/tools/tool-session";

export function useToolChrome<T>(options: {
  state: T;
  codec: ShareCodec<T>;
  examples: ToolExample<T>[];
  snapshot: ToolSnapshot;
  applyExample: (example: ToolExample<T>) => void;
}) {
  const session = useOptionalToolSession();
  const { state, codec, examples, snapshot, applyExample } = options;

  useEffect(() => {
    if (!session) return;
    session.setSnapshot(snapshot);
  }, [session, snapshot]);

  useEffect(() => {
    if (!session) return;
    const href = shareHref(state, codec);
    session.registerShareHref(() => href);
  }, [session, state, codec]);

  useEffect(() => {
    if (!session) return;
    session.registerExamples(
      examples.map((example) => ({ id: example.id, label: example.label })),
      (id) => {
        const example = examples.find((item) => item.id === id);
        if (example) applyExample(example);
      },
    );
  }, [session, examples, applyExample]);
}

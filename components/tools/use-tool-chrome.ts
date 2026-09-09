"use client";

import { useLayoutEffect } from "react";
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

  useLayoutEffect(() => {
    if (!session) return;
    session.setSnapshot(snapshot);
    session.registerShareHref(() => shareHref(state, codec));
    session.registerApplyExample((id) => {
      const example = examples.find((item) => item.id === id);
      if (example) applyExample(example);
    });
  }, [session, snapshot, state, codec, examples, applyExample]);
}

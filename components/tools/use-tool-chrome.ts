"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
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
  const applyRef = useRef(applyExample);
  const requestToken = session?.exampleRequest?.token;
  const requestId = session?.exampleRequest?.id;

  useLayoutEffect(() => {
    applyRef.current = applyExample;
    if (!session) return;
    session.setSnapshot(snapshot);
    session.registerShareHref(() => shareHref(state, codec));
  }, [session, snapshot, state, codec, applyExample]);

  useEffect(() => {
    if (!requestId || requestToken == null) return;
    const example = examples.find((item) => item.id === requestId);
    if (example) applyRef.current(example);
  }, [requestToken, requestId, examples]);
}

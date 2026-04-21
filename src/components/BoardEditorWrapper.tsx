"use client";

import dynamic from "next/dynamic";

const BoardEditor = dynamic(() => import("@/components/BoardEditor"), {
  ssr: false,
});

export default function BoardEditorWrapper(props: any) {
  return <BoardEditor {...props} />;
}

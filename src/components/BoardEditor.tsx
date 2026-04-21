"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BoardEditorProps {
  boardId: string;
  initialElements: any[];
  initialAssets: any;
  boardTitle: string;
}

export default function BoardEditor({ boardId, initialElements, initialAssets, boardTitle }: BoardEditorProps) {
  const router = useRouter();
  const [api, setApi] = useState<any>(null);
  const excalidrawRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Auto-save: upload full .excalidraw state to R2
  const triggerSave = useCallback(async () => {
    if (!api || !isMountedRef.current) return;

    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      const excalidrawState = {
        type: "excalidraw",
        version: 2,
        source: window.location.origin,
        elements,
        appState: { theme: appState.theme || "dark" },
        files,
      };

      const fileId = `board-${boardId}.excalidraw`;
      const blob = new Blob([JSON.stringify(excalidrawState)], { type: "application/json" });
      const formData = new FormData();
      formData.append("file", blob, fileId);
      formData.append("fileId", fileId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      // Update MongoDB with just the R2 reference
      await fetch(`/api/boards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataFileId: uploadData.id,
          elements: [],
          assets: {},
        }),
      });

      console.log("[AutoSave] Saved to R2:", fileId);
    } catch (e) {
      console.error("[AutoSave] Failed:", e);
    }
  }, [boardId, api]);

  // Debounced onChange handler
  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave();
    }, 3000); // 3 second debounce
  }, [triggerSave]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      // Final save on unmount
      triggerSave();
    };
  }, [triggerSave]);

  const initData = {
    elements: initialElements && initialElements.length > 0 ? initialElements : undefined,
    appState: { theme: "dark" as const },
    files: initialAssets || undefined,
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }} ref={excalidrawRef}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '60px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold' }}>
          {boardTitle}
        </div>
      </div>
      <Excalidraw
        initialData={initData}
        excalidrawAPI={setApi}
        theme="dark"
        onChange={handleChange}
      />
    </div>
  );
}

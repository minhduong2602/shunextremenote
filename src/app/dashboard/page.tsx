"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Folder, Trash2, Upload, Pencil, Check, X } from "lucide-react";

function BoardCard({ board, onDelete, onRename }: { board: any; onDelete: (e: React.MouseEvent, id: string) => void; onRename: (id: string, newTitle: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const confirmRename = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (title.trim() && title.trim() !== board.title) {
      await onRename(board._id, title.trim());
    } else {
      setTitle(board.title); // revert if empty or unchanged
    }
    setEditing(false);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(board.title);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmRename();
    if (e.key === "Escape") { setTitle(board.title); setEditing(false); }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', transition: 'transform 0.15s ease', height: '100%' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        {editing ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }} onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--accent)',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                color: 'var(--foreground)',
                fontSize: '1rem',
                fontWeight: '600',
                outline: 'none',
              }}
            />
            <button onClick={confirmRename} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '0.2rem' }}>
              <Check size={16} />
            </button>
            <button onClick={cancelRename} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
            <Folder size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: '600', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
            <button onClick={startEdit} title="Rename" style={{ background: 'transparent', border: 'none', color: '#a0a5b1', cursor: 'pointer', padding: '0.2rem', flexShrink: 0, opacity: 0.6 }}>
              <Pencil size={13} />
            </button>
          </div>
        )}
        {!editing && (
          <button onClick={(e) => onDelete(e, board._id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Open link */}
      {!editing && (
        <Link href={`/board/${board._id}`} style={{ textDecoration: 'none', marginTop: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ color: '#a0a5b1', fontSize: '0.8rem' }}>
            {new Date(board.updatedAt).toLocaleDateString()} · {new Date(board.updatedAt).toLocaleTimeString()}
          </div>
          <div className="btn-primary" style={{ marginTop: '0.75rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}>
            Open Canvas
          </div>
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchBoards();
    }
  }, [status]);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boards");
      const data = await res.json();
      setBoards(Array.isArray(data) ? data : []);
    } catch {
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    const title = prompt("Enter board title:");
    if (!title) return;
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) fetchBoards();
    else alert((await res.json()).error || "Failed to create board");
  };

  const renameBoard = async (id: string, newTitle: string) => {
    const res = await fetch(`/api/boards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      setBoards((prev) => prev.map((b) => b._id === id ? { ...b, title: newTitle } : b));
    }
  };

  const importExcalidraw = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const title = file.name.replace(/\.excalidraw$/, "") || "Imported Board";
    const r2Key = `board-import-${Date.now()}.excalidraw`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileId", r2Key);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (!uploadRes.ok) { alert("Upload failed"); return; }
    const uploadData = await uploadRes.json();
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dataFileId: uploadData.id }),
    });
    if (res.ok) fetchBoards();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this board?")) return;
    const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
    if (res.ok) fetchBoards();
  };

  if (status === "loading" || loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 3rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>All Boards</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="file" accept=".excalidraw" ref={fileInputRef} onChange={importExcalidraw} style={{ display: 'none' }} />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={20} /> Import .excalidraw
          </button>
          <button className="btn-primary" onClick={createBoard}>
            <Plus size={20} /> New Board
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {boards.map((board) => (
          <BoardCard key={board._id} board={board} onDelete={deleteBoard} onRename={renameBoard} />
        ))}
        {boards.length === 0 && (
          <div style={{ color: '#a0a5b1', gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
            No boards yet. Create one or import a .excalidraw file!
          </div>
        )}
      </div>
    </div>
  );
}

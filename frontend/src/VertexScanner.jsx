import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud,
  ScanLine,
  Download,
  Layers,
  Crop,
  ShieldCheck,
  Loader2,
  X,
  FileDown,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

const GitHubIcon = ({ size = 14 }) => (
  <svg
    viewBox="0 0 16 16"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const USE_MOCK = false;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/scan";

async function scanDocument(file) {
  if (!USE_MOCK) {
    const form = new FormData();
    form.append("file", file);
    const sep = API_URL.includes("?") ? "&" : "?";
    const res = await fetch(`${API_URL}${sep}fmt=png`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Scan failed (${res.status})`);
    return res.blob();
  }
  return mockScan(file);
}

function mockScan(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 1500;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale),
        h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h),
        p = data.data;
      const blackPt = 25,
        whitePt = 200,
        span = 255 / (whitePt - blackPt);
      for (let i = 0; i < p.length; i += 4) {
        const r = p[i],
          g = p[i + 1],
          b = p[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        let nl = (lum - blackPt) * span;
        nl = nl < 0 ? 0 : nl > 255 ? 255 : nl;
        if (nl > 210) {
          p[i] = p[i + 1] = p[i + 2] = 255;
        } else {
          const gn = nl / Math.max(lum, 1);
          p[i] = Math.min(255, r * gn * 1.05);
          p[i + 1] = Math.min(255, g * gn * 1.05);
          p[i + 2] = Math.min(255, b * gn * 1.15);
        }
      }
      ctx.putImageData(data, 0, 0);
      setTimeout(
        () =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
            "image/png",
          ),
        900,
      );
    };
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = URL.createObjectURL(file);
  });
}

async function encodeJpeg(blob) {
  const url = URL.createObjectURL(blob);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  URL.revokeObjectURL(url);
  const W = img.naturalWidth,
    H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0);
  const raw = atob(canvas.toDataURL("image/jpeg", 0.92).split(",")[1]);
  const jpeg = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) jpeg[i] = raw.charCodeAt(i) & 0xff;
  return { jpeg, W, H };
}

async function imagesToPdfBlob(blobs) {
  const pages = [];
  for (const b of blobs) pages.push(await encodeJpeg(b));
  const N = pages.length,
    parts = [],
    off = [];
  let len = 0;
  const toBytes = (s) => {
    const a = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff;
    return a;
  };
  const push = (b) => {
    parts.push(b);
    len += b.length;
  };
  const pushStr = (s) => push(toBytes(s));
  const begin = (n) => {
    off[n] = len;
  };
  pushStr("%PDF-1.4\n");
  begin(1);
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  begin(2);
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${N} >>\nendobj\n`);
  pages.forEach((pg, i) => {
    const pageN = 3 + i * 3,
      imgN = 4 + i * 3,
      contN = 5 + i * 3;
    begin(pageN);
    pushStr(
      `${pageN} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pg.W} ${pg.H}] /Resources << /XObject << /Im0 ${imgN} 0 R >> >> /Contents ${contN} 0 R >>\nendobj\n`,
    );
    begin(imgN);
    pushStr(
      `${imgN} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pg.W} /Height ${pg.H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n`,
    );
    push(pg.jpeg);
    pushStr("\nendstream\nendobj\n");
    const content = `q ${pg.W} 0 0 ${pg.H} 0 0 cm /Im0 Do Q`;
    begin(contN);
    pushStr(
      `${contN} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    );
  });
  const totalObjs = 2 + N * 3,
    xrefStart = len;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= totalObjs; n++)
    xref += String(off[n]).padStart(10, "0") + " 00000 n \n";
  pushStr(xref);
  pushStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
  );
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return new Blob([out], { type: "application/pdf" });
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function crc32(bytes) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function makeZip(files) {
  const enc = new TextEncoder(),
    chunks = [],
    central = [];
  let offset = 0;
  const u16 = (n) => new Uint8Array([n & 255, (n >> 8) & 255]);
  const u32 = (n) =>
    new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]);
  const push = (a) => {
    chunks.push(a);
    offset += a.length;
  };
  for (const f of files) {
    const nameBytes = enc.encode(f.name),
      crc = crc32(f.bytes),
      size = f.bytes.length,
      lo = offset;
    push(u32(0x04034b50));
    push(u16(20));
    push(u16(0));
    push(u16(0));
    push(u16(0));
    push(u16(0));
    push(u32(crc));
    push(u32(size));
    push(u32(size));
    push(u16(nameBytes.length));
    push(u16(0));
    push(nameBytes);
    push(f.bytes);
    central.push({ nameBytes, crc, size, lo });
  }
  const cs = offset;
  for (const c of central) {
    push(u32(0x02014b50));
    push(u16(20));
    push(u16(20));
    push(u16(0));
    push(u16(0));
    push(u16(0));
    push(u16(0));
    push(u32(c.crc));
    push(u32(c.size));
    push(u32(c.size));
    push(u16(c.nameBytes.length));
    push(u16(0));
    push(u16(0));
    push(u16(0));
    push(u16(0));
    push(u32(0));
    push(u32(c.lo));
    push(c.nameBytes);
  }
  const csize = offset - cs;
  push(u32(0x06054b50));
  push(u16(0));
  push(u16(0));
  push(u16(central.length));
  push(u16(central.length));
  push(u32(csize));
  push(u32(cs));
  push(u16(0));
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return new Blob([out], { type: "application/zip" });
}

const ACCEPT = ["image/jpeg", "image/png"];
let _id = 0;

const HOW = [
  {
    icon: UploadCloud,
    t: "Upload",
    d: "Drop one or more photos of your documents — any angle, any lighting.",
  },
  {
    icon: ScanLine,
    t: "Scan",
    d: "Vertex detects each page, corrects the perspective, and cleans the image.",
  },
  {
    icon: Download,
    t: "Download",
    d: "Export a single PDF, or a whole batch bundled into one folder.",
  },
];

const FEATURES = [
  {
    icon: Layers,
    t: "Reliable detection",
    d: "A deep-learning model finds the page against cluttered backgrounds and uneven lighting, where classic edge detection breaks down.",
  },
  {
    icon: Crop,
    t: "Accurate flattening",
    d: "Perspective correction warps any angle or paper size into a clean, upright rectangle, then sharpens the ink for legibility.",
  },
  {
    icon: ShieldCheck,
    t: "Private by default",
    d: "PDFs are assembled locally in your browser at download time. Your documents are never stored on a server.",
  },
];

export default function VertexScanner() {
  const [items, setItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef(null);

  const patch = useCallback((id, next) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...next } : it)),
    );
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []).filter((f) =>
        ACCEPT.includes(f.type),
      );
      if (!files.length) return;
      const created = files.map((file) => {
        const id = ++_id;
        const originalUrl = URL.createObjectURL(file);
        const probe = new Image();
        probe.onload = () =>
          patch(id, { dims: { w: probe.width, h: probe.height } });
        probe.src = originalUrl;
        return {
          id,
          file,
          name: file.name,
          originalUrl,
          dims: null,
          state: "pending",
          resultBlob: null,
          resultUrl: null,
          error: "",
        };
      });
      setItems((prev) => [...prev, ...created]);
    },
    [patch],
  );

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone?.originalUrl) URL.revokeObjectURL(gone.originalUrl);
      if (gone?.resultUrl) URL.revokeObjectURL(gone.resultUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const scanAll = useCallback(async () => {
    setProcessing(true);
    const pending = items.filter((i) => i.state === "pending");
    for (const it of pending) {
      patch(it.id, { state: "processing" });
      try {
        const blob = await scanDocument(it.file);
        patch(it.id, {
          state: "done",
          resultBlob: blob,
          resultUrl: URL.createObjectURL(blob),
        });
      } catch (err) {
        patch(it.id, { state: "error", error: err.message || "Scan failed" });
      }
    }
    setProcessing(false);
  }, [items, patch]);

  const downloadAll = useCallback(async () => {
    const done = items.filter((i) => i.state === "done" && i.resultBlob);
    if (!done.length) return;
    setDownloading(true);
    try {
      if (done.length === 1) {
        const pdf = await imagesToPdfBlob([done[0].resultBlob]);
        saveBlob(pdf, `${done[0].name.replace(/\.[^.]+$/, "")}.pdf`);
        return;
      }
      const folder = "vertex-scans",
        files = [];
      for (let i = 0; i < done.length; i++) {
        const it = done[i];
        const pdf = await imagesToPdfBlob([it.resultBlob]);
        const bytes = new Uint8Array(await pdf.arrayBuffer());
        files.push({
          name: `${folder}/${String(i + 1).padStart(2, "0")}-${it.name.replace(/\.[^.]+$/, "")}.pdf`,
          bytes,
        });
      }
      saveBlob(makeZip(files), `${folder}.zip`);
    } finally {
      setDownloading(false);
    }
  }, [items]);

  const downloadOne = useCallback(async (it) => {
    if (!it.resultBlob) return;
    const pdf = await imagesToPdfBlob([it.resultBlob]);
    saveBlob(pdf, `${it.name.replace(/\.[^.]+$/, "")}.pdf`);
  }, []);

  const reset = useCallback(() => {
    setItems((prev) => {
      prev.forEach((i) => {
        if (i.originalUrl) URL.revokeObjectURL(i.originalUrl);
        if (i.resultUrl) URL.revokeObjectURL(i.resultUrl);
      });
      return [];
    });
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => {
        if (i.originalUrl) URL.revokeObjectURL(i.originalUrl);
        if (i.resultUrl) URL.revokeObjectURL(i.resultUrl);
      });
    },
    [],
  );

  const view = items.length === 0 ? "landing" : "workspace";
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const doneCount = items.filter((i) => i.state === "done").length;
  const pendingCount = items.filter((i) => i.state === "pending").length;
  const phase = processing
    ? "processing"
    : items.every((i) => i.state === "done" || i.state === "error")
      ? "done"
      : "ready";
  const stepIndex = phase === "done" ? 2 : 1;
  const year = new Date().getFullYear();

  const scrollToId = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="vx">
      <style>{CSS}</style>

      <header className="vx-nav">
        <div className="vx-nav-in">
          <button
            className="vx-brand"
            onClick={view === "workspace" ? reset : undefined}
          >
            Vertex
          </button>
          <nav className="vx-nav-r">
            {view === "landing" ? (
              <>
                <a className="vx-link" href="#how" onClick={scrollToId("how")}>
                  How it works
                </a>
                <a
                  className="vx-link"
                  href="#features"
                  onClick={scrollToId("features")}
                >
                  Features
                </a>
              </>
            ) : (
              <button className="vx-link" onClick={reset}>
                Start over
              </button>
            )}
            <a
              className="vx-link vx-link-icon"
              href="https://github.com/AdamYahmadi/vertex"
              target="_blank"
              rel="noreferrer"
            >
              <GitHubIcon /> GitHub
            </a>
          </nav>
        </div>
      </header>

      {view === "landing" && (
        <main className="vx-main">
          <section className="vx-hero">
            <p className="vx-kicker">Document scanner</p>
            <h1 className="vx-h1">
              Turn photos of paper into scanner-quality PDFs.
            </h1>
            <p className="vx-lead">
              Vertex detects the document in a photo, corrects the perspective,
              cleans the lighting, and exports a crisp PDF. It handles complex
              backgrounds and any paper size, and never uploads your files to a
              server.
            </p>
          </section>

          <section className="vx-upload">
            <div
              className={`vx-drop ${dragging ? "is-drag" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
            >
              <span className="vx-drop-badge">
                <UploadCloud size={20} strokeWidth={1.75} />
              </span>
              <p className="vx-drop-t">Drop documents to scan</p>
              <p className="vx-drop-d">
                or <span className="vx-drop-browse">browse files</span> — JPG or
                PNG, multiple allowed
              </p>
            </div>
          </section>

          <section className="vx-sec" id="how">
            <h2 className="vx-sec-h">How it works</h2>
            <div className="vx-grid-3">
              {HOW.map((s) => {
                const Icon = s.icon;
                return (
                  <div className="vx-cell" key={s.t}>
                    <span className="vx-cell-ic">
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <h3 className="vx-cell-h">{s.t}</h3>
                    <p className="vx-cell-d">{s.d}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="vx-sec" id="features">
            <h2 className="vx-sec-h">Built for real-world documents</h2>
            <div className="vx-grid-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div className="vx-cell" key={f.t}>
                    <span className="vx-cell-ic">
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <h3 className="vx-cell-h">{f.t}</h3>
                    <p className="vx-cell-d">{f.d}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {view === "workspace" && (
        <main className="vx-main">
          <button className="vx-back" onClick={reset}>
            <ArrowLeft size={15} strokeWidth={2} /> Back
          </button>

          <div className="vx-ws-top">
            <div>
              <h1 className="vx-ws-h">Documents</h1>
              <p className="vx-ws-sub">
                {items.length} added{doneCount ? ` · ${doneCount} scanned` : ""}
              </p>
              <p
                className="vx-ws-sub"
                style={{
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--danger)",
                }}
              >
                <AlertCircle size={13} strokeWidth={2} />
                Images are downscaled because it's running on a free server.
              </p>
            </div>
            <ol className="vx-stepper" aria-hidden="true">
              {["Upload", "Scan", "Download"].map((label, i) => (
                <li
                  key={label}
                  className={`vx-st ${i < stepIndex ? "done" : i === stepIndex ? "on" : ""}`}
                >
                  {label}
                </li>
              ))}
            </ol>
          </div>

          <div className="vx-list">
            {items.map((it) => (
              <section className="vx-item" key={it.id}>
                <div className="vx-item-bar">
                  <span className="vx-item-name">{it.name}</span>
                  <span className="vx-item-meta">
                    {it.dims ? `${it.dims.w}×${it.dims.h}` : ""}
                  </span>
                  {!processing && (
                    <button
                      className="vx-ibtn"
                      title="Remove"
                      onClick={() => removeItem(it.id)}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <div className="vx-compare">
                  <figure className="vx-pane">
                    <figcaption className="vx-pane-h">
                      <span>Original</span>
                    </figcaption>
                    <div className="vx-pane-b">
                      <img
                        src={it.originalUrl}
                        alt="Original"
                        className="vx-doc"
                      />
                    </div>
                  </figure>
                  <figure className="vx-pane">
                    <figcaption className="vx-pane-h">
                      <span className="vx-scanned">Scanned</span>
                      {it.state === "done" && (
                        <button
                          className="vx-ibtn sm"
                          title="Download PDF"
                          onClick={() => downloadOne(it)}
                        >
                          <FileDown size={13} strokeWidth={2} />
                        </button>
                      )}
                    </figcaption>
                    <div className="vx-pane-b">
                      {it.state === "done" && (
                        <img
                          src={it.resultUrl}
                          alt="Scanned"
                          className="vx-doc"
                        />
                      )}
                      {it.state === "processing" && <div className="vx-skel" />}
                      {it.state === "pending" && (
                        <span className="vx-pane-note">Not scanned yet</span>
                      )}
                      {it.state === "error" && (
                        <span className="vx-pane-note err">
                          <AlertCircle size={14} strokeWidth={2} /> {it.error}
                        </span>
                      )}
                    </div>
                  </figure>
                </div>
              </section>
            ))}
          </div>

          <div className="vx-actions">
            {phase === "ready" && (
              <>
                <button className="vx-btn vx-btn-primary" onClick={scanAll}>
                  Scan{" "}
                  {pendingCount > 1 ? `${pendingCount} documents` : "document"}
                </button>
                <button
                  className="vx-btn vx-btn-secondary"
                  onClick={() => inputRef.current?.click()}
                >
                  Add images
                </button>
                {doneCount > 0 && (
                  <button
                    className="vx-btn vx-btn-secondary"
                    onClick={downloadAll}
                    disabled={downloading}
                  >
                    Download
                  </button>
                )}
                <button className="vx-btn vx-btn-tertiary" onClick={reset}>
                  Clear
                </button>
              </>
            )}
            {phase === "processing" && (
              <span className="vx-progress">
                <Loader2 size={15} className="vx-spin" strokeWidth={2} />{" "}
                Scanning {doneCount + 1} of {items.length}…
              </span>
            )}
            {phase === "done" && (
              <>
                <button
                  className="vx-btn vx-btn-primary"
                  onClick={downloadAll}
                  disabled={downloading || doneCount === 0}
                >
                  {downloading
                    ? "Preparing…"
                    : doneCount > 1
                      ? `Download ${doneCount} PDFs`
                      : "Download PDF"}
                </button>
                <button
                  className="vx-btn vx-btn-secondary"
                  onClick={() => inputRef.current?.click()}
                >
                  Add more
                </button>
                <button className="vx-btn vx-btn-tertiary" onClick={reset}>
                  New batch
                </button>
              </>
            )}
          </div>
        </main>
      )}

      <footer className="vx-footer">
        <div className="vx-footer-in">
          <p className="vx-copy">
            © {year} Vertex — made for cleaner documents.
          </p>
          <nav className="vx-footer-links">
            <a
              className="vx-link"
              href="https://github.com/AdamYahmadi/vertex"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="vx-link"
              href="https://github.com/AdamYahmadi/vertex/issues"
              target="_blank"
              rel="noreferrer"
            >
              Report an issue
            </a>
            <a
              className="vx-link"
              href="https://github.com/AdamYahmadi/vertex#readme"
              target="_blank"
              rel="noreferrer"
            >
              Docs
            </a>
          </nav>
        </div>
      </footer>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600&display=swap');

.vx{
  --bg:#F5F5F6; --surface:#FFFFFF; --panel:#F3F3F4;
  --text:#18181B; --text-2:#3F3F46; --muted:#6E6E78; --faint:#A1A1AA;
  --border:#E6E6E4; --border-2:#DBDBD8;
  --accent:#0B7A5B; --accent-ink:#095E47; --accent-soft:#EAF5EF; --accent-line:#CDE7DA;
  --danger:#DC2626;
  --ring:0 0 0 3px rgba(11,122,91,.22);
  color:var(--text); background:var(--bg); min-height:100%;
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  font-size:14px; line-height:1.5; -webkit-font-smoothing:antialiased;
  font-feature-settings:'cv02','cv03','cv04','cv11'; letter-spacing:-.006em;
  display:flex; flex-direction:column;
}
.vx *{box-sizing:border-box;}
.vx ::selection{background:rgba(11,122,91,.14);}

.vx-nav{position:sticky; top:0; z-index:30; background:rgba(245,245,246,.86); backdrop-filter:blur(8px); border-bottom:1px solid var(--border);}
.vx-nav-in{max-width:1040px; margin:0 auto; height:60px; padding:0 clamp(16px,4vw,32px); display:flex; align-items:center; justify-content:space-between;}
.vx-brand{background:none; border:0; padding:0; cursor:pointer; font-weight:600; font-size:22px; letter-spacing:-.02em; color:var(--text);}
.vx-nav-r{display:flex; align-items:center; gap:2px;}
.vx-link{display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:450; color:var(--muted); text-decoration:none; padding:6px 10px; border-radius:6px; background:none; border:0; cursor:pointer; font-family:inherit; transition:color .12s, background .12s;}
.vx-link:hover{color:var(--text); background:rgba(24,24,27,.05);}
.vx-link-icon{color:var(--text-2);}
@media (max-width:560px){ .vx-nav-r .vx-link:not(.vx-link-icon){display:none;} }

.vx-main{flex:1; width:100%; max-width:1040px; margin:0 auto; padding:clamp(36px,6vw,60px) clamp(16px,4vw,32px) 56px;}

.vx-hero{max-width:600px; margin-bottom:clamp(28px,4vw,40px);}
.vx-kicker{font-size:12px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:var(--accent); margin:0 0 14px;}
.vx-h1{font-size:clamp(26px,3.6vw,34px); font-weight:600; line-height:1.14; letter-spacing:-.025em; margin:0 0 16px; color:var(--text);}
.vx-lead{font-size:15px; line-height:1.65; color:var(--text-2); margin:0; max-width:60ch;}

.vx-upload{margin-bottom:clamp(40px,6vw,72px);}
.vx-drop{display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
  min-height:240px; padding:40px 24px; background:var(--surface);
  border:1px dashed var(--border-2); border-radius:12px; cursor:pointer;
  box-shadow:0 1px 2px rgba(16,16,20,.03);
  transition:border-color .14s, background .14s, box-shadow .14s;}
.vx-drop:hover{border-color:var(--accent); background:#FBFEFC; box-shadow:0 2px 10px rgba(11,122,91,.08);}
.vx-drop.is-drag{border-color:var(--accent); background:#F7FCF9; box-shadow:var(--ring);}
.vx-drop:focus-visible{outline:none; border-color:var(--accent); box-shadow:var(--ring);}
.vx-drop-badge{display:grid; place-items:center; width:44px; height:44px; margin-bottom:16px; border-radius:11px;
  background:var(--accent-soft); color:var(--accent); border:1px solid var(--accent-line);}
.vx-drop-t{font-size:15px; font-weight:550; color:var(--text); margin:0 0 5px;}
.vx-drop-d{font-size:13.5px; color:var(--muted); margin:0;}
.vx-drop-browse{color:var(--accent); font-weight:500;}

.vx-sec{padding-top:clamp(32px,5vw,48px); border-top:1px solid var(--border);}
.vx-sec + .vx-sec{margin-top:clamp(32px,5vw,48px);}
.vx-sec-h{font-size:13px; font-weight:600; letter-spacing:.01em; color:var(--text); margin:0 0 clamp(22px,3vw,30px);}
.vx-grid-3{display:grid; grid-template-columns:1fr; gap:clamp(24px,3vw,34px);}
@media (min-width:720px){ .vx-grid-3{grid-template-columns:repeat(3,1fr); gap:40px;} }
.vx-cell{min-width:0;}
.vx-cell-ic{display:grid; place-items:center; width:36px; height:36px; border-radius:9px; background:var(--accent-soft); color:var(--accent); border:1px solid var(--accent-line); margin-bottom:14px;}
.vx-cell-h{font-size:14.5px; font-weight:600; color:var(--text); margin:0 0 7px; letter-spacing:-.01em;}
.vx-cell-d{font-size:13.5px; line-height:1.6; color:var(--muted); margin:0;}

.vx-back{display:inline-flex; align-items:center; gap:6px; background:none; border:0; cursor:pointer; color:var(--muted); font-family:inherit; font-size:13px; font-weight:450; padding:4px 0; margin-bottom:20px; transition:color .12s;}
.vx-back:hover{color:var(--text);}
.vx-ws-top{display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding-bottom:18px; margin-bottom:22px; border-bottom:1px solid var(--border);}
.vx-ws-h{font-size:20px; font-weight:600; letter-spacing:-.02em; margin:0;}
.vx-ws-sub{font-size:13px; color:var(--muted); margin:5px 0 0;}
.vx-stepper{display:flex; align-items:center; gap:16px; list-style:none; margin:0; padding:0;}
.vx-st{font-size:12.5px; color:var(--faint); position:relative;}
.vx-st.on{color:var(--accent); font-weight:600;}
.vx-st.done{color:var(--muted);}
.vx-st + .vx-st::before{content:""; position:absolute; left:-10px; top:50%; width:3px; height:3px; border-radius:50%; background:var(--border-2); transform:translateY(-50%);}
@media (max-width:600px){ .vx-stepper{display:none;} }

.vx-list{display:flex; flex-direction:column; gap:clamp(24px,3vw,34px);}
.vx-item-bar{display:flex; align-items:center; gap:10px; margin-bottom:10px;}
.vx-item-name{font-size:13px; font-weight:500; color:var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.vx-item-meta{font-size:12px; color:var(--faint); font-variant-numeric:tabular-nums; flex:none;}
.vx-ibtn{margin-left:auto; display:grid; place-items:center; width:26px; height:26px; cursor:pointer; background:var(--surface); border:1px solid var(--border-2); border-radius:6px; color:var(--muted); transition:.12s;}
.vx-ibtn:hover{color:var(--text); border-color:var(--faint);}
.vx-ibtn.sm{margin-left:auto; width:22px; height:22px; border:0; background:none;}
.vx-ibtn.sm:hover{background:rgba(24,24,27,.06); color:var(--accent);}

.vx-compare{display:grid; grid-template-columns:1fr; gap:12px;}
@media (min-width:760px){ .vx-compare{grid-template-columns:1fr 1fr;} }
.vx-pane{margin:0; background:var(--surface); border:1px solid var(--border); border-radius:9px; overflow:hidden; box-shadow:0 1px 2px rgba(16,16,20,.03);}
.vx-pane-h{display:flex; align-items:center; height:36px; padding:0 12px; border-bottom:1px solid var(--border); font-size:11.5px; font-weight:500; color:var(--muted); letter-spacing:.01em;}
.vx-scanned{color:var(--accent); font-weight:600;}
.vx-pane-b{position:relative; height:clamp(300px,46vh,480px); background:var(--panel); display:flex; align-items:center; justify-content:center; padding:clamp(14px,2.5vw,26px);}
.vx-doc{max-width:100%; max-height:100%; object-fit:contain; box-shadow:0 1px 3px rgba(16,16,20,.08),0 8px 20px rgba(16,16,20,.07);}
.vx-pane-note{display:inline-flex; align-items:center; gap:7px; font-size:13px; color:var(--faint);}
.vx-pane-note.err{color:var(--danger);}
.vx-skel{width:100%; height:100%; border-radius:4px; background:linear-gradient(100deg,#E8E8EA 40%,#F2F2F4 50%,#E8E8EA 60%); background-size:200% 100%; animation:vx-sh 1.25s ease-in-out infinite;}
@keyframes vx-sh{to{background-position:-200% 0;}}

.vx-actions{display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:clamp(24px,3vw,32px); padding-top:20px; border-top:1px solid var(--border);}
.vx-btn{display:inline-flex; align-items:center; justify-content:center; gap:7px; height:36px; padding:0 15px; font-family:inherit; font-size:13.5px; font-weight:500; letter-spacing:-.006em; border-radius:7px; border:1px solid transparent; cursor:pointer; transition:.13s ease;}
.vx-btn:focus-visible{outline:none; box-shadow:var(--ring);}
.vx-btn-primary{background:var(--accent); color:#fff; box-shadow:0 1px 2px rgba(11,122,91,.22);}
.vx-btn-primary:hover{background:var(--accent-ink);}
.vx-btn-primary:disabled{opacity:.55; cursor:default;}
.vx-btn-secondary{background:var(--surface); color:var(--text-2); border-color:var(--border-2);}
.vx-btn-secondary:hover{border-color:var(--faint); color:var(--text);}
.vx-btn-secondary:disabled{opacity:.55; cursor:default;}
.vx-btn-tertiary{background:none; color:var(--muted); padding:0 10px;}
.vx-btn-tertiary:hover{color:var(--text); background:rgba(24,24,27,.05);}
.vx-progress{display:inline-flex; align-items:center; gap:9px; font-size:13.5px; color:var(--text-2); font-variant-numeric:tabular-nums;}
.vx-spin{animation:vx-rot .8s linear infinite; color:var(--accent);}
@keyframes vx-rot{to{transform:rotate(360deg);}}

.vx-footer{border-top:1px solid var(--border); background:var(--panel);}
.vx-footer-in{max-width:1040px; margin:0 auto; padding:22px clamp(16px,4vw,32px); display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;}
.vx-copy{font-size:13px; color:var(--muted); margin:0;}
.vx-footer-links{display:flex; align-items:center; gap:4px;}

@media (max-width:560px){
  .vx-actions .vx-btn{flex:1 1 auto;}
  .vx-btn-tertiary{flex-basis:100%;}
  .vx-footer-in{justify-content:flex-start;}
}
@media (prefers-reduced-motion:reduce){ .vx-spin{animation-duration:1.6s;} .vx-skel{animation:none;} .vx-btn,.vx-link,.vx-drop{transition:none;} }
`;


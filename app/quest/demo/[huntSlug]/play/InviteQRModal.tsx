"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QuestIcon } from "../../../_components/QuestIcon";

type Props = {
  link: string;
  teamName: string;
  inviteCode: string;
  onClose: () => void;
  onCopyLink: () => void;
  linkCopied: boolean;
};

export function InviteQRModal({
  link,
  teamName,
  inviteCode,
  onClose,
  onCopyLink,
  linkCopied,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(link, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 640,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Could not render QR.");
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite QR code"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 12, 8, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          padding: 20,
          width: "min(100%, 360px)",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div className="label" style={{ textAlign: "center" }}>
          SCAN TO JOIN
        </div>
        <div className="hand" style={{ fontSize: 24, lineHeight: 1, textAlign: "center" }}>
          {teamName}
        </div>
        <div
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            background: "white",
            border: "2px solid var(--ink)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
          }}
        >
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={`QR code that links to ${link}`}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          ) : err ? (
            <div className="muted small" style={{ textAlign: "center", padding: 16 }}>
              {err}
            </div>
          ) : (
            <div className="muted small" style={{ textAlign: "center" }}>
              Drawing…
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCopyLink}
          aria-label={linkCopied ? "Invite link copied" : "Copy invite link"}
          title="Tap to copy"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "10px 12px",
            background: "var(--paper)",
            border: "1px dashed var(--hair)",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "left",
            minHeight: 44,
          }}
        >
          <span
            className="mono small"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {linkCopied ? "Copied to clipboard" : link.replace(/^https?:\/\//, "")}
          </span>
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
              opacity: linkCopied ? 1 : 0.7,
              flexShrink: 0,
            }}
          >
            <QuestIcon name={linkCopied ? "check" : "copy"} size={16} />
          </span>
        </button>
        <div className="muted small" style={{ textAlign: "center" }}>
          Or share the code{" "}
          <b style={{ color: "var(--accent)", letterSpacing: "0.12em" }}>{inviteCode}</b>
        </div>
        <button
          className="btn primary"
          onClick={onClose}
          type="button"
          style={{ width: "100%", minHeight: 44, marginTop: 4 }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

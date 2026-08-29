"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function PixBlock({
  payload,
  amount,
}: {
  payload: string;
  amount: number;
}) {
  const [copied, setCopied] = useState(false);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(payload)}`;

  useEffect(() => {
    setCopied(false);
  }, [payload]);

  async function copyPix() {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-3">
      <div className="font-bold text-sm text-slate-900">PIX Copia e Cola</div>
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt="QR Code PIX"
          width={180}
          height={180}
          className="bg-white rounded-lg border p-2"
        />
        <p className="text-xs text-gray-500">
          Valor exato: <strong>{formatCurrency(amount)}</strong>
        </p>
      </div>
      <div className="bg-white p-2 rounded border font-mono text-xs text-gray-600 break-all">
        {payload}
      </div>
      <button
        type="button"
        onClick={copyPix}
        className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg inline-flex items-center justify-center gap-2"
      >
        <Copy className="size-4" />
        {copied ? "Código PIX copiado!" : "Copiar Código PIX"}
      </button>
    </div>
  );
}

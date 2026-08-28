"use client";

import { BellRing } from "lucide-react";

export function SoundAlert({
  visible,
  onSilence,
}: {
  visible: boolean;
  onSilence: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex justify-between items-center animate-bounce">
      <div className="flex items-center gap-2 font-black text-lg">
        <BellRing className="size-6" />
        NOVO PEDIDO RECEBIDO!
      </div>
      <button
        type="button"
        onClick={onSilence}
        className="bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg text-sm"
      >
        Silenciar Alarme
      </button>
    </div>
  );
}

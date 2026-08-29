"use client";

import { BellRing } from "lucide-react";

export function SoundAlert({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="bg-red-600 text-white p-4 rounded-xl flex justify-between items-center">
      <div className="flex items-center gap-2 font-black text-lg">
        <BellRing className="size-6" />
        Novo pedido recebido
      </div>
      <span className="text-xs font-bold bg-white text-red-600 px-3 py-1.5 rounded-lg">
        Aceite o pedido para silenciar
      </span>
    </div>
  );
}

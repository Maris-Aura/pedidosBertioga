"use client";

import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  value,
  onChange,
  placeholder,
  required,
  autoComplete = "new-password",
  reveal,
  onRevealChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  reveal: boolean;
  onRevealChange: (reveal: boolean) => void;
  id?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={reveal ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full border rounded-lg p-2 pr-10 text-sm"
      />
      <button
        type="button"
        onClick={() => onRevealChange(!reveal)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500"
        aria-label={reveal ? "Ocultar senha" : "Ver senha"}
      >
        {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

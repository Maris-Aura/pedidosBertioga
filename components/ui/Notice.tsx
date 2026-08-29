export function FieldNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
    >
      {message}
    </p>
  );
}

export function SuccessNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
      {message}
    </p>
  );
}

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="
        flex h-screen w-full
        flex-col items-center justify-center
        gap-6 animate-in fade-in duration-300
      "
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Carregando módulo…
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Preparando o ambiente, só um momento.
        </p>
      </div>
    </div>
  );
}

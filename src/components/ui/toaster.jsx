import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl shadow-lg border text-sm transition-all animar-surgir ${
            variant === 'destructive'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <div className="grid gap-1">
            {title && <p className="font-semibold">{title}</p>}
            {description && <p className="text-xs text-slate-600 leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(id)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
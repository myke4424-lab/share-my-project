import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

function toast(opts: ToastOptions) {
  if (opts.variant === "destructive") {
    sonnerToast.error(opts.title, { description: opts.description });
  } else {
    sonnerToast(opts.title, { description: opts.description });
  }
}

export function useToast() {
  return { toast };
}

export { toast };

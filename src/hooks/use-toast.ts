import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

function toast(opts: ToastOptions) {
  const options: { description?: string; duration?: number } = {};
  if (opts.description) options.description = opts.description;
  if (opts.duration) options.duration = opts.duration;
  
  if (opts.variant === "destructive") {
    sonnerToast.error(opts.title, options);
  } else {
    sonnerToast(opts.title, options);
  }
}

export function useToast() {
  return { toast };
}

export { toast };

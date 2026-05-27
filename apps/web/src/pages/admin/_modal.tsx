import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { D } from "./_shared";

export function Modal({
  open, onClose, title, subtitle, children, wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={cn(
                "relative w-full pointer-events-auto flex flex-col rounded-2xl shadow-2xl border",
                wide ? "max-w-2xl" : "max-w-lg",
                D.header, D.border,
              )}
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className={cn("flex items-start justify-between gap-4 px-6 py-5 border-b flex-shrink-0", D.border)}>
                <div>
                  <h2 className={cn("font-semibold text-base leading-tight", D.text)}>{title}</h2>
                  {subtitle && <p className={cn("text-xs mt-1", D.muted)}>{subtitle}</p>}
                </div>
                <button onClick={onClose}
                  className={cn("p-1.5 rounded-lg transition-colors hover:bg-slate-100 flex-shrink-0 mt-0.5", D.muted)}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

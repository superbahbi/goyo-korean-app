import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PracticeCompleteProps {
  title: string;
  eyebrow: string;
  heading: string;
  icon: ReactNode;
  closeLabel: string;
  restartLabel: ReactNode;
  restartClassName: string;
  onClose: () => void;
  onRestart: () => void;
  children: ReactNode;
}

export function PracticeComplete({
  title,
  eyebrow,
  heading,
  icon,
  closeLabel,
  restartLabel,
  restartClassName,
  onClose,
  onRestart,
  children,
}: PracticeCompleteProps) {
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-modal="true"
        aria-describedby={undefined}
        showCloseButton={false}
        className="inset-0 top-0 left-0 z-50 flex max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 overflow-y-auto rounded-none border-0 bg-slate-950/40 p-4 shadow-none backdrop-blur-sm sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            {icon}
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900">{heading}</h2>
          <p className="mt-3 text-slate-600">{children}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="min-h-12 flex-1"
              onClick={onClose}
            >
              {closeLabel}
            </Button>
            <Button
              className={`min-h-12 flex-1 ${restartClassName}`}
              onClick={onRestart}
            >
              {restartLabel}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

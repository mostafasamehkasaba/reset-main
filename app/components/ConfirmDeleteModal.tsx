"use client";

type ConfirmDeleteModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDeleteModal({
  open,
  title = "تأكيد الحذف",
  message = "هل أنت متأكد أنك تريد الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
  confirmText = "تأكيد الحذف",
  cancelText = "إلغاء",
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="text-right">
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


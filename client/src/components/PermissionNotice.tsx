interface PermissionNoticeProps {
  message: string;
  onClose: () => void;
}

export default function PermissionNotice({
  message,
  onClose,
}: PermissionNoticeProps) {
  return (
    <div className="fixed right-6 top-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg">
      <div className="flex-1">
        {message}
      </div>

      <button
        onClick={onClose}
        className="font-semibold text-amber-700 hover:text-amber-900"
        aria-label="Close permission notice"
      >
        ×
      </button>
    </div>
  );
}
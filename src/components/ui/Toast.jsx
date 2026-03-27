/* eslint-disable react-refresh/only-export-components */
import React, { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export const Toast = ({
  message,
  type = "success",
  onClose,
  duration = 2000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
      : "bg-gradient-to-r from-red-500 to-rose-500";

  const Icon = type === "success" ? CheckCircle : XCircle;

  return (
    <div className="fixed top-4 right-4 z-9999 animate-slide-in-right">
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-75 max-w-md`}
      >
        <Icon size={24} className="shrink-0" />
        <span className="flex-1 font-medium text-sm">{message}</span>
        <button
          onClick={onClose}
          className="shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = React.useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastContainer = () =>
    toast ? (
      <Toast message={toast.message} type={toast.type} onClose={hideToast} />
    ) : null;

  return { showToast, ToastContainer };
};

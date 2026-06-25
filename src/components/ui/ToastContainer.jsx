import React, { useState, useEffect, createContext, useContext } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", duration = 4000) => {
    const id = "toast_" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between text-slate-800 animate-fade-in ${
            t.type === "success" ? "bg-green-50 border-green-200" :
            t.type === "error" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {t.type === "success" && <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />}
            {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-650 shrink-0" />}
            {t.type === "info" && <Info className="h-5 w-5 text-blue-600 shrink-0" />}
            <span>{t.message}</span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-450 hover:text-slate-650 ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

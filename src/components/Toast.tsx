import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'text-green-400 border-green-500/30 bg-green-500/10',
  error: 'text-red-400 border-red-500/30 bg-red-500/10',
  warning: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
};

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    if (isVisible) {
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const Icon = iconMap[type];

  return (
    <div
      className={`fixed top-20 right-4 z-[100] transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm ${colorMap[type]}`}>
        <Icon size={20} />
        <span className="text-sm font-medium text-primary-text">{message}</span>
        <button onClick={onClose} className="text-tertiary-text hover:text-primary-text">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

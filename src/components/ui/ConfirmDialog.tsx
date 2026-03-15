import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      iconBg: 'bg-red-500/20',
      btn: 'bg-red-500 hover:bg-red-600 text-white',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    },
    warning: {
      icon: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      btn: 'bg-yellow-500 hover:bg-yellow-600 text-black',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    },
    info: {
      icon: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      btn: 'bg-blue-500 hover:bg-blue-600 text-white',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  };

  const v = variantStyles[dialog?.variant ?? 'danger'];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleCancel}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-10 h-10 rounded-full ${v.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${v.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={v.iconPath} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                {dialog.title && (
                  <h3 className="font-bold text-[var(--text-primary)] mb-1">{dialog.title}</h3>
                )}
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{dialog.message}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${v.btn}`}
              >
                {dialog.confirmText ?? t('common.confirm.confirmBtn')}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--border-primary)] transition-colors"
              >
                {dialog.cancelText ?? t('common.confirm.cancelBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

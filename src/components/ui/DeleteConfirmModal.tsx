import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';

interface DeleteConfirmModalProps {
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ itemName, onConfirm, onCancel }) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');

    const handleConfirm = () => {
        if (input !== itemName) return;
        onConfirm();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-primary)]">{t('common.deleteConfirm.title')}</h3>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{t('common.deleteConfirm.message')}</p>
                    </div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 mb-4">
                    <p className="text-sm font-mono text-[var(--text-primary)] break-all">{itemName}</p>
                </div>
                <input
                    type="text"
                    placeholder={t('common.deleteConfirm.placeholder')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    autoFocus
                    className="w-full px-3 py-2.5 mb-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-red-400 transition-colors"
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleConfirm}
                        disabled={input !== itemName}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600"
                    >
                        {t('common.deleteConfirm.confirmBtn')}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--border-primary)] transition-colors"
                    >
                        {t('common.deleteConfirm.cancelBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;

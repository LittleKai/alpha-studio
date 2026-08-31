import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';

/** Bảng chữ không có ký tự dễ đọc nhầm (0/O, 1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const randomCode = () =>
    Array.from({ length: 3 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');

interface DeleteConfirmModalProps {
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
    /**
     * Cách xác nhận: `name` (mặc định) gõ lại đúng tên mục; `code` gõ lại 3 ký tự
     * ngẫu nhiên sinh ngay lúc mở hộp thoại.
     */
    mode?: 'name' | 'code';
    /** Đang gọi API xoá — khoá cả hai nút và chặn đóng hộp thoại giữa chừng. */
    deleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    itemName,
    onConfirm,
    onCancel,
    mode = 'name',
    deleting = false
}) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    // Sinh một lần cho mỗi lần mở hộp thoại — không đổi khi người dùng gõ
    const [code] = useState(randomCode);

    const expected = mode === 'code' ? code : itemName;
    const matched = mode === 'code'
        ? input.trim().toUpperCase() === expected
        : input === expected;
    const canConfirm = matched && !deleting;

    const handleConfirm = () => {
        if (!canConfirm) return;
        onConfirm();
    };

    const handleCancel = () => {
        if (deleting) return;
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleCancel}>
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-primary)]">{t('common.deleteConfirm.title')}</h3>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {mode === 'code' ? t('common.deleteConfirm.codeMessage') : t('common.deleteConfirm.message')}
                        </p>
                    </div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 mb-4">
                    <p className="text-sm font-mono text-[var(--text-primary)] break-all">{itemName}</p>
                </div>

                {mode === 'code' && (
                    <>
                        <p className="text-xs text-[var(--text-secondary)] mb-2">{t('common.deleteConfirm.codeHint')}</p>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg py-2.5 mb-3">
                            <p className="text-2xl font-mono font-bold text-center tracking-[0.4em] text-red-400 select-none">{code}</p>
                        </div>
                    </>
                )}

                <input
                    type="text"
                    placeholder={mode === 'code' ? t('common.deleteConfirm.codePlaceholder') : t('common.deleteConfirm.placeholder')}
                    value={input}
                    onChange={e => setInput(mode === 'code' ? e.target.value.toUpperCase() : e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    maxLength={mode === 'code' ? 3 : undefined}
                    disabled={deleting}
                    autoFocus
                    className={`w-full px-3 py-2.5 mb-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-red-400 transition-colors disabled:opacity-50 ${
                        mode === 'code' ? 'text-center font-mono text-lg tracking-[0.4em] uppercase' : ''
                    }`}
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600"
                    >
                        {deleting ? t('common.deleteConfirm.deleting') : t('common.deleteConfirm.confirmBtn')}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--border-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {t('common.deleteConfirm.cancelBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;

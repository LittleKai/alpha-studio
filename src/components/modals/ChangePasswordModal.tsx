import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';

interface ChangePasswordModalProps {
  onClose: () => void;
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getToken = () => localStorage.getItem('alpha_studio_token');

  const handleSubmit = useCallback(async () => {
    setError('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError(t('profile.password.fillAll'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError(t('profile.password.passwordMinLength'));
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('profile.password.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const result = await response.json();

      if (result.success) {
        setSuccess(t('profile.password.success'));
        setTimeout(() => onClose(), 2000);
      } else {
        setError(result.message || t('profile.password.error'));
      }
    } catch {
      setError(t('profile.password.error'));
    } finally {
      setLoading(false);
    }
  }, [passwordData, API_URL, t, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-[#1a1a2e] rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('profile.password.title')}</h2>
              <p className="text-xs text-gray-400">{t('profile.password.description')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('profile.password.current')}</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('profile.password.new')}</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('profile.password.confirm')}</label>
            <input
              type={showNewPw ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Error / Success messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 flex-shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('profile.password.changing')}
              </>
            ) : (
              t('profile.password.submit')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

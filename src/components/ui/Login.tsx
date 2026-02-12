import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';

interface LoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

const REMEMBER_EMAIL_KEY = 'alpha_studio_remember_email';

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onClose }) => {
  const { t } = useTranslation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError(t('login.error.emailRequired') || 'Please enter your email');
      return;
    }

    if (!password.trim()) {
      setError(t('login.error.passwordRequired') || 'Please enter your password');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError(t('login.error.nameRequired') || 'Please enter your name');
      return;
    }

    if (password.length < 6) {
      setError(t('login.error.passwordLength') || 'Password must be at least 6 characters');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError(t('login.error.passwordMismatch') || 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      let result;

      if (mode === 'login') {
        result = await login({ email, password });
      } else {
        result = await register({ email, password, name });
      }

      if (result.success) {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
        onLoginSuccess();
      } else {
        setError(result.message);
      }
    } catch {
      setError(t('login.error.network') || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setConfirmPassword('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-2xl shadow-2xl border border-[var(--border-primary)] p-8 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="text-center mb-8">
            <img src="/alpha-logo.png" alt="Alpha Studio" className="w-16 h-16 mx-auto mb-4 rounded-2xl object-contain shadow-lg" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">ALPHA CONNECT</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {mode === 'login'
                ? (t('login.subtitle') || 'Sign in to continue')
                : (t('login.registerSubtitle') || 'Create your account')
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('login.name') || 'Full Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('login.namePlaceholder') || 'Enter your name'}
                  className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('login.email') || 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder') || 'Enter your email'}
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                autoFocus={mode === 'login'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('login.password') || 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder') || 'Enter your password'}
                  className="w-full px-4 py-3 pr-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('login.confirmPassword') || 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('login.confirmPasswordPlaceholder') || 'Re-enter your password'}
                    className="w-full px-4 py-3 pr-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-[var(--text-secondary)] cursor-pointer select-none"
                >
                  {t('login.rememberMe') || 'Remember me'}
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-[var(--accent-primary)] to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {mode === 'login'
                    ? (t('login.signingIn') || 'Signing in...')
                    : (t('login.registering') || 'Creating account...')
                  }
                </>
              ) : (
                mode === 'login'
                  ? (t('login.signIn') || 'Sign In')
                  : (t('login.register') || 'Create Account')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-[var(--accent-primary)] hover:underline font-medium"
            >
              {mode === 'login'
                ? (t('login.noAccount') || "Don't have an account? Register")
                : (t('login.hasAccount') || 'Already have an account? Sign in')
              }
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
            <p className="text-center text-xs text-[var(--text-tertiary)]">
              {t('login.demoCredentials') || 'Demo credentials:'}
            </p>
            <div className="mt-2 text-center text-xs text-[var(--text-tertiary)] space-y-1">
              <p>Admin: admin@alphastudio.com / admin123456</p>
              <p>Student: student@example.com / student123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

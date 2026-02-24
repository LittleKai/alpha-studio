import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import WalletView from '../components/dashboard/views/WalletView';

export default function WalletPage() {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-primary)]">
            {/* Page Header */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-4 md:px-6 py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">
                                {t('workflow.wallet.title')}
                            </h1>
                            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                {user?.name || 'User'} &bull; <span className="text-yellow-400 font-bold">{(user?.balance || 0).toLocaleString()} Credits</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Content */}
            <div className="container mx-auto px-0 md:px-2">
                <WalletView />
            </div>
        </div>
    );
}

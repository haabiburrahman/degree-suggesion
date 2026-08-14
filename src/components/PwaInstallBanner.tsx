import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-[#1B2A4A] text-white border-b-2 border-[#F2A93B] px-4 py-3 shadow-md animate-fade-in">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F2A93B]/20 text-[#F2A93B] rounded-lg border border-[#F2A93B]/40">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-base text-[#F2A93B]">
              ডিগ্রি সাজেশন অ্যাপ ইনস্টল করুন!
            </h4>
            <p className="text-xs text-amber-100/80">
              ফোনের হোম স্ক্রিনে যুক্ত করুন এবং দ্রুত ইন্টারনেটে সেরা পরীক্ষা সাজেশন ব্যবহার করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-bold px-4 py-2 rounded-lg text-xs transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            ইনস্টল করুন
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

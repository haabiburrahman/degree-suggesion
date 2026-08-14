import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActiveView } from '../types';

interface AuthPageProps {
  setActiveView: (view: ActiveView) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ setActiveView }) => {
  const { user, profile, isAdmin, login, signup, logout, makeAdmin } = useAuth();
  
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দুটিই পূরণ করুন।');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        await login(email, password);
        setSuccessMessage('সফলভাবে লগইন করা হয়েছে!');
        setTimeout(() => setActiveView('home'), 1000);
      } else {
        await signup(email, password);
        setSuccessMessage('একাউন্ট সফলভাবে তৈরি হয়েছে! সাধারণ ইউজার (user) হিসেবে লগইন হয়েছে।');
        setTimeout(() => setActiveView('home'), 1200);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'একটি সমস্যা হয়েছে, আবার চেষ্টা করুন।';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'এই ইমেইলটি দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা রয়েছে। লগইন করার চেষ্টা করুন।';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'সঠিক ইমেইল এড্রেস প্রবেশ করান।';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      
      {/* If Already Logged In */}
      {user ? (
        <div className="notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-6 text-center">
          <div className="w-16 h-16 bg-[#1B2A4A] text-[#F2A93B] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8 text-[#F2A93B]" />
          </div>

          <div>
            <h3 className="font-heading text-xl font-bold text-[#1B2A4A]">
              আপনি বর্তমানে সাইন-ইন অবস্থায় আছেন
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-body">
              ইমেইল: <strong className="text-[#1B2A4A]">{user.email}</strong>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              ইউজার রোল: <span className="font-bold text-[#F2A93B] bg-[#1B2A4A] px-2.5 py-0.5 rounded-full uppercase text-[10px]">{profile?.role || 'user'}</span>
            </p>
          </div>

          {/* Quick Demo Switch to Admin */}
          {!isAdmin && (
            <div className="p-4 bg-[#FAF6EC] border border-[#F2A93B] rounded-xl text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1B2A4A]">
                <KeyRound className="w-4 h-4 text-[#F2A93B]" />
                পরীক্ষা / ডেমো অ্যাডমিন সুবিধা:
              </div>
              <p className="text-[11px] text-slate-600 font-body">
                ফায়ারবেস নিয়ম অনুযায়ী সাধারণ সাইনআপে ডিফল্ট রোল "user" দেওয়া হয়। অ্যাপ টেস্ট করার সুবিধার জন্য নিচের বাটনে ক্লিক করে নিজেকে Admin করতে পারেন:
              </p>
              <button
                onClick={makeAdmin}
                className="w-full bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold py-2 rounded-lg text-xs transition"
              >
                আমাকে অ্যাডমিন রোল (admin) দিন
              </button>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setActiveView('home')}
              className="w-full py-2.5 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-bold rounded-xl text-sm shadow-sm transition"
            >
              হোম পেজে যান
            </button>
            <button
              onClick={logout}
              className="w-full py-2 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition"
            >
              লগআউট করুন
            </button>
          </div>
        </div>
      ) : (
        /* Login / Signup Form */
        <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] shadow-lg space-y-6">
          
          {/* Header & Tabs */}
          <div className="space-y-4 text-center">
            <h2 className="font-heading text-2xl font-extrabold text-[#1B2A4A]">
              {isLoginTab ? 'লগইন করুন' : 'নতুন একাউন্ট খুলুন'}
            </h2>
            <p className="text-xs text-slate-600 font-body">
              সাজেশনের ছবি ও PDF ডাউনলোডের জন্য আপনার একাউন্টে প্রবেশ করুন
            </p>

            {/* Quick Admin Credentials Badge */}
            <div className="p-3 bg-[#FAF6EC] border border-[#F2A93B] rounded-xl text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1B2A4A] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F2A93B]" />
                  এডমিন লগইন তথ্য (Admin Credentials):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('haabiburcu@gmail.com');
                    setPassword('hr408612');
                    setIsLoginTab(true);
                  }}
                  className="text-[10px] bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] px-2 py-0.5 rounded font-bold transition"
                >
                  এক ক্লিকে বসান
                </button>
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                ইমেইল: <strong className="text-[#1B2A4A]">haabiburcu@gmail.com</strong>
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                পাসওয়ার্ড: <strong className="text-[#1B2A4A]">hr408612</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 p-1 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl text-xs font-bold">
              <button
                onClick={() => {
                  setIsLoginTab(true);
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition ${
                  isLoginTab ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-xs' : 'text-slate-600 hover:text-[#1B2A4A]'
                }`}
              >
                লগইন (Login)
              </button>
              <button
                onClick={() => {
                  setIsLoginTab(false);
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition ${
                  !isLoginTab ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-xs' : 'text-slate-600 hover:text-[#1B2A4A]'
                }`}
              >
                সাইনআপ (Sign Up)
              </button>
            </div>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1B2A4A] font-heading">
                ইমেইল এড্রেস (Email):
              </label>
              <input
                type="email"
                required
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-sm outline-none font-body text-[#1B2A4A]"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1B2A4A] font-heading">
                পাসওয়ার্ড (Password):
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-sm outline-none font-body text-[#1B2A4A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">প্রসেসিং হচ্ছে...</span>
              ) : isLoginTab ? (
                <>
                  <LogIn className="w-4 h-4" />
                  লগইন করুন
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  একাউন্ট তৈরি করুন
                </>
              )}
            </button>
          </form>

          {/* Information Notice */}
          <div className="p-3 bg-[#FAF6EC] border border-[#EADFC8] rounded-xl text-[11px] text-slate-600 space-y-1 font-body">
            <p className="font-bold text-[#1B2A4A]">🔑 ইউজার রুল নোট:</p>
            <p>
              সাইনআপ করলে ডিফল্টভাবে "user" রোল দেওয়া হয়। এডমিন সুবিধা পেতে আপনার ইউজার আইডিতে Firestore থেকে role: "admin" নির্ধারণ করা হয়।
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

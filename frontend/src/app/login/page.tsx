'use client';
import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowLeft, Plane, Loader2, User, ChevronDown } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useLangStore } from '@/store/lang';

type Step = 'phone' | 'otp' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCourier = searchParams.get('courier') === '1';

  const { setUser, setToken } = useAuthStore();
  const { t } = useLangStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+994');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [role, setRole] = useState<'SENDER' | 'COURIER'>(isCourier ? 'COURIER' : 'SENDER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    if (phone.length < 13) return setError('Düzgün telefon nömrəsi daxil edin');
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(phone);
      if (res.data.devCode) setDevCode(res.data.devCode);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[i] = val;
    setCode(newCode);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (newCode.every(c => c)) handleVerifyOtp(newCode.join(''));
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (fullCode?: string) => {
    const otp = fullCode || code.join('');
    if (otp.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ phone, code: otp });
      if (res.data.requiresRegistration) {
        setStep('register');
        setLoading(false);
        return;
      }
      setToken(res.data.token);
      setUser(res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kod yanlışdır');
      setCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !surname) return setError('Ad və soyad daxil edin');
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ phone, code: code.join(''), name, surname, role });
      setToken(res.data.token);
      setUser(res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Qeydiyyat xətası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Plane className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-gray-900">Take<span className="text-orange-500">Send</span></span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-7 border border-gray-100">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1: Phone */}
            {step === 'phone' && (
              <motion.div key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Xoş gəldiniz</h1>
                <p className="text-gray-500 text-sm mb-6">Telefon nömrənizi daxil edin</p>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('+994') && val.length <= 13) setPhone(val);
                      }}
                      className="input-field pl-10"
                      placeholder="+994 50 123 45 67"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('sendCode')}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Daxil olmaqla <span className="text-orange-500">Şərtləri</span> qəbul etmiş olursunuz
                </p>
              </motion.div>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <motion.div key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button onClick={() => setStep('phone')} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 mb-5 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>

                <h1 className="text-2xl font-bold text-gray-900 mb-1">Kodu daxil edin</h1>
                <p className="text-gray-500 text-sm mb-1">{phone} nömrəsinə SMS göndərildi</p>
                {devCode && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-sm text-amber-700">
                    🧪 Dev kod: <strong>{devCode}</strong>
                  </div>
                )}

                <div className="flex gap-2 justify-between my-6">
                  {code.map((c, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={c}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  ))}
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || code.join('').length < 6}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('verifyCode')}
                </button>

                <button
                  onClick={handleSendOtp}
                  className="w-full text-sm text-orange-500 hover:text-orange-600 mt-3 py-2"
                >
                  Yenidən göndər
                </button>
              </motion.div>
            )}

            {/* Step 3: Register */}
            {step === 'register' && (
              <motion.div key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Qeydiyyat</h1>
                <p className="text-gray-500 text-sm mb-6">Bir dəfəlik — sonra birbaşa daxil olacaqsınız</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      className="input-field" placeholder="Əli" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Soyad</label>
                    <input value={surname} onChange={(e) => setSurname(e.target.value)}
                      className="input-field" placeholder="Hüseynov" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['SENDER', 'COURIER'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                            role === r
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {r === 'SENDER' ? '📦 Göndərən' : '🚗 Kuryer'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Qeydiyyatı Tamamla
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

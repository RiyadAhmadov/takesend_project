'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Package, CreditCard, ChevronRight, ChevronLeft, Loader2, Camera, AlertTriangle } from 'lucide-react';
import { ordersAPI, uploadsAPI } from '@/lib/api';
import { useLangStore } from '@/store/lang';

const COUNTRIES = [
  { code: 'TR', name: 'Türkiyə', flag: '🇹🇷' },
  { code: 'RU', name: 'Rusiya', flag: '🇷🇺' },
  { code: 'DE', name: 'Almaniya', flag: '🇩🇪' },
  { code: 'AE', name: 'BƏƏ', flag: '🇦🇪' },
  { code: 'US', name: 'ABŞ', flag: '🇺🇸' },
  { code: 'GB', name: 'Britaniya', flag: '🇬🇧' },
  { code: 'UA', name: 'Ukrayna', flag: '🇺🇦' },
  { code: 'GE', name: 'Gürcüstan', flag: '🇬🇪' },
];

type Step = 1 | 2 | 3;

interface FormData {
  pickupAddress: string; pickupLat: number; pickupLng: number;
  dropoffAddress: string; dropoffLat: number; dropoffLng: number;
  destinationCountry: string;
  packageType: string; packageSize: string; weightKg: string;
  isUrgent: boolean; senderNote: string; photoUrl: string;
  paymentMethod: 'CASH' | 'CARD';
}

const STEPS = ['Ünvanlar', 'Paket', 'Ödəniş'];

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useLangStore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimate, setEstimate] = useState<{ price: number; distanceKm: number } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState<FormData>({
    pickupAddress: '', pickupLat: 40.4093, pickupLng: 49.8671,
    dropoffAddress: '', dropoffLat: 0, dropoffLng: 0,
    destinationCountry: '',
    packageType: '', packageSize: '', weightKg: '',
    isUrgent: false, senderNote: '', photoUrl: '',
    paymentMethod: 'CASH'
  });

  const update = (key: keyof FormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadsAPI.uploadImage(file);
      update('photoUrl', res.data.url);
    } catch {
      setError('Foto yüklənmədi');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getEstimate = async () => {
    if (!form.destinationCountry) return;
    try {
      const res = await ordersAPI.estimatePrice({
        pickupLat: form.pickupLat, pickupLng: form.pickupLng,
        dropoffLat: form.dropoffLat || 41.0, dropoffLng: form.dropoffLng || 29.0,
        countryCode: form.destinationCountry,
        isUrgent: form.isUrgent,
        packageSize: form.packageSize || 'S'
      });
      setEstimate(res.data);
    } catch {}
  };

  const canNext = () => {
    if (step === 1) return form.pickupAddress && form.dropoffAddress && form.destinationCountry;
    if (step === 2) return form.packageType && form.packageSize && form.weightKg;
    return true;
  };

  const handleNext = async () => {
    if (step === 2) await getEstimate();
    if (step < 3) setStep((s) => (s + 1) as Step);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ordersAPI.create({
        ...form,
        weightKg: parseFloat(form.weightKg),
        dropoffLat: form.dropoffLat || 41.0,
        dropoffLng: form.dropoffLng || 29.0,
      });
      router.push(`/dashboard/orders/${res.data.order.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sifariş yaradıla bilmədi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Sifariş</h1>
        <p className="text-gray-500 text-sm mt-1">Bütün sahələri doldurun</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => {
          const s = (i + 1) as Step;
          const active = step === s;
          const done = step > s;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-emerald-500 text-white' :
                active ? 'bg-orange-500 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : s}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-orange-600' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-300' : 'bg-gray-100'}`} />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <AnimatePresence mode="wait">
          
          {/* Step 1: Addresses */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full inline-flex items-center justify-center text-xs mr-1.5">A</span>
                  Götürülmə ünvanı
                </label>
                <input
                  value={form.pickupAddress}
                  onChange={(e) => update('pickupAddress', e.target.value)}
                  className="input-field"
                  placeholder="Məs: Neftçilər pr. 88, Bakı"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🌍 Çatdırılma ölkəsi</label>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { update('destinationCountry', c.code); update('dropoffAddress', c.name); }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.destinationCountry === c.code
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-100 hover:border-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{c.flag}</span> {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full inline-flex items-center justify-center text-xs mr-1.5">B</span>
                  Çatdırılma ünvanı
                </label>
                <input
                  value={form.dropoffAddress}
                  onChange={(e) => update('dropoffAddress', e.target.value)}
                  className="input-field"
                  placeholder="Xaricdəki ünvan"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Package info */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Paket növü</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'DOCUMENT', label: 'Sənəd', icon: '📄' },
                    { key: 'BOX', label: 'Qutu', icon: '📦' },
                    { key: 'FOOD', label: 'Yemək', icon: '🍱' },
                    { key: 'OTHER', label: 'Digər', icon: '📫' }
                  ].map(p => (
                    <button key={p.key} onClick={() => update('packageType', p.key)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.packageType === p.key ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ölçü</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'S', label: 'S', sub: '≤1 kq' },
                    { key: 'M', label: 'M', sub: '1-5 kq' },
                    { key: 'L', label: 'L', sub: '5-20 kq' }
                  ].map(s => (
                    <button key={s.key} onClick={() => update('packageSize', s.key)}
                      className={`py-3 rounded-xl border-2 text-center transition-all ${
                        form.packageSize === s.key ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`font-bold text-lg ${form.packageSize === s.key ? 'text-orange-600' : 'text-gray-700'}`}>{s.label}</div>
                      <div className="text-xs text-gray-400">{s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Çəki (kq)</label>
                <input
                  type="number"
                  min="0.1" max="50" step="0.1"
                  value={form.weightKg}
                  onChange={(e) => update('weightKg', e.target.value)}
                  className="input-field"
                  placeholder="0.5"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => update('isUrgent', !form.isUrgent)}
                  className={`w-12 h-6 rounded-full transition-all ${form.isUrgent ? 'bg-orange-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isUrgent ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">⚡ Təcili (+30%)</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Foto (ixtiyari)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                  {form.photoUrl ? (
                    <img src={form.photoUrl} className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <label className="cursor-pointer">
                      <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <span className="text-sm text-gray-400">Foto əlavə et</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                  {uploadingPhoto && <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto mt-2" />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qeyd (ixtiyari)</label>
                <textarea
                  value={form.senderNote}
                  onChange={(e) => update('senderNote', e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Xüsusi təlimatlar..."
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {estimate && (
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <div className="text-sm text-orange-600 font-medium mb-1">Qiymət Hesablaması</div>
                  <div className="text-3xl font-extrabold text-orange-500 mb-1">{estimate.price} ₼</div>
                  <div className="text-xs text-gray-400">{estimate.distanceKm} km məsafə</div>
                </div>
              )}

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ölkə</span>
                  <span className="font-medium">{COUNTRIES.find(c => c.code === form.destinationCountry)?.flag} {COUNTRIES.find(c => c.code === form.destinationCountry)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paket növü</span>
                  <span className="font-medium capitalize">{form.packageType?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ölçü / Çəki</span>
                  <span className="font-medium">{form.packageSize} / {form.weightKg} kq</span>
                </div>
                {form.isUrgent && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Təcili</span>
                    <span className="font-medium text-orange-600">⚡ +30%</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ödəniş üsulu</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'CASH', label: 'Nağd', icon: '💵' },
                    { key: 'CARD', label: 'Kart', icon: '💳' }
                  ].map(p => (
                    <button key={p.key} onClick={() => update('paymentMethod', p.key)}
                      className={`py-4 rounded-xl border-2 text-center transition-all ${
                        form.paymentMethod === p.key ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">{p.icon}</div>
                      <div className={`text-sm font-semibold ${form.paymentMethod === p.key ? 'text-orange-700' : 'text-gray-700'}`}>{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as Step)} className="btn-secondary flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Geri
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button onClick={handleNext} disabled={!canNext()} className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
              Növbəti <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sifariş Yarat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Package, Plane, Shield, Clock, Star, ChevronRight, 
  Globe, Users, TrendingUp, CheckCircle, Menu, X, ArrowRight
} from 'lucide-react';
import { useLangStore } from '@/store/lang';
import { useAuthStore } from '@/store/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const countries = [
  { flag: '🇹🇷', name: 'Türkiyə', code: 'TR', count: '340+' },
  { flag: '🇷🇺', name: 'Rusiya', code: 'RU', count: '210+' },
  { flag: '🇩🇪', name: 'Almaniya', code: 'DE', count: '89+' },
  { flag: '🇦🇪', name: 'BƏƏ', code: 'AE', count: '145+' },
  { flag: '🇺🇸', name: 'ABŞ', code: 'US', count: '67+' },
  { flag: '🇬🇧', name: 'Britaniya', code: 'GB', count: '54+' },
  { flag: '🇺🇦', name: 'Ukrayna', code: 'UA', count: '123+' },
  { flag: '🇬🇪', name: 'Gürcüstan', code: 'GE', count: '290+' },
];

const steps = [
  { icon: Package, title: 'Sifariş yarat', desc: 'Paket məlumatını, ünvanı və çatdırılma ölkəsini daxil et' },
  { icon: Users, title: 'Kuryer tap', desc: 'Həmin ölkəyə gedən kuryerlər sifarişini görür və qəbul edir' },
  { icon: Plane, title: 'İzlə', desc: 'Paketinin harda olduğunu real zamanda izlə' },
  { icon: CheckCircle, title: 'Çatdırıldı!', desc: 'Paket çatdırılanda bildiriş al, rəy yaz' },
];

export default function HomePage() {
  const { t, lang, setLang } = useLangStore();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-gray-900">Take<span className="text-orange-500">Send</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#how" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Necə işləyir?</a>
            <a href="#countries" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Ölkələr</a>
            <LanguageSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  {t('login')}
                </Link>
                <Link href="/login?courier=1" className="btn-primary text-sm py-2 px-4">
                  Kuryer ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu btn */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-3">
            <a href="#how" className="block text-gray-700 py-2">Necə işləyir?</a>
            <a href="#countries" className="block text-gray-700 py-2">Ölkələr</a>
            <div className="pt-2 space-y-2">
              <Link href="/login" className="block text-center py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700">
                Daxil ol
              </Link>
              <Link href="/login?courier=1" className="block text-center py-2.5 bg-orange-500 text-white rounded-xl font-semibold">
                Kuryer ol
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-orange-50 via-white to-amber-50 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Globe className="w-3.5 h-3.5" />
                8+ ölkəyə çatdırılma
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
                Xaricə Göndər,<br />
                <span className="text-orange-500">Asanlıqla</span> Çatdır
              </h1>
              
              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-md">
                Türkiyə, Rusiya, Almaniya, BƏƏ — hara olursa olsun, xaricdəki 
                doğmalarınıza paket, sənəd, əşya göndərin.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login" className="btn-primary text-center flex items-center justify-center gap-2">
                  Göndəriş Yarat
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login?courier=1" className="btn-secondary text-center">
                  Kuryer kimi qeydiyyat
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-orange-100">
                <div>
                  <div className="text-2xl font-bold text-gray-900">2,400+</div>
                  <div className="text-xs text-gray-500">Uğurlu çatdırılma</div>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">4.9 ⭐</div>
                  <div className="text-xs text-gray-500">Ortalama reytinq</div>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">8</div>
                  <div className="text-xs text-gray-500">Ölkə</div>
                </div>
              </div>
            </motion.div>

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 border border-orange-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-500">Aktiv Sifariş</span>
                    <span className="status-badge bg-emerald-50 text-emerald-700">🟢 Yoldadır</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Götürülmə</div>
                        <div className="text-sm font-semibold">Neftçilər pr., Bakı</div>
                      </div>
                    </div>
                    <div className="ml-4 w-px h-4 bg-dashed border-l-2 border-dashed border-gray-200"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Plane className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Çatdırılma</div>
                        <div className="text-sm font-semibold">İstanbul, Türkiyə 🇹🇷</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-400">Kuryer</div>
                      <div className="text-sm font-semibold">Nicat M. ⭐ 4.9</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Qiymət</div>
                      <div className="text-lg font-bold text-orange-500">15 ₼</div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-3 border border-orange-100"
                >
                  <div className="text-2xl">✅</div>
                  <div className="text-xs font-bold text-gray-700">Çatdırıldı!</div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-3 border border-gray-100"
                >
                  <div className="text-lg">🇹🇷 🇷🇺 🇩🇪</div>
                  <div className="text-xs text-gray-500 mt-0.5">8+ ölkə</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Countries */}
      <section id="countries" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Çatdırılma Ölkələri</h2>
            <p className="text-gray-500">Aktiv kuryerlərimizin hazırda xidmət etdiyi ölkələr</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {countries.map((c, i) => (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-2xl p-4 text-center cursor-pointer transition-all group"
              >
                <div className="text-3xl mb-2">{c.flag}</div>
                <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                <div className="text-xs text-orange-500 font-medium mt-1">{c.count} kuryer</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Necə İşləyir?</h2>
            <p className="text-gray-500">4 addımda xaricə çatdırma</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative inline-flex">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                    <step.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Təhlükəsiz', desc: 'Bütün kuryerlər şəxsiyyət yoxlamasından keçir. Ödəniş qorunur.', color: 'text-emerald-600 bg-emerald-50' },
              { icon: Clock, title: 'Sürətli', desc: 'Sifarişiniz dərhal görünür. Kuryer tapılması orta hesabla 30 dəqiqə.', color: 'text-blue-600 bg-blue-50' },
              { icon: Star, title: 'Güvənli', desc: 'Hər çatdırılmadan sonra reytinq sistemi. Ən yaxşı kuryerləri seçin.', color: 'text-amber-600 bg-amber-50' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-orange-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Bugün Başla
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Qeydiyyat pulsuzdur. İlk sifarişini yarat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 transition-colors">
              Göndəriş Yarat
            </Link>
            <Link href="/login?courier=1" className="bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-orange-700 transition-colors border border-orange-400">
              Kuryer Ol — Qazanc Əldə Et
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-xl">TakeSend</span>
              </div>
              <p className="text-sm max-w-xs text-gray-500">
                Beynəlxalq çatdırılma platforması. Bakı, Azərbaycan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <div className="text-white font-semibold mb-3">Platforma</div>
                <div className="space-y-2">
                  <Link href="/login" className="block hover:text-white transition-colors">Göndərən</Link>
                  <Link href="/login?courier=1" className="block hover:text-white transition-colors">Kuryer</Link>
                </div>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Dil</div>
                <div className="space-y-2">
                  {(['az', 'en', 'ru', 'tr'] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)} className={`block uppercase hover:text-white transition-colors ${lang === l ? 'text-orange-400 font-semibold' : ''}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-800 text-xs text-center text-gray-600">
            © {new Date().getFullYear()} TakeSend. Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>
    </div>
  );
}

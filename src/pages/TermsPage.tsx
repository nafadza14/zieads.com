import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

export default function TermsPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'id'>('en');

  // Maintain scroll position when changing language
  const handleLangSwitch = (newLang: 'en' | 'id') => {
    const scrollPos = window.scrollY;
    setLang(newLang);
    setTimeout(() => {
      window.scrollTo(0, scrollPos);
    }, 10);
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] antialiased selection:bg-zinc-200" style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 h-16 no-print">
        <div className="max-w-[800px] mx-auto h-full px-6 flex items-center justify-between">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2 font-bold text-lg text-black decoration-none">
            <ZieAdsLogo size={24} />
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>zieads</span>
          </a>
          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
            <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }} className="hover:text-black transition-colors decoration-none">Privacy Policy</a>
            <span className="text-zinc-300">|</span>
            <button 
              onClick={() => handleLangSwitch(lang === 'en' ? 'id' : 'en')} 
              className="hover:text-black transition-colors"
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 'inherit', fontWeight: 'inherit', padding: 0 }}
            >
              {lang === 'en' ? 'Bahasa Indonesia' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-[800px] mx-auto px-6 pt-32 pb-24">
        
        {/* Title Zone */}
        <div className="mb-16">
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-4xl sm:text-[44px] font-extrabold text-black tracking-tight leading-tight mb-4">
            {lang === 'en' ? 'Terms of Service' : 'Ketentuan Layanan'}
          </h1>
          <div className="text-sm text-zinc-500 space-y-1 font-mono">
            <div>Effective Date: June 30, 2026</div>
            <div>Last Updated: June 30, 2026 &bull; Version 2.0.0</div>
            <div className="italic text-zinc-400 mt-2">
              {lang === 'en' 
                ? 'This agreement was published on June 30, 2026 with an effective date of June 30, 2026.'
                : 'Persetujuan ini diterbitkan pada 30 Juni 2026 dengan tanggal efektif mulai 30 Juni 2026.'}
            </div>
          </div>
        </div>

        {/* Dynamic Prose Column */}
        <div className="text-[16px] leading-[1.75] text-[#1A1A1A] space-y-12">
          
          {lang === 'en' ? (
            <>
              {/* SECTION 1 */}
              <section id="agreement" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  1. Agreement to Terms
                </h2>
                <p>
                  These Terms of Service constitute a legally binding contract between you (whether personally or on behalf of an entity you represent) and <strong>PT. Bantu Indonesia Technology</strong>, an Indonesian limited liability company registered in the Special Region of Yogyakarta, Indonesia, operating the ZieAds platform at <strong>zieads.com</strong> ("we", "us", "our").
                </p>
                <p>
                  By creating an account, registering, accessing the website, or subscribing to our services, you confirm that you have read, understood, and agreed to be bound by all of these Terms of Service. If you do not agree with all of these Terms, you are prohibited from using the service and must stop accessing our web domain immediately.
                </p>
              </section>

              {/* SECTION 2 */}
              <section id="description" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  2. Description of Service
                </h2>
                <p>
                  ZieAds is a marketing software-as-a-service (SaaS) platform that provides creators, small businesses, and agencies with social media scheduling and analytics tools. The platform includes our legacy <strong>v0.2 tools</strong> (URL-based advertising readiness audits scored across 6 dimensions, 10 deep diagnosis analysis workflows, 15 terminal slash commands, white-label report exports, and credit-based model runs) and our new <strong>v0.3 tools</strong> (organic social scheduling, visual calendar dashboard feeds, automated publishing pipelines for Instagram/TikTok/LinkedIn, a unified comment inbox, and a daily AI Marketing Analyst layer that generates anomaly reports and timing optimizations).
                </p>
                <p>
                  We utilize artificial intelligence models powered by Anthropic's Claude API to process data and construct these recommendations. You acknowledge that AI output represents suggestions and that you remain responsible for auditing and verifying content before it is published to your connected channels.
                </p>
              </section>

              {/* SECTION 3 */}
              <section id="eligibility" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  3. Eligibility & Account Registration
                </h2>
                <p>
                  To register an account on ZieAds, you must be at least 18 years of age (or the legal age of majority in your jurisdiction). By registering, you warrant that you possess the legal authority to enter into a binding contract and that all details you supply are accurate, current, and complete.
                </p>
                <p>
                  You are responsible for keeping your login credentials confidential and secure. You agree to notify us immediately at <strong>legal@zieads.com</strong> if you detect any unauthorized access to your account workspace. We are not liable for any losses caused by unauthorized use of your credentials.
                </p>
              </section>

              {/* SECTION 4 */}
              <section id="billing" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  4. Subscription Plans & Billing
                </h2>
                <p>
                  We offer subscription plans (Solo: $29/mo, Pro: $89/mo, Studio: $229/mo) and credit packs processed securely through Stripe. Paid plans renew automatically on a recurring monthly or annual basis until cancelled. You can cancel your subscription at any time via your account billing panel, and cancellation will take effect at the end of the current billing cycle.
                </p>
                <p>
                  We provide a 14-day refund window for first-time paid plan purchases. If recurring payments fail after three automatic retries, we reserve the right to downgrade your account to the Free tier and suspend advanced features. All prices listed exclude applicable sales tax or VAT (PPN) in Indonesia, which is your responsibility.
                </p>
              </section>

              {/* SECTION 5 */}
              <section id="acceptable-use" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  5. Acceptable Use Policy
                </h2>
                <p>
                  You agree to use ZieAds strictly for lawful business purposes. You are prohibited from using the platform to publish defamatory, hateful, or illegal content; distribute spam or unsolicited advertising campaigns; violate third-party copyright or intellectual property rights; or bypass, scrape, or extract database schemas or reverse-engineer algorithms.
                </p>
                <p>
                  We reserve the right to audit scheduled posts and inputs. Violations of this Acceptable Use Policy will result in immediate suspension or termination of your profile workspace without any refund of unused credits or fees.
                </p>
              </section>

              {/* SECTION 6 */}
              <section id="intellectual-property" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  6. User Content & Intellectual Property
                </h2>
                <p>
                  You retain sole ownership of all captions, media attachments, and file logs that you upload, construct, or schedule through ZieAds. You grant us a limited, worldwide, royalty-free license to store, process, and publish this content exclusively to deliver the services you requested.
                </p>
                <p>
                  All proprietary code, layouts, AI prompt configurations, database structures, trademarks, logos, and audit scoring algorithms on zieads.com are the exclusive property of PT. Bantu Indonesia Technology and are protected by international copyright laws.
                </p>
              </section>

              {/* SECTION 7 */}
              <section id="compliance" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  7. Third-Party Platform Compliance
                </h2>
                <p>
                  ZieAds connects to external platforms (Instagram, TikTok, LinkedIn) via official developer APIs. You must comply with their respective terms of service (Meta Terms, TikTok Developer Terms, LinkedIn API Terms). We are not responsible or liable for any account restrictions, suspensions, or modifications applied to your social channels by these platforms.
                </p>
              </section>

              {/* SECTION 8 */}
              <section id="ai-disclaimer" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  8. AI-Generated Content Disclaimer
                </h2>
                <p>
                  Suggestions, briefings, and ad diagnoses are generated by artificial intelligence. ZIEADS DOES NOT GUARANTEE THE ACCURACY, EFFECTIVENESS, OR LEGAL COMPLIANCE OF THESE INSIGHTS. All recommendations are provided "as-is" and do not constitute professional advertising, financial, or legal advice.
                </p>
              </section>

              {/* SECTION 9 */}
              <section id="availability" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  9. Service Availability & Modifications
                </h2>
                <p>
                  We aim for a 99.5% service uptime but do not warrant that our platform will run uninterrupted or error-free. We may update features, modify layouts, or deprecate analytical options with reasonable notice. We are not liable for outages caused by third-party API changes.
                </p>
              </section>

              {/* SECTION 10 */}
              <section id="warranties" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  10. Disclaimers & Warranties
                </h2>
                <p>
                  THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. PT. BANTU INDONESIA TECHNOLOGY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING FIT FOR A PARTICULAR MARKETING GOAL OR NON-INFRINGEMENT.
                </p>
              </section>

              {/* SECTION 11 */}
              <section id="liability" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  11. Limitation of Liability
                </h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PT. BANTU INDONESIA TECHNOLOGY AND ITS DIRECTORS WILL NOT BE LIABLE FOR INDIRECT, CONSEQUENTIAL, OR SPECIAL DAMAGES, OR FOR LOSS OF PROFITS, DATA LEAKS, OR ADVERTISING BUDGET SPENT ON CAMPAIGNS. OUR TOTAL LIABILITY IS CAPPED AT THE FEES PAID BY YOU TO ZIEADS IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </section>

              {/* SECTION 12 */}
              <section id="indemnity" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  12. Indemnification
                </h2>
                <p>
                  You agree to indemnify and hold harmless PT. Bantu Indonesia Technology, its officers, and employees from any third-party claims, legal fees, or damages arising out of your violation of these Terms of Service or your connected channel terms.
                </p>
              </section>

              {/* SECTION 13 */}
              <section id="termination" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  13. Termination
                </h2>
                <p>
                  You can terminate your account workspace at any time by requesting deletion in your settings. We reserve the right to suspend or block your access immediately if you violate any provision of these Terms or engage in activities that threaten platform security.
                </p>
              </section>

              {/* SECTION 14 */}
              <section id="dispute-resolution" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  14. Dispute Resolution & Governing Law
                </h2>
                <p>
                  These Terms of Service are governed by and construed in accordance with the laws of the <strong>Republic of Indonesia</strong>. Any dispute arising out of or in connection with these Terms that cannot be resolved through amicable negotiation within 30 days shall be resolved exclusively through the jurisdiction of the courts of <strong>Pengadilan Negeri Yogyakarta</strong> (Yogyakarta District Court).
                </p>
              </section>

              {/* SECTION 15 */}
              <section id="changes-to-terms" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  15. Changes to These Terms
                </h2>
                <p>
                  We may adjust these Terms of Service at any time. Material changes will be communicated via email or in-app notice 14 days before taking effect. Continued use of ZieAds after the effective date constitutes your acceptance of the revised terms.
                </p>
              </section>

              {/* SECTION 16 */}
              <section id="contact-terms" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  16. Contact Information
                </h2>
                <p>
                  If you have questions or legal notices regarding these Terms, contact us at:
                </p>
                <div className="font-mono text-sm leading-relaxed text-zinc-655 bg-zinc-50 border border-zinc-200 p-6 rounded-lg">
                  <div>PT. Bantu Indonesia Technology</div>
                  <div>Registered Office: Omah Dongeng, Somodaran, Purwomartani, Kalasan, Special Region of Yogyakarta, Indonesia</div>
                  <div>Primary Email: legal@zieads.com</div>
                  <div>Phone: +62 851 5762 6264</div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* SECTION 1 */}
              <section id="agreement" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  1. Persetujuan Ketentuan
                </h2>
                <p>
                  Ketentuan Layanan ini merupakan perjanjian yang mengikat secara hukum antara Anda (baik secara pribadi atau atas nama entitas yang Anda wakili) dan <strong>PT. Bantu Indonesia Technology</strong>, sebuah perseroan terbatas yang terdaftar di Daerah Istimewa Yogyakarta, Indonesia, yang mengoperasikan platform ZieAds di <strong>zieads.com</strong> ("kami", "kita", "milik kami").
                </p>
                <p>
                  Dengan membuat akun, mendaftar, mengakses situs web, atau berlangganan layanan kami, Anda mengonfirmasi bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat oleh semua Ketentuan Layanan ini. Jika Anda tidak menyetujui semua Ketentuan ini, Anda dilarang menggunakan layanan ini dan harus segera menghentikan akses ke domain web kami.
                </p>
              </section>

              {/* SECTION 2 */}
              <section id="description" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  2. Deskripsi Layanan
                </h2>
                <p>
                  ZieAds adalah platform pemasaran software-as-a-service (SaaS) yang menyediakan alat penjadwalan dan analitik media sosial bagi kreator, bisnis kecil, dan agensi. Platform ini mencakup **alat v0.2** lama kami (audit kesiapan iklan berbasis URL yang dinilai di 6 dimensi, 10 alur kerja analisis diagnosis mendalam, 15 perintah slash terminal, ekspor laporan white-label, dan eksekusi model berbasis kredit) dan **alat v0.3** baru kami (penjadwalan sosial organik, dasbor kalender visual, saluran penerbitan otomatis untuk Instagram/TikTok/LinkedIn, kotak masuk komentar terpadu, dan lapisan AI Marketing Analyst harian yang menghasilkan laporan anomali dan optimalisasi waktu posting).
                </p>
                <p>
                  Kami menggunakan model kecerdasan buatan yang didukung oleh API Claude Anthropic untuk memproses data dan menyusun rekomendasi ini. Anda mengakui bahwa hasil AI merupakan saran dan Anda tetap bertanggung jawab untuk memeriksa dan memverifikasi konten sebelum dipublikasikan ke saluran terhubung Anda.
                </p>
              </section>

              {/* SECTION 3 */}
              <section id="eligibility" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  3. Kelayakan & Pendaftaran Akun
                </h2>
                <p>
                  Untuk mendaftarkan akun di ZieAds, Anda harus berusia minimal 18 tahun (atau usia legal mayoritas di yurisdiksi Anda). Dengan mendaftar, Anda menjamin bahwa Anda memiliki wewenang hukum untuk masuk ke dalam kontrak yang mengikat dan bahwa semua detail yang Anda berikan adalah akurat, mutakhir, dan lengkap.
                </p>
                <p>
                  Anda bertanggung jawab untuk menjaga kerahasiaan dan keamanan kredensial masuk Anda. Anda setuju untuk segera memberi tahu kami di <strong>legal@zieads.com</strong> jika Anda mendeteksi akses tidak sah ke dasbor kerja akun Anda. Kami tidak bertanggung jawab atas kerugian yang disebabkan oleh penggunaan tidak sah atas kredensial Anda.
                </p>
              </section>

              {/* SECTION 4 */}
              <section id="billing" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  4. Paket Berlangganan & Penagihan
                </h2>
                <p>
                  Kami menawarkan paket berlangganan (Solo: $29/bulan, Pro: $89/bulan, Studio: $229/bulan) dan paket kredit yang diproses secara aman melalui Stripe. Paket berbayar diperbarui secara otomatis secara bulanan atau tahunan kecuali dibatalkan. Anda dapat membatalkan langganan Anda kapan saja melalui panel penagihan akun Anda, dan pembatalan akan berlaku pada akhir siklus penagihan saat ini.
                </p>
                <p>
                  Kami menyediakan masa pengembalian dana 14 hari untuk pembelian paket berbayar pertama kali. Jika pembayaran berulang gagal setelah tiga kali percobaan otomatis, kami berhak menurunkan status akun Anda ke tingkat Gratis dan menangguhkan fitur lanjutan. Semua harga yang tercantum belum termasuk pajak penjualan atau PPN yang berlaku di Indonesia, yang merupakan tanggung jawab Anda.
                </p>
              </section>

              {/* SECTION 5 */}
              <section id="acceptable-use" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  5. Kebijakan Penggunaan Wajar
                </h2>
                <p>
                  Anda setuju untuk menggunakan ZieAds murni untuk tujuan bisnis yang sah. Anda dilarang menggunakan platform untuk mempublikasikan konten yang memfitnah, penuh kebencian, atau ilegal; mendistribusikan spam atau kampanye promosi yang tidak disetujui; melanggar hak cipta atau kekayaan intelektual pihak ketiga; atau melewati, mengikis, atau mengekstrak skema basis data atau merekayasa balik algoritma.
                </p>
                <p>
                  Kami berhak untuk mengaudit postingan terjadwal dan input yang masuk. Pelanggaran terhadap Kebijakan Penggunaan Wajar ini akan mengakibatkan penangguhan atau penghentian segera dasbor kerja Anda tanpa pengembalian dana atas kredit atau biaya yang tidak terpakai.
                </p>
              </section>

              {/* SECTION 6 */}
              <section id="intellectual-property" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  6. Konten Pengguna & Kekayaan Intelektual
                </h2>
                <p>
                  Anda memegang kepemilikan tunggal atas semua caption, lampiran media, dan log berkas yang Anda unggah, susun, atau jadwalkan melalui ZieAds. Anda memberi kami lisensi terbatas, di seluruh dunia, bebas royalti untuk menyimpan, memproses, dan mempublikasikan konten ini secara eksklusif untuk menyediakan layanan yang Anda minta.
                </p>
                <p>
                  Semua kode sumber eksklusif, tata letak, konfigurasi petunjuk AI, struktur basis data, merek dagang, logo, dan algoritma penilaian audit di zieads.com adalah milik eksklusif PT. Bantu Indonesia Technology dan dilindungi oleh undang-undang hak cipta internasional.
                </p>
              </section>

              {/* SECTION 7 */}
              <section id="compliance" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  7. Kepatuhan Platform Pihak Ketiga
                </h2>
                <p>
                  ZieAds terhubung ke platform eksternal (Instagram, TikTok, LinkedIn) melalui API pengembang resmi. Anda harus mematuhi ketentuan layanan masing-masing platform (Ketentuan Meta, Ketentuan Pengembang TikTok, Ketentuan API LinkedIn). Kami tidak bertanggung jawab atau berkewajiban atas batasan akun, penangguhan, atau modifikasi apa pun yang diterapkan pada saluran sosial Anda oleh platform-platform ini.
                </p>
              </section>

              {/* SECTION 8 */}
              <section id="ai-disclaimer" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  8. Sanggahan Konten Buatan AI
                </h2>
                <p>
                  Saran, ringkasan, dan diagnosis iklan dihasilkan oleh kecerdasan buatan. ZIEADS TIDAK MENJAMIN AKURASI, EFEKTIVITAS, ATAU KEPATUHAN HUKUM DARI WAWASAN INI. Semua rekomendasi disediakan "sebagaimana adanya" dan bukan merupakan saran periklanan, keuangan, atau hukum profesional.
                </p>
              </section>

              {/* SECTION 9 */}
              <section id="availability" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  9. Ketersediaan & Modifikasi Layanan
                </h2>
                <p>
                  Kami menargetkan ketersediaan layanan sebesar 99.5% tetapi tidak menjamin bahwa platform kami akan berjalan tanpa gangguan atau bebas kesalahan. Kami dapat memperbarui fitur, memodifikasi tata letak, atau menghentikan opsi analitik dengan pemberitahuan yang wajar. Kami tidak bertanggung jawab atas gangguan yang disebabkan oleh perubahan API pihak ketiga.
                </p>
              </section>

              {/* SECTION 10 */}
              <section id="warranties" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  10. Sanggahan & Jaminan
                </h2>
                <p>
                  PLATFORM INI DISEDIAKAN BERDASARKAN "SEBAGAIMANA ADANYA" DAN "SEBAGAIMANA TERSEDIA". PT. BANTU INDONESIA TECHNOLOGY MENOLAK SEMUA JAMINAN, BAIK TERSURAT MAUPUN TERSIRAT, TERMASUK KESESUAIAN UNTUK TUJUAN PEMASARAN TERTENTU ATAU NON-PELANGGARAN.
                </p>
              </section>

              {/* SECTION 11 */}
              <section id="liability" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  11. Batasan Tanggung Jawab
                </h2>
                <p>
                  SEJAUH DIIZINKAN OLEH HUKUM, PT. BANTU INDONESIA TECHNOLOGY DAN DIREKTURNYA TIDAK AKAN BERTANGGUNG JAWAB ATAS KERUGIAN TIDAK LANGSUNG, KONSEKUENSIAL, ATAU KHUSUS, ATAU HILANGNYA KEUNTUNGAN, KEBOCORAN DATA, ATAU ANGGARAN PERIKLANAN YANG DIHABISKAN PADA KAMPANYE. TOTAL TANGGUNG JAWAB KAMI DIBATASI SEBESAR BIAYA YANG ANDA BAYARKAN KEPADA ZIEADS DALAM 12 BULAN SEBELUM KLAIM DIAJUKAN.
                </p>
              </section>

              {/* SECTION 12 */}
              <section id="indemnity" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  12. Ganti Rugi
                </h2>
                <p>
                  Anda setuju untuk mengganti rugi dan membebaskan PT. Bantu Indonesia Technology, pejabat, dan karyawannya dari setiap klaim pihak ketiga, biaya hukum, atau kerugian yang timbul dari pelanggaran Anda terhadap Ketentuan Layanan ini atau ketentuan saluran terhubung Anda.
                </p>
              </section>

              {/* SECTION 13 */}
              <section id="termination" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  13. Pengakhiran Akun
                </h2>
                <p>
                  Anda dapat mengakhiri dasbor kerja akun Anda kapan saja dengan meminta penghapusan di pengaturan Anda. Kami berhak untuk menangguhkan atau memblokir akses Anda segera jika Anda melanggar ketentuan apa pun dari Ketentuan ini atau terlibat dalam aktivitas yang mengancam keamanan platform.
                </p>
              </section>

              {/* SECTION 14 */}
              <section id="dispute-resolution" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  14. Penyelesaian Sengketa & Hukum Yang Mengatur
                </h2>
                <p>
                  Ketentuan Layanan ini diatur dan ditafsirkan sesuai dengan hukum **Republik Indonesia**. Setiap sengketa yang timbul dari atau sehubungan dengan Ketentuan ini yang tidak dapat diselesaikan melalui negosiasi damai dalam waktu 30 hari akan diselesaikan secara eksklusif melalui yurisdiksi Pengadilan Negeri Yogyakarta.
                </p>
              </section>

              {/* SECTION 15 */}
              <section id="changes-to-terms" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  15. Perubahan Ketentuan Ini
                </h2>
                <p>
                  Kami dapat menyesuaikan Ketentuan Layanan ini kapan saja. Perubahan material akan dikomunikasikan melalui email atau dasbor pemberitahuan 14 hari sebelum diberlakukan. Penggunaan berkelanjutan ZieAds setelah tanggal efektif merupakan penerimaan Anda atas ketentuan yang direvisi.
                </p>
              </section>

              {/* SECTION 16 */}
              <section id="contact-terms" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  16. Informasi Kontak
                </h2>
                <p>
                  Jika Anda memiliki pertanyaan atau pemberitahuan hukum terkait Ketentuan ini, hubungi kami di:
                </p>
                <div className="font-mono text-sm leading-relaxed text-zinc-655 bg-zinc-50 border border-zinc-200 p-6 rounded-lg">
                  <div>PT. Bantu Indonesia Technology</div>
                  <div>Kantor Terdaftar: Omah Dongeng, Somodaran, Purwomartani, Kalasan, Daerah Istimewa Yogyakarta, Indonesia</div>
                  <div>Email Utama: legal@zieads.com</div>
                  <div>Telepon: +62 851 5762 6264</div>
                </div>
              </section>
            </>
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-16 px-6 no-print">
        <div className="max-w-[800px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-black" onClick={scrollToTop} style={{ cursor: 'pointer' }}>
              <ZieAdsLogo size={24} />
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-lg">zieads</span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-xs">
              PT. Bantu Indonesia Technology. AI-powered social media management and ad audit layers for creators and agencies.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-black mb-3">Links</h4>
            <ul className="space-y-2 text-zinc-500 text-xs pl-0 list-none">
              <li><a href="/#how-it-works" className="hover:text-black transition-colors decoration-none">How It Works</a></li>
              <li><a href="/#pricing" className="hover:text-black transition-colors decoration-none">Pricing</a></li>
              <li><a href="/#faq" className="hover:text-black transition-colors decoration-none">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-3">Legal</h4>
            <ul className="space-y-2 text-zinc-500 text-xs pl-0 list-none">
              <li><a href="/privacy-policy" className="hover:text-black transition-colors decoration-none">Privacy Policy</a></li>
              <li><a href="/terms" className="font-semibold text-black decoration-none">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[800px] mx-auto border-t border-zinc-200 mt-12 pt-6 text-center text-xs text-zinc-400 font-mono">
          © 2026 PT. Bantu Indonesia Technology. All rights reserved. Registered Office: Somodaran, Purwomartani, Kalasan, Yogyakarta, Indonesia.
        </div>
      </footer>

    </div>
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

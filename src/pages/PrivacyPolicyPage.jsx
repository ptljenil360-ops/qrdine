import React from 'react';
import { ArrowLeft, Shield, FileText, UserCheck, Trash2, Mail, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-base-bg)] font-sans text-[var(--color-text-primary)] selection:bg-orange-100 selection:text-orange-900 pb-20">
      
      {/* Premium Elegant Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-base-bg)]/70 border-b border-[var(--color-border)] px-6 py-4 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-orange-600 transition-all group bg-[var(--color-base-card)] hover:bg-[var(--color-base-bg)] px-3.5 py-2 rounded-xl border border-[var(--color-border)] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider text-orange-600 uppercase">DPDPA 2023 Compliant</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
        <div className="relative bg-gradient-to-r from-[var(--color-base-card)] to-[var(--color-base-bg)] rounded-[24px] p-8 md:p-12 overflow-hidden shadow-xl shadow-slate-950/10 mb-8 border border-[var(--color-border)]">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold mb-4 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" /> Privacy & Security
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight">
                Privacy Policy &amp; Notice
              </h1>
              <p className="text-[var(--color-text-muted)] text-sm md:text-base mt-2 max-w-xl">
                Learn how RaShoyi protects your personal data under the India Digital Personal Data Protection Act (DPDPA), 2023.
              </p>
            </div>
            <div className="bg-[var(--color-base-bg)]/80 border border-[var(--color-border)] rounded-2xl p-4 text-center md:text-right backdrop-blur-sm self-stretch md:self-auto flex flex-col justify-center">
              <span className="text-xs text-[var(--color-text-muted)] block uppercase tracking-wider font-bold">Last Updated</span>
              <span className="text-lg font-bold text-[var(--color-text-primary)] block mt-0.5">May 26, 2026</span>
              <span className="text-[11px] text-orange-400 font-medium block mt-1">Version 1.1</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Cards (Aesthetics & UX highlight) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <FileText className="w-6 h-6 text-orange-500 mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">Transparency First</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              We list all collected data transparently. No hidden trackers, analytics scripts, or advertising networks.
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <UserCheck className="w-6 h-6 text-blue-500 mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">Consent Driven</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              We process data purely to fulfill your dining order. You have the right to withdraw consent anytime.
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <Trash2 className="w-6 h-6 text-red-500 mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">Data Minimization</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              We delete inactive customer sessions. Restaurant owners can fully delete their profiles via Settings.
            </p>
          </div>
        </div>

        {/* Document Body (Glassmorphism & Clean Separation) */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 md:p-10 shadow-sm space-y-8 leading-relaxed text-sm text-slate-700">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-orange-500">1.</span> Context &amp; Scope
            </h2>
            <p>
              This Privacy Notice is issued by <strong>RaShoyi</strong> in compliance with the **Digital Personal Data Protection Act (DPDPA), 2023** of India. 
              RaShoyi operates as a digital ordering solution connecting customers (<strong>Data Principals</strong>) with partner restaurants (<strong>Data Fiduciaries</strong>).
            </p>
            <p>
              This policy explains the processing of personal data for two distinct groups:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong className="text-slate-800">Restaurant Owners:</strong> Individuals who register and configure business details on the RaShoyi merchant dashboard.</li>
              <li><strong className="text-slate-800">Restaurant Customers:</strong> Dining guests who access the digital menu, customize items, and place tableside orders via the QR PWA screen.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-orange-500">2.</span> What Personal Data We Process
            </h2>
            <p>
              In alignment with the principle of **data minimization**, we collect and process only the minimal data points required to facilitate your dining order or platform operations:
            </p>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="p-3">Category</th>
                    <th className="p-3">Specific Data Fields</th>
                    <th className="p-3">Storage Location</th>
                    <th className="p-3">Purpose of Processing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Owner Profile</td>
                    <td className="p-3">Phone number, email, full name, restaurant name, address, GSTIN (optional)</td>
                    <td className="p-3">Cloud Firestore (Secure India/Asia Servers) &amp; Firebase Auth</td>
                    <td className="p-3">Merchant dashboard login, subscription management, and invoice printing</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Restaurant Menu</td>
                    <td className="p-3">Dish names, prices, description, category, and food item photographs</td>
                    <td className="p-3">Cloud Firestore &amp; Firebase Storage (for optimized image delivery)</td>
                    <td className="p-3">Public menu display to customers scanning tableside QR codes</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Customer Orders</td>
                    <td className="p-3">Ordered items, quantities, table identifier, optional preparation notes</td>
                    <td className="p-3">Cloud Firestore (linked via Table ID)</td>
                    <td className="p-3">Transmitting items to the kitchen display and calculating GST bills</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Temporary Cart</td>
                    <td className="p-3">Selected items, cart quantities</td>
                    <td className="p-3">Browser LocalStorage (Client-Side only)</td>
                    <td className="p-3">Persistent client cart. This data is never sent to servers until checked out.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Authentication</td>
                    <td className="p-3">Firebase Auth JSON Web Tokens (JWT)</td>
                    <td className="p-3">Browser IndexedDB (Client-Side only)</td>
                    <td className="p-3">Session persistence and secure API communication for dashboard owners</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-orange-500">3.</span> Basis of Processing &amp; Consent
            </h2>
            <p>
              We process personal data based on the following grounds under the DPDPA, 2023:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600">
              <li>
                <strong className="text-slate-800">Consent (Section 6):</strong> Customer and Owner data is processed based on explicit, revocable consent obtained at onboarding/ordering.
              </li>
              <li>
                <strong className="text-slate-800">Legitimate Use (Section 7):</strong> Essential order processing details are handled as a voluntary provision of information to fulfill a specific service requested (dining and billing).
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-orange-500">4.</span> Rights of Data Principals (Under DPDPA)
            </h2>
            <p>
              As a Data Principal in India, you hold the following rights regarding the personal data we process:
            </p>
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3">
                <span className="font-bold text-orange-500">A.</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Right to Access &amp; Summary</h4>
                  <p className="text-xs text-slate-500 mt-1">You have the right to request a summary of the personal data currently processed and a description of processing activities.</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3">
                <span className="font-bold text-orange-500">B.</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Right to Correction &amp; Erasure</h4>
                  <p className="text-xs text-slate-500 mt-1">You have the right to correct outdated details or request complete erasure of your personal data. Restaurant owners can trigger erasure instantly by clicking **"Delete Account"** in Settings. For customers, table order history can be purged upon request to the partner restaurant.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3">
                <span className="font-bold text-orange-500">C.</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Right to Grievance Redressal</h4>
                  <p className="text-xs text-slate-500 mt-1">You have the right to raise grievances with us regarding any perceived breach of your data rights. Details for our Grievance Officer are listed in Section 7.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-orange-500">5.</span> Data Security &amp; Hosting
            </h2>
            <p>
              We implement industry-standard physical, technical, and administrative safeguards:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>All databases are hosted on secure, regional Firebase Cloud environments (located in Mumbai/Asia region).</li>
              <li>Network traffic is encrypted in transit using Transport Layer Security (TLS 1.3).</li>
              <li>Security Rules strictly restrict read/write access to owners' settings and block third-party index enumeration.</li>
              <li>Firebase Storage images are uploaded securely over HTTPS.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-orange-500">6.</span> Third-Party Data Processors
            </h2>
            <p>
              RaShoyi shares data only with the following sub-processors to provide essential SaaS hosting and delivery:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Google Firebase:</strong> Database hosting, user account authentication, and application servers.</li>
              <li><strong>Firebase Storage:</strong> Menu dish photographs storage, compression, and delivery.</li>
            </ul>
            <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-lg mt-2">
              Note: We do not sell, rent, or trade your dining behaviors or contact profiles with external advertising aggregators or data brokers.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-orange-500">7.</span> Grievance Redressal &amp; Consent Withdrawal
            </h2>
            <p>
              If you have any questions about this privacy notice, wish to withdraw your consent, or file a complaint regarding personal data processing, you can contact our designated Grievance Officer:
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4 mt-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Grievance Redressal Officer</span>
                <span className="text-base font-extrabold text-slate-800 block">Taha Jaffri</span>
                <span className="text-xs text-slate-500 block">RaShoyi Security &amp; Compliance Team</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-shadow self-start md:self-center">
                <Mail className="w-4 h-4 text-orange-500" />
                <a href="mailto:grievance@rashoyi.in" className="text-xs font-bold text-slate-700 hover:text-orange-600 transition-colors">
                  grievance@rashoyi.in
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

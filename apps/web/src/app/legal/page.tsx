import { DocsLayout } from '@/components/layout/DocsLayout';

export default function LegalPage() {
  const toc = [
    { id: '1-terms-of-service', title: 'Terms of Service', level: 2 },
    { id: '2-user-content-and-code', title: 'User Content and Code', level: 2 },
    { id: '3-privacy-policy', title: 'Privacy Policy', level: 2 },
    { id: '4-limitation-of-liability', title: 'Limitation of Liability', level: 2 },
    { id: '5-contact-us', title: 'Contact Us', level: 2 },
  ];

  return (
    <DocsLayout toc={toc}>
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-4xl font-extrabold text-white m-0">Legal</h1>
        <span className="text-xs text-neutral-500 font-mono">v1.0.0</span>
      </div>
      
      <p className="lead text-lg text-neutral-400 mb-10 pb-6 border-b border-white/[0.06]">
        Please read these terms and conditions carefully before using our service. Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2 id="1-terms-of-service" className="text-xl font-bold text-white mt-12 mb-4 scroll-m-20">1. Terms of Service</h2>
      <p>
        Welcome to SYNQ ("we," "our," "us"). By accessing or using our multiplayer IDE and related services, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use SYNQ. You must be at least 13 years old to use our Service. You are responsible for all activities that occur under your account and for maintaining the confidentiality of your credentials.
      </p>

      <h2 id="2-user-content-and-code" className="text-xl font-bold text-white mt-12 mb-4 scroll-m-20">2. User Content and Code</h2>
      <p>
        You retain all rights to any code, data, or other content you create, store, or transmit through SYNQ. However, by using the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, and modify your content solely as necessary to provide, maintain, and improve the Service.
      </p>

      <h2 id="3-privacy-policy" className="text-xl font-bold text-white mt-12 mb-4 scroll-m-20">3. Privacy Policy</h2>
      <p>
        Your privacy is critically important to us. We only collect the personal information essential to operating our Service, such as your email address and GitHub account details used for authentication.
      </p>
      <p>
        We do not sell or rent your personal information to third parties. Your code and workspace data are stored securely and are only accessible to you and your authorized team members.
      </p>

      <h2 id="4-limitation-of-liability" className="text-xl font-bold text-white mt-12 mb-4 scroll-m-20">4. Limitation of Liability</h2>
      <p>
        SYNQ is provided "as is" without any warranties, express or implied. In no event shall SYNQ Systems, Inc., its directors, employees, or partners be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
      </p>

      <h2 id="5-contact-us" className="text-xl font-bold text-white mt-12 mb-4 scroll-m-20">5. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact Rushi Khalate via email at <strong>rushipk16@gmail.com</strong> or our dedicated <a href="/contact">contact portal</a>.
      </p>
    </DocsLayout>
  );
}

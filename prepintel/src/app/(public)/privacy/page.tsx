import { PublicFooter } from "@/components/core/PublicFooter";
import { Logo } from "@/components/core/Logo";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full border-b border-white/5">
        <Link href="/"><Logo size="sm" /></Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Log in</Link>
      </nav>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
        <div className="prose prose-invert prose-white max-w-none text-white/70 space-y-6">
          <p>Last updated: August 26, 2026</p>
          <p>Welcome to PrepIntel. This Privacy Policy explains how we collect, use, store, and protect information when you use our website and services.</p>
          <p>By using PrepIntel, you agree to the practices described in this Privacy Policy.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>When you use PrepIntel, we may collect the following information:</p>
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Account Information</h3>
          <p>If you create or access an account, we may collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your email address</li>
            <li>Your name and profile information provided through Google Sign-In</li>
            <li>Authentication and account-related information</li>
            <li>Information associated with your PrepIntel account and activity</li>
          </ul>
          <p className="mt-4">You may access PrepIntel using either:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Google Sign-In, which allows you to authenticate using your Google account; or</li>
            <li>Email magic link authentication, where you enter your email address and we send you a one-time clickable link that allows you to securely access your PrepIntel account.</li>
          </ul>
          <p className="mt-4">We use Supabase to provide authentication and manage account-related information.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Google Sign-In</h2>
          <p>If you choose to sign in using Google, Google may provide us with certain information associated with your Google account, such as your name, email address, and profile information, depending on the permissions and settings applicable to your Google account.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We use this information only for purposes related to authentication, account creation, account management, and providing PrepIntel services.</li>
            <li>We do not receive or store your Google password.</li>
            <li>Google's handling of information is governed by Google's own privacy policies and terms.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Email Magic Links</h2>
          <p>PrepIntel allows you to sign in without creating or remembering a password.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>When you enter your email address, Supabase sends a one-time authentication link to that email address. Clicking the link authenticates you and provides access to your PrepIntel account.</li>
            <li>We may process and store your email address for authentication and account management purposes.</li>
            <li>Authentication links are intended for one-time or limited authentication use and should not be shared with other individuals.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Supabase</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We use Supabase as an authentication and backend service provider.</li>
            <li>Supabase may process information necessary to provide authentication and related services, including email addresses, authentication data, and account information.</li>
            <li>Supabase processes information according to its own privacy practices and applicable terms.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Website Usage Information</h2>
          <p>We may collect basic technical and usage information when you visit PrepIntel, which may include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device type</li>
            <li>Operating system</li>
            <li>Pages visited</li>
            <li>General usage information</li>
            <li>Date and time of visits</li>
            <li>Cookies and similar technologies</li>
          </ul>
          <p className="mt-4">This information may be used to operate, maintain, secure, and improve PrepIntel.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Cookies and Advertising</h2>
          <p>PrepIntel uses cookies and similar technologies for authentication, website functionality, analytics, and advertising.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We use Google AdSense to display advertisements on our website.</li>
            <li>Google and its advertising partners may use cookies and similar technologies to show advertisements based on a user's visits to this website and/or other websites.</li>
            <li>Third-party vendors, including Google, may use advertising cookies to serve ads based on users' prior visits to this website or other websites.</li>
            <li>Where applicable, users may manage or opt out of personalized advertising through Google's advertising settings.</li>
            <li>Users may also have additional choices regarding cookies and personalized advertising depending on their location and applicable privacy requirements.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. How We Use Information</h2>
          <p>We may use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage user accounts</li>
            <li>Authenticate users</li>
            <li>Send authentication emails and magic links</li>
            <li>Provide and operate PrepIntel</li>
            <li>Maintain website security</li>
            <li>Prevent fraud and abuse</li>
            <li>Improve website functionality and user experience</li>
            <li>Understand website usage</li>
            <li>Display advertisements</li>
            <li>Communicate with users regarding their accounts, services, or important updates</li>
            <li>Comply with applicable legal obligations</li>
          </ul>
          <p className="mt-4">We do not sell users' personal information for monetary consideration.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Third-Party Service Providers</h2>
          <p>We may use third-party services to operate and improve PrepIntel, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Supabase — authentication and backend services</li>
            <li>Google — Google Sign-In and advertising services through Google AdSense</li>
          </ul>
          <p className="mt-4">These providers may process information as necessary to provide their respective services. Their handling of information is subject to their own privacy policies and applicable terms.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Data Security</h2>
          <p>We take reasonable measures to protect information associated with PrepIntel accounts and services. However, no method of transmission or electronic storage is completely secure, and we cannot guarantee absolute security of information.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Data Retention and Account Information</h2>
          <p>We retain account information for as long as reasonably necessary to provide our services, maintain account functionality, comply with legal obligations, resolve disputes, and enforce our agreements.</p>
          <p>If you would like to request deletion of your account or personal information, you may contact us using the contact information provided below.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Children's Privacy</h2>
          <p>PrepIntel is not intentionally designed to collect personal information from children in violation of applicable laws. If you believe that a child has provided personal information to us inappropriately, please contact us so that we can take appropriate action.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. Your Privacy Choices</h2>
          <p>Depending on your location and applicable law, you may have rights regarding your personal information, including the right to request:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your personal information</li>
            <li>Information about how your information is used</li>
          </ul>
          <p className="mt-4">You may also manage certain cookie and advertising preferences through available browser, Google, or consent-management settings. To make a privacy-related request, contact us using the information below.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">13. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes to PrepIntel, our services, technology, or applicable legal requirements. When we make changes, we will update the "Last updated" date at the top of this page.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">14. Contact Us</h2>
          <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:princejha200490@gmail.com" className="text-primary hover:underline">princejha200490@gmail.com</a></p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

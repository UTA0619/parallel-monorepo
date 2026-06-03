import Link from "next/link";

export const metadata = { title: "Privacy Policy — PARALLEL" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-parallel-bg px-8 py-16 max-w-3xl mx-auto">
      <Link href="/" className="text-parallel-dim hover:text-parallel-text text-sm transition-colors">← Back</Link>
      <h1 className="font-display font-bold text-3xl text-parallel-text mt-8 mb-2">Privacy Policy</h1>
      <p className="text-parallel-dim text-sm mb-10">Last updated: June 3, 2026</p>

      <div className="space-y-8 text-parallel-dim leading-relaxed text-sm">
        <section>
          <h2 className="text-parallel-text font-semibold text-lg mb-3">1. Information We Collect</h2>
          <p>PARALLEL collects information you provide directly, including your name, email address, and the content of your conversations with your Parallels. We also collect usage data and device information to improve the service.</p>
        </section>

        <section>
          <h2 className="text-parallel-text font-semibold text-lg mb-3">2. How We Use Your Information</h2>
          <p>Your information is used to operate and improve PARALLEL, to generate insights from your Parallels, and to provide personalized experiences. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-parallel-text font-semibold text-lg mb-3">3. AI and Your Data</h2>
          <p>Conversations with your Parallels are processed by AI models to generate responses and insights. Your conversation data is stored securely and used only to power your personal Parallels. We implement strict access controls to ensure your data remains private.</p>
        </section>

        <section>
          <h2 className="text-parallel-text font-semibold text-lg mb-3">4. Data Retention</h2>
          <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at privacy@parallel.app.</p>
        </section>

        <section>
          <h2 className="text-parallel-text font-semibold text-lg mb-3">5. Security</h2>
          <p>We use industry-standard encryption and security measures to protect your data. All data is encrypted in transit and at rest.</p>
        </section>

        <section>
          <h2 className="text-parallel-text font-semibold text-lg mb-3">6. Crisis Data</h2>
          <p>If our system detects content that may indicate a mental health crisis, certain anonymized signals may be reviewed by our safety team to improve crisis detection accuracy. This is done solely to protect user wellbeing.</p>
        </section>

        <section>
          <h2 className="text-parallel-text font-semibold text-lg mb-3">7. Contact</h2>
          <p>For privacy questions, contact us at <a href="mailto:privacy@parallel.app" className="text-parallel-accent hover:underline">privacy@parallel.app</a>.</p>
        </section>
      </div>
    </div>
  );
}

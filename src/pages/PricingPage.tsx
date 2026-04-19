import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PricingPage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!user) {
      await signInWithGoogle();
    }
    navigate('/app/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">Simple, transparent pricing.</h1>
          <p className="text-lg text-gray-500">Pick a plan that scales with your creative business.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <PricingCard
            title="Starter"
            price="$5"
            period="/mo"
            desc="Perfect to try out the platform."
            features={[
              "3 high-quality AI generations",
              "1 PDF/Audio upload",
              "Standard extraction speed",
              "Community support"
            ]}
            btnText="Get Started"
            onClick={handleUpgrade}
          />
          {/* Pro */}
          <PricingCard
            title="Pro"
            price="$10"
            period="/mo"
            desc="For serious course creators."
            features={[
              "Unlimited AI generations",
              "Unlimited large file uploads",
              "Priority processing queue",
              "Export to Markdown & PDF",
              "Use your own OpenAI/Gemini API key"
            ]}
            isPopular
            btnText="Upgrade to Pro"
            onClick={handleUpgrade}
          />
          {/* Team */}
          <PricingCard
            title="Team"
            price="$20"
            period="/mo"
            desc="For agencies and institutions."
            features={[
              "Everything in Pro",
              "5 team member seats",
              "Shared workspace",
              "Custom branding & white-label",
              "24/7 priority support"
            ]}
            btnText="Upgrade to Team"
            onClick={handleUpgrade}
          />
        </div>
      </div>
    </div>
  );
}

function PricingCard({ title, price, period, desc, features, isPopular, btnText, onClick }: any) {
  return (
    <div className={`relative flex flex-col p-8 rounded-3xl bg-white border ${isPopular ? 'border-indigo-600 shadow-2xl shadow-indigo-600/10' : 'border-gray-200 shadow-sm'}`}>
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">
          Most Popular
        </span>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-gray-900">{price}</span>
          {period && <span className="text-gray-500 font-medium">{period}</span>}
        </div>
        <p className="text-gray-500 mt-4 text-sm">{desc}</p>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className="text-gray-600 text-sm leading-tight">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all ${
          isPopular 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {btnText}
      </button>
    </div>
  );
}

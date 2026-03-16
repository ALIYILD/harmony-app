interface PricingPageProps {
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */

interface Plan {
  name: string;
  price: string;
  period: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '\u00A30',
    period: '',
    features: [
      '5 sessions per month',
      'Core tone prompts',
      '1 child profile',
      'On-device privacy',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Family',
    price: '\u00A314.99',
    period: '/month',
    badge: 'Most popular',
    highlighted: true,
    features: [
      'Up to 60 sessions',
      'Full PDF reports',
      'Progress tracking',
      'Unlimited child profiles',
    ],
    cta: 'Subscribe',
  },
  {
    name: 'Annual',
    price: '\u00A3119',
    period: '/year',
    badge: 'Best value',
    features: [
      'Save 34% vs monthly',
      'All Family features',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Subscribe',
  },
  {
    name: 'Add-On',
    price: '\u00A32.99',
    period: '/pack',
    features: [
      '20 extra sessions',
      'Works with any plan',
      'No expiry',
    ],
    cta: 'Buy Pack',
  },
  {
    name: 'Institutional',
    price: '\u00A3POA',
    period: '',
    features: [
      'Per-seat NHS & school licences',
      'API access + white-label',
      'Dedicated account manager',
      'Custom onboarding',
    ],
    cta: 'Contact Us',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PricingPage({ onClose }: PricingPageProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#060E1C] overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[210] w-10 h-10 flex items-center justify-center rounded-full bg-[#0D1B2A] border border-[#1A3A5C] text-[#8EADC1] hover:text-white transition-colors text-xl"
        aria-label="Close"
      >
        &times;
      </button>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Choose your plan</h1>
          <p className="text-[#8EADC1] text-base">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        {/* Cards */}
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`
                shrink-0 w-[280px] sm:w-auto snap-center flex flex-col
                bg-[#0D1B2A] rounded-2xl p-6
                border transition-shadow
                ${plan.highlighted
                  ? 'border-[#38C9F0] shadow-lg shadow-[#38C9F0]/10'
                  : 'border-[#1A3A5C]'}
              `}
            >
              {/* Badge */}
              {plan.badge && (
                <span
                  className={`
                    self-start text-xs font-semibold px-3 py-1 rounded-full mb-3
                    ${plan.highlighted
                      ? 'bg-[#38C9F0]/15 text-[#38C9F0]'
                      : 'bg-amber-500/15 text-amber-400'}
                  `}
                >
                  {plan.badge}
                </span>
              )}

              {/* Plan name */}
              <h3 className="text-lg font-bold bg-gradient-to-r from-[#38C9F0] to-[#6C63FF] bg-clip-text text-transparent">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mt-3 mb-4">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-[#8EADC1] ml-1">{plan.period}</span>}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#8EADC1]">
                    <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`
                  w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity
                  ${plan.highlighted
                    ? 'bg-gradient-to-r from-[#38C9F0] to-[#6C63FF] text-white hover:opacity-90'
                    : 'border border-[#38C9F0] text-[#38C9F0] hover:bg-[#38C9F0]/10'}
                `}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-[#8EADC1] text-sm max-w-xl mx-auto">
            All plans include on-device privacy, unlimited child profiles (paid), and GDPR compliance.
          </p>
          <p className="text-[#8EADC1] text-sm">
            Questions? <a href="mailto:hello@harmonyalert.com" className="text-[#38C9F0] hover:underline">hello@harmonyalert.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

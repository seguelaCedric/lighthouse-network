// Color Token Swatch Component
function ColorSwatch({
  name,
  hex,
  className
}: {
  name: string;
  hex: string;
  className: string;
}) {
  const isLight = name.includes('50') || name.includes('100') || name.includes('200');

  return (
    <div className="flex flex-col">
      <div
        className={`h-16 w-full rounded-lg ${className} flex items-end p-2 shadow-sm border border-gray-200/50`}
      >
        <span className={`text-xs font-mono ${isLight ? 'text-gray-700' : 'text-white'}`}>
          {hex}
        </span>
      </div>
      <span className="mt-1.5 text-xs font-medium text-gray-600">{name}</span>
    </div>
  );
}

// Gradient Swatch Component
function GradientSwatch({
  name,
  description,
  className
}: {
  name: string;
  description: string;
  className: string;
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`h-20 w-full rounded-lg ${className} flex items-end p-3 shadow-md`}
      >
        <span className="text-xs font-mono text-white drop-shadow-sm">
          {name}
        </span>
      </div>
      <span className="mt-1.5 text-xs text-gray-500">{description}</span>
    </div>
  );
}

// Surface Swatch Component
function SurfaceSwatch({
  name,
  hex,
  className
}: {
  name: string;
  hex: string;
  className: string;
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`h-20 w-full rounded-lg ${className} flex items-end p-3 shadow-sm border border-gray-200`}
      >
        <span className="text-xs font-mono text-gray-600">
          {hex}
        </span>
      </div>
      <span className="mt-1.5 text-xs font-medium text-gray-600">{name}</span>
    </div>
  );
}

// Color Palette Section
function ColorSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4">
        <h2 className="text-2xl font-serif font-medium text-navy-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-surface-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-gold flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">Lighthouse Crew Network</h1>
              <p className="text-sm text-gray-500">Luxury Color Token System</p>
            </div>
          </div>
          <p className="mt-4 text-gray-600 max-w-2xl">
            A premium color palette designed for a high-end yacht crew recruitment platform.
            Inspired by private members clubs, yacht brokerages, and private banking aesthetics.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Primary Gold */}
        <ColorSection
          title="Primary Gold (Champagne)"
          description="The signature brand color - sophisticated antique gold, not bright yellow"
        >
          <ColorSwatch name="gold-50" hex="#FDFBF7" className="bg-gold-50" />
          <ColorSwatch name="gold-100" hex="#F9F5EB" className="bg-gold-100" />
          <ColorSwatch name="gold-200" hex="#F0E6D0" className="bg-gold-200" />
          <ColorSwatch name="gold-300" hex="#E1D4B5" className="bg-gold-300" />
          <ColorSwatch name="gold-400" hex="#CBBA8E" className="bg-gold-400" />
          <ColorSwatch name="gold-500" hex="#B49A5E" className="bg-gold-500" />
          <ColorSwatch name="gold-600" hex="#9A7F45" className="bg-gold-600" />
          <ColorSwatch name="gold-700" hex="#7D6636" className="bg-gold-700" />
          <ColorSwatch name="gold-800" hex="#5E4D29" className="bg-gold-800" />
          <ColorSwatch name="gold-900" hex="#3D3219" className="bg-gold-900" />
        </ColorSection>

        {/* Primary Navy */}
        <ColorSection
          title="Primary Navy (Midnight)"
          description="Deep, sophisticated navy for text and dark backgrounds"
        >
          <ColorSwatch name="navy-50" hex="#F4F6F9" className="bg-navy-50" />
          <ColorSwatch name="navy-100" hex="#E4E9F0" className="bg-navy-100" />
          <ColorSwatch name="navy-200" hex="#C5CFE0" className="bg-navy-200" />
          <ColorSwatch name="navy-300" hex="#94A3C4" className="bg-navy-300" />
          <ColorSwatch name="navy-400" hex="#5E6F94" className="bg-navy-400" />
          <ColorSwatch name="navy-500" hex="#3D4F6F" className="bg-navy-500" />
          <ColorSwatch name="navy-600" hex="#2A3A54" className="bg-navy-600" />
          <ColorSwatch name="navy-700" hex="#1C2840" className="bg-navy-700" />
          <ColorSwatch name="navy-800" hex="#111827" className="bg-navy-800" />
          <ColorSwatch name="navy-900" hex="#0A0F1A" className="bg-navy-900" />
        </ColorSection>

        {/* Burgundy Accent */}
        <ColorSection
          title="Burgundy Accent"
          description="Premium accent color for highlights and CTAs"
        >
          <ColorSwatch name="burgundy-50" hex="#FDF5F6" className="bg-burgundy-50" />
          <ColorSwatch name="burgundy-100" hex="#F9E6E9" className="bg-burgundy-100" />
          <ColorSwatch name="burgundy-200" hex="#F0C5CC" className="bg-burgundy-200" />
          <ColorSwatch name="burgundy-300" hex="#E09AA6" className="bg-burgundy-300" />
          <ColorSwatch name="burgundy-400" hex="#C4697A" className="bg-burgundy-400" />
          <ColorSwatch name="burgundy-500" hex="#9E3B4D" className="bg-burgundy-500" />
          <ColorSwatch name="burgundy-600" hex="#7D2D3D" className="bg-burgundy-600" />
          <ColorSwatch name="burgundy-700" hex="#5E222E" className="bg-burgundy-700" />
          <ColorSwatch name="burgundy-800" hex="#3F1720" className="bg-burgundy-800" />
          <ColorSwatch name="burgundy-900" hex="#2A1015" className="bg-burgundy-900" />
        </ColorSection>

        {/* Success */}
        <ColorSection
          title="Success (Emerald)"
          description="Luxurious emerald green for positive states"
        >
          <ColorSwatch name="success-50" hex="#F0FAF6" className="bg-success-50" />
          <ColorSwatch name="success-100" hex="#D1F2E4" className="bg-success-100" />
          <ColorSwatch name="success-200" hex="#A7E4CD" className="bg-success-200" />
          <ColorSwatch name="success-300" hex="#6DD1AE" className="bg-success-300" />
          <ColorSwatch name="success-400" hex="#3AB889" className="bg-success-400" />
          <ColorSwatch name="success-500" hex="#1D9A6C" className="bg-success-500" />
          <ColorSwatch name="success-600" hex="#167A55" className="bg-success-600" />
          <ColorSwatch name="success-700" hex="#115E42" className="bg-success-700" />
          <ColorSwatch name="success-800" hex="#0D4532" className="bg-success-800" />
          <ColorSwatch name="success-900" hex="#092E22" className="bg-success-900" />
        </ColorSection>

        {/* Warning */}
        <ColorSection
          title="Warning (Warm Amber)"
          description="Warm amber for caution states - not harsh orange"
        >
          <ColorSwatch name="warning-50" hex="#FFFBF5" className="bg-warning-50" />
          <ColorSwatch name="warning-100" hex="#FEF3E2" className="bg-warning-100" />
          <ColorSwatch name="warning-200" hex="#FDE4BD" className="bg-warning-200" />
          <ColorSwatch name="warning-300" hex="#FBCE8A" className="bg-warning-300" />
          <ColorSwatch name="warning-400" hex="#F7B355" className="bg-warning-400" />
          <ColorSwatch name="warning-500" hex="#E69A2E" className="bg-warning-500" />
          <ColorSwatch name="warning-600" hex="#C47F1A" className="bg-warning-600" />
          <ColorSwatch name="warning-700" hex="#9C6315" className="bg-warning-700" />
          <ColorSwatch name="warning-800" hex="#744A10" className="bg-warning-800" />
          <ColorSwatch name="warning-900" hex="#4D310B" className="bg-warning-900" />
        </ColorSection>

        {/* Error */}
        <ColorSection
          title="Error (Deep Rose)"
          description="Deep rose for error states - refined, not harsh red"
        >
          <ColorSwatch name="error-50" hex="#FEF5F5" className="bg-error-50" />
          <ColorSwatch name="error-100" hex="#FCE8E8" className="bg-error-100" />
          <ColorSwatch name="error-200" hex="#F9CECE" className="bg-error-200" />
          <ColorSwatch name="error-300" hex="#F3A5A5" className="bg-error-300" />
          <ColorSwatch name="error-400" hex="#E97777" className="bg-error-400" />
          <ColorSwatch name="error-500" hex="#D64545" className="bg-error-500" />
          <ColorSwatch name="error-600" hex="#B33636" className="bg-error-600" />
          <ColorSwatch name="error-700" hex="#8C2A2A" className="bg-error-700" />
          <ColorSwatch name="error-800" hex="#661F1F" className="bg-error-800" />
          <ColorSwatch name="error-900" hex="#441515" className="bg-error-900" />
        </ColorSection>

        {/* Neutrals */}
        <ColorSection
          title="Neutrals (Warm Grays)"
          description="Taupe undertones - warm, not cold gray"
        >
          <ColorSwatch name="gray-50" hex="#FAFAF8" className="bg-gray-50" />
          <ColorSwatch name="gray-100" hex="#F5F4F1" className="bg-gray-100" />
          <ColorSwatch name="gray-200" hex="#E8E6E1" className="bg-gray-200" />
          <ColorSwatch name="gray-300" hex="#D4D1CA" className="bg-gray-300" />
          <ColorSwatch name="gray-400" hex="#A8A49B" className="bg-gray-400" />
          <ColorSwatch name="gray-500" hex="#7D796F" className="bg-gray-500" />
          <ColorSwatch name="gray-600" hex="#5C5850" className="bg-gray-600" />
          <ColorSwatch name="gray-700" hex="#433F38" className="bg-gray-700" />
          <ColorSwatch name="gray-800" hex="#2A2722" className="bg-gray-800" />
          <ColorSwatch name="gray-900" hex="#1A1816" className="bg-gray-900" />
        </ColorSection>

        {/* Surfaces */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-navy-800">Surfaces</h2>
            <p className="text-sm text-gray-500 mt-1">Background and overlay colors</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SurfaceSwatch name="surface-white" hex="#FFFFFF" className="bg-surface-white" />
            <SurfaceSwatch name="surface-cream" hex="#FDFBF7" className="bg-surface-cream" />
            <SurfaceSwatch name="surface-ivory" hex="#F9F7F2" className="bg-surface-ivory" />
            <div className="flex flex-col">
              <div className="h-20 w-full rounded-lg flex items-end p-3 shadow-sm border border-gray-200" style={{ background: 'rgba(253, 251, 247, 0.95)' }}>
                <span className="text-xs font-mono text-gray-600">overlay-light</span>
              </div>
              <span className="mt-1.5 text-xs font-medium text-gray-600">overlay-light</span>
            </div>
            <div className="flex flex-col">
              <div className="h-20 w-full rounded-lg flex items-end p-3 shadow-sm" style={{ background: 'rgba(17, 24, 39, 0.7)' }}>
                <span className="text-xs font-mono text-white">overlay-dark</span>
              </div>
              <span className="mt-1.5 text-xs font-medium text-gray-600">overlay-dark</span>
            </div>
          </div>
        </section>

        {/* Gradients */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-navy-800">Gradients</h2>
            <p className="text-sm text-gray-500 mt-1">Premium metallic effects for special elements</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <GradientSwatch
              name="gradient-gold"
              description="Primary gold gradient"
              className="gradient-gold"
            />
            <GradientSwatch
              name="gradient-gold-shimmer"
              description="Animated shimmer effect"
              className="gradient-gold-shimmer"
            />
            <GradientSwatch
              name="gradient-navy"
              description="Deep navy gradient"
              className="gradient-navy"
            />
            <GradientSwatch
              name="gradient-burgundy"
              description="Burgundy accent gradient"
              className="gradient-burgundy"
            />
            <GradientSwatch
              name="gradient-chrome-light"
              description="Light metallic chrome"
              className="gradient-chrome-light"
            />
            <GradientSwatch
              name="gradient-chrome-dark"
              description="Dark metallic chrome"
              className="gradient-chrome-dark"
            />
          </div>
        </section>

        {/* Usage Examples */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-navy-800">Usage Examples</h2>
            <p className="text-sm text-gray-500 mt-1">Sample components using the color system</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Button */}
            <div className="bg-surface-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Primary Buttons</h3>
              <div className="flex flex-col gap-3">
                <button className="w-full py-3 px-6 rounded-lg gradient-gold text-white font-medium shadow-md hover:shadow-lg transition-shadow">
                  Gold CTA
                </button>
                <button className="w-full py-3 px-6 rounded-lg bg-navy-800 text-white font-medium hover:bg-navy-700 transition-colors">
                  Navy Action
                </button>
                <button className="w-full py-3 px-6 rounded-lg bg-burgundy-500 text-white font-medium hover:bg-burgundy-600 transition-colors">
                  Burgundy Accent
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="bg-surface-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Card Styles</h3>
              <div className="space-y-3">
                <div className="bg-surface-cream rounded-lg p-4 border border-gold-200">
                  <p className="text-sm font-medium text-navy-800">Premium Card</p>
                  <p className="text-xs text-gray-500">Gold accent border</p>
                </div>
                <div className="bg-navy-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-gold-300">Dark Card</p>
                  <p className="text-xs text-gray-400">Navy background</p>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="bg-surface-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Status Badges</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                  Verified
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                  Pending
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
                  Expired
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-100 text-gold-700">
                  Premium
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-navy-100 text-navy-700">
                  Standard
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-burgundy-100 text-burgundy-700">
                  VIP
                </span>
              </div>
            </div>

            {/* Text Styles */}
            <div className="bg-surface-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Typography</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-navy-800">Headline Navy</p>
                <p className="text-lg font-semibold text-gradient-gold">Gold Gradient</p>
                <p className="text-base text-gray-600">Body text in warm gray</p>
                <p className="text-sm text-gold-600">Accent link style</p>
              </div>
            </div>

            {/* Form Elements */}
            <div className="bg-surface-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Form Elements</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Input field"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none transition-all bg-surface-white"
                />
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border-2 border-gold-500 bg-gold-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Gold checkbox</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-surface-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Alerts</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-success-50 border border-success-200">
                  <p className="text-sm text-success-700">Success message</p>
                </div>
                <div className="p-3 rounded-lg bg-warning-50 border border-warning-200">
                  <p className="text-sm text-warning-700">Warning message</p>
                </div>
                <div className="p-3 rounded-lg bg-error-50 border border-error-200">
                  <p className="text-sm text-error-700">Error message</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Token Reference */}
        <section className="mb-12 bg-navy-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-gold-300 mb-4">Token Reference</h2>
          <p className="text-gray-400 mb-6">Use these Tailwind classes in your components:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm font-mono">
            <div className="bg-navy-900/50 rounded-lg p-4">
              <p className="text-gold-400 mb-2">Background</p>
              <p className="text-gray-300">bg-gold-500</p>
              <p className="text-gray-300">bg-navy-800</p>
              <p className="text-gray-300">bg-surface-cream</p>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-4">
              <p className="text-gold-400 mb-2">Text</p>
              <p className="text-gray-300">text-navy-800</p>
              <p className="text-gray-300">text-gold-500</p>
              <p className="text-gray-300">text-gray-600</p>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-4">
              <p className="text-gold-400 mb-2">Border</p>
              <p className="text-gray-300">border-gold-300</p>
              <p className="text-gray-300">border-gray-200</p>
              <p className="text-gray-300">border-burgundy-500</p>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-4">
              <p className="text-gold-400 mb-2">Gradients</p>
              <p className="text-gray-300">gradient-gold</p>
              <p className="text-gray-300">gradient-navy</p>
              <p className="text-gray-300">gradient-chrome-light</p>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-4">
              <p className="text-gold-400 mb-2">Ring</p>
              <p className="text-gray-300">ring-gold-500</p>
              <p className="text-gray-300">focus:ring-gold-200</p>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-4">
              <p className="text-gold-400 mb-2">Special</p>
              <p className="text-gray-300">text-gradient-gold</p>
              <p className="text-gray-300">gradient-gold-shimmer</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-surface-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-sm text-gray-500 text-center">
            Lighthouse Crew Network - Premium Yacht Crew Recruitment Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

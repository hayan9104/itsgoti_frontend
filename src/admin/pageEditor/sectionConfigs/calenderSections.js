export const calenderSections = [
  {
    id: 'header',
    label: 'Logo / Header',
    description: 'Top-left logo on /calender — upload an image OR use text fallback',
    fields: [
      { key: 'logoImage', type: 'image', label: 'Logo Image', hint: 'Upload your logo. If set, it replaces both the circle and the text.' },
      { key: 'logoText', type: 'text', label: 'Logo Text (Fallback)', hint: 'Shown only when no logo image is uploaded. e.g. "ItsGoti"' },
    ],
  },
  {
    id: 'topNav',
    label: 'Top-Right Buttons',
    description: 'Login + "Get Started for Free" buttons at the top right',
    fields: [
      { key: 'loginButtonText', type: 'text', label: 'Login Button Text', hint: 'e.g. "Log In"' },
      { key: 'getStartedButtonText', type: 'text', label: 'Get Started Button Text', hint: 'e.g. "Get started for free"' },
    ],
  },
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Left-side headline and CTA buttons on /calender',
    fields: [
      { key: 'heroTitle', type: 'textarea', label: 'Hero Title', hint: 'Use line breaks to split across multiple lines. e.g. "Easy\\nscheduling\\nahead"' },
      { key: 'heroDescription', type: 'textarea', label: 'Hero Description', hint: 'Short paragraph below the title' },
      { key: 'googleButtonText', type: 'text', label: 'Google Button Text', hint: 'e.g. "Sign up with Google"' },
      { key: 'emailLinkText', type: 'text', label: 'Email Link Text', hint: 'e.g. "Sign up free with email"' },
    ],
  },
  {
    id: 'slideshow',
    label: 'Right-Side Image Slideshow',
    description: 'Unlimited images, all displayed at the same size, auto-rotating every 3 seconds',
    fields: [
      { key: 'slideshowImages', type: 'imageArray', label: 'Slideshow Images', hint: 'Upload as many images as you want. They will auto-rotate every 3 seconds.' },
      { key: 'slideshowInterval', type: 'range', label: 'Rotation Speed (seconds)', min: 1, max: 10, step: 0.5, hint: 'Time each image stays visible (default: 3 seconds)' },
    ],
  },
  {
    id: 'signupForm',
    label: 'Signup Page — Left Form',
    description: 'Content shown after clicking "Get Started for Free" (left side: create account form)',
    fields: [
      { key: 'signupTitle', type: 'text', label: 'Title', hint: 'e.g. "Create your free account"' },
      { key: 'signupSubtitle', type: 'text', label: 'Subtitle', hint: 'e.g. "No credit card required. Upgrade anytime."' },
      { key: 'signupEmailPlaceholder', type: 'text', label: 'Email Input Placeholder', hint: 'e.g. "Enter your email"' },
      { key: 'signupContinueEmailText', type: 'text', label: 'Continue with Email Button Text' },
      { key: 'signupGoogleText', type: 'text', label: 'Continue with Google Button Text' },
      { key: 'signupFooterText', type: 'textarea', label: 'Footer Text Below Buttons', hint: 'e.g. "Continue with your Google account to connect your calendar"' },
      { key: 'signupLoginPromptText', type: 'text', label: 'Login Prompt Text', hint: 'e.g. "Already have an account?"' },
      { key: 'signupLoginLinkText', type: 'text', label: 'Login Link Text', hint: 'e.g. "Log In →"' },
    ],
  },
  {
    id: 'signupFeatures',
    label: 'Signup Page — Right Features Card',
    description: 'Right-side trial features card shown on the signup page',
    fields: [
      { key: 'signupBadgeText', type: 'text', label: 'Top Badge Text', hint: 'e.g. "Try Teams plan free"' },
      { key: 'signupFeaturesTitle', type: 'textarea', label: 'Features Title', hint: 'e.g. "Explore premium features with your free 14-day Teams plan trial"' },
      { key: 'signupFeaturesList', type: 'textarea', label: 'Feature Bullet Points', hint: 'One feature per line. Each line gets a blue checkmark. Add as many as you want.' },
      { key: 'signupJoinText', type: 'text', label: 'Companies Joining Text', hint: 'e.g. "Join leading companies using the #1 scheduling tool"' },
      { key: 'signupCompanyLogos', type: 'imageArray', label: 'Company Logos', hint: 'Upload logos of brands using your product (Dropbox, etc.)' },
    ],
  },
  {
    id: 'signinPage',
    label: 'Signin Page',
    description: 'The /calender/signin page (Log in to your account)',
    fields: [
      { key: 'signinTitle', type: 'text', label: 'Title', hint: 'e.g. "Log in to your account"' },
      { key: 'signinEmailPlaceholder', type: 'text', label: 'Email Input Placeholder', hint: 'e.g. "Enter your email"' },
      { key: 'signinContinueButtonText', type: 'text', label: 'Continue Button Text', hint: 'e.g. "Continue"' },
      { key: 'signinGoogleText', type: 'text', label: 'Continue with Google Button Text' },
      { key: 'signinSignupPromptText', type: 'text', label: 'Signup Prompt Text', hint: 'e.g. "Don\'t have an account?"' },
      { key: 'signinSignupLinkText', type: 'text', label: 'Signup Link Text', hint: 'e.g. "Sign up for free →"' },
    ],
  },
];

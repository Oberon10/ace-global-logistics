import React, { useState, useEffect } from 'react';
import { KNOWN_ACCOUNTS, USERS_LIST } from '../data/shipments';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Truck,
  Building2,
  KeyRound,
  Package,
  Globe2,
  X,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

// Helper to retrieve all registered customers (merging pre-configured accounts with localStorage)
export function getRegisteredCustomers() {
  let stored = [];
  try {
    const raw = localStorage.getItem('ace_registered_customers');
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse ace_registered_customers from storage', err);
  }

  const defaultCustomers = [
    ...KNOWN_ACCOUNTS.filter(a => a.role === 'customer'),
    ...USERS_LIST.filter(u => u.role?.toLowerCase() === 'customer').map(u => ({
      name: u.name,
      email: u.email,
      loginPassword: u.loginPassword,
      company: u.department || `${u.name}'s Enterprise`,
      phone: u.phone,
      role: 'customer'
    }))
  ];

  const customerMap = new Map();
  defaultCustomers.forEach(c => {
    if (c.email) {
      customerMap.set(c.email.trim().toLowerCase(), c);
    }
  });

  stored.forEach(c => {
    if (c.email) {
      customerMap.set(c.email.trim().toLowerCase(), c);
    }
  });

  return Array.from(customerMap.values());
}

export function saveRegisteredCustomer(newCustomer) {
  try {
    const raw = localStorage.getItem('ace_registered_customers');
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(c => c.email?.trim().toLowerCase() !== newCustomer.email?.trim().toLowerCase());
    filtered.push(newCustomer);
    localStorage.setItem('ace_registered_customers', JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to save customer to localStorage', err);
  }
}

// Helper to retrieve all admin-registered staff members
export function getRegisteredStaff() {
  let stored = [];
  try {
    const raw = localStorage.getItem('ace_registered_staff');
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse ace_registered_staff from storage', err);
  }

  const defaultStaff = [
    ...KNOWN_ACCOUNTS.filter(a => a.role === 'staff'),
    ...USERS_LIST.filter(u => u.role?.toLowerCase() === 'staff').map(u => ({
      name: u.name,
      email: u.email,
      loginPassword: u.loginPassword,
      department: u.department || 'Terminal Operations',
      phone: u.phone,
      status: u.status || 'Active',
      role: 'staff'
    }))
  ];

  const staffMap = new Map();
  defaultStaff.forEach(s => {
    if (s.email) {
      staffMap.set(s.email.trim().toLowerCase(), s);
    }
  });

  stored.forEach(s => {
    if (s.email) {
      staffMap.set(s.email.trim().toLowerCase(), s);
    }
  });

  return Array.from(staffMap.values());
}

export function saveRegisteredStaff(newStaff) {
  try {
    const raw = localStorage.getItem('ace_registered_staff');
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(s => s.email?.trim().toLowerCase() !== newStaff.email?.trim().toLowerCase());
    filtered.push(newStaff);
    localStorage.setItem('ace_registered_staff', JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to save staff to localStorage', err);
  }
}

export default function LoginView({ 
  onLoginSuccess, 
  setView, 
  initialPortal = 'customer',
  authNotice = '',
  theme = 'light',
  toggleTheme
}) {
  const [selectedPortal, setSelectedPortal] = useState(initialPortal); // 'customer', 'staff', 'admin'
  const [isRegister, setIsRegister] = useState(false);

  // Sync if initialPortal prop changes
  useEffect(() => {
    if (initialPortal) {
      setSelectedPortal(initialPortal);
      setIsRegister(false);
    }
  }, [initialPortal]);

  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Load remembered email on mount for customer portal
  useEffect(() => {
    const saved = localStorage.getItem('ace_remembered_email');
    if (saved && selectedPortal === 'customer') {
      setLoginEmail(saved);
      setRememberMe(true);
    }
  }, [selectedPortal]);

  // Staff specific fields
  const [staffStation, setStaffStation] = useState('ACC-T1 (Accra Central Air Hub)');

  // Admin specific fields
  const [adminToken, setAdminToken] = useState('');

  // Signup Fields (Customer registration)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [country, setCountry] = useState('Ghana');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [items, setItems] = useState('General Commercial Merchandise');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Handle portal switch
  const handlePortalSwitch = (portal) => {
    setSelectedPortal(portal);
    setIsRegister(false);
    setPasswordError('');
    if (portal === 'customer') {
      const saved = localStorage.getItem('ace_remembered_email');
      setLoginEmail(saved || '');
    } else {
      setLoginEmail('');
    }
    setLoginPassword('');
    setAdminToken('');
  };

  // Handle Log In Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = (loginEmail || '').trim().toLowerCase();
    const cleanPassword = (loginPassword || '').trim();

    if (!cleanEmail) {
      setPasswordError('Please enter your email address.');
      return;
    }

    if (!cleanPassword) {
      setPasswordError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setPasswordError('');

    // Pre-validate Admin Security Token if entered
    if (selectedPortal === 'admin') {
      if (adminToken && adminToken.trim() !== 'ACE-SEC-2026') {
        setIsSubmitting(false);
        setPasswordError('Invalid Hardware Security Token. Security clearance failed.');
        return;
      }
    }

    // Handle Remember Me storage
    if (rememberMe) {
      try { localStorage.setItem('ace_remembered_email', cleanEmail); } catch {}
    } else {
      try { localStorage.removeItem('ace_remembered_email'); } catch {}
    }

    // Attempt Backend Express API
    try {
      const backendUrl = `${getApiBase()}/api/auth/login`;

      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword, portal: selectedPortal })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.user) {
        const rawRole = (data.user.role || '').toLowerCase();
        const targetRole = (rawRole === 'dispatcher' || rawRole === 'driver' || rawRole === 'staff')
          ? 'staff'
          : (rawRole === 'admin')
          ? 'admin'
          : 'customer';

        // Enforce strict portal clearance
        if (selectedPortal === 'admin' && targetRole !== 'admin') {
          setIsSubmitting(false);
          setPasswordError('This account is not authorized to access this portal.');
          return;
        }

        if (selectedPortal === 'staff' && targetRole !== 'staff') {
          setIsSubmitting(false);
          setPasswordError('This account is not authorized to access this portal.');
          return;
        }

        if (selectedPortal === 'customer' && targetRole !== 'customer') {
          setIsSubmitting(false);
          setPasswordError('This account is not authorized to access this portal.');
          return;
        }

        if (data.token) {
          try { localStorage.setItem('ace_auth_token', data.token); } catch {}
        }

        setIsSubmitting(false);
        onLoginSuccess(targetRole, {
          ...data.user,
          role: targetRole,
          token: data.token,
          station: selectedPortal === 'staff' ? staffStation : undefined
        });
        return;
      } else {
        setIsSubmitting(false);
        if (res.status === 403) {
          setPasswordError(data?.message || 'This account is not authorized to access this portal.');
        } else {
          setPasswordError(data?.message || 'Your login details could not be verified. Please check your credentials and try again.');
        }
        return;
      }
    } catch (_err) {
      setIsSubmitting(false);
      setPasswordError('Cannot reach authentication server. Please check your network connection.');
      return;
    }
  };

  // Handle Sign Up Submit (Customer Registration)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (signupPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!agreeTerms) {
      setPasswordError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Valued Customer';
    const cleanEmail = signupEmail.trim().toLowerCase();

    try {
      const backendUrl = `${getApiBase()}/api/auth/register`;

      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: cleanEmail,
          password: signupPassword,
          role: 'CUSTOMER',
          country,
          phone: phoneNumber.trim(),
          items: items.trim()
        })
      });

      const data = await res.json().catch(() => null);

      if (res.status === 409) {
        setIsSubmitting(false);
        setPasswordError('An account with this email address already exists. Please log in instead.');
        return;
      }

      if (!res.ok) {
        setIsSubmitting(false);
        setPasswordError(data?.message || 'Registration failed. Please verify your details and try again.');
        return;
      }

      if (data?.token) {
        try { localStorage.setItem('ace_auth_token', data.token); } catch {}
      }

      const newCustomer = {
        id: data?.user?.id || data?.user?._id,
        _id: data?.user?._id || data?.user?.id,
        name: data?.user?.name || fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        company: data?.user?.company || `${firstName.trim() || 'Customer'}'s Enterprise`,
        country: data?.user?.country || country,
        phone: data?.user?.phone || phoneNumber.trim(),
        items: data?.user?.items || items.trim(),
        role: 'customer',
        token: data?.token,
        status: 'Active',
        registeredAt: new Date().toISOString()
      };

      if (rememberMe) {
        try { localStorage.setItem('ace_remembered_email', cleanEmail); } catch {}
      }

      setIsSubmitting(false);
      onLoginSuccess('customer', newCustomer);
      return;
    } catch (_err) {
      setIsSubmitting(false);
      setPasswordError('Cannot reach server. Please check your network connection.');
      return;
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSubmitted(true);
  };

  const handleBackToWebsite = () => {
    if (typeof setView === 'function') {
      setView('home');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Portal metadata with concise, professional wording
  const portalMeta = {
    customer: {
      title: 'Customer Login',
      description: 'Access your shipments, bookings, and tracking information.',
      badge: 'Customer Portal',
      icon: <User size={14} />,
      btnText: 'Log In',
      color: '#1683D8'
    },
    staff: {
      title: 'Staff Login',
      description: 'Access shipment operations and terminal management.',
      badge: 'Terminal Operations',
      icon: <Truck size={14} />,
      btnText: 'Sign In to Terminal',
      color: '#0D9488'
    },
    admin: {
      title: 'Admin Login',
      description: 'Manage platform operations and authorized accounts.',
      badge: 'Executive Console',
      icon: <Shield size={14} />,
      btnText: 'Sign In as Administrator',
      color: '#2563EB'
    }
  };

  const currentMeta = portalMeta[selectedPortal] || portalMeta.customer;

  return (
    <div className={`ace-auth-root ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      {/* Top Bar with Brand and Navigation */}
      <header className="ace-auth-header">
        <div className="ace-auth-header-inner">
          <div 
            className="ace-auth-brand" 
            onClick={handleBackToWebsite}
            title="Return to ACE Logistics Home"
          >
            <div className="ace-auth-logo-box">
              <img 
                src="/ace-emblem.png" 
                alt="ACE" 
                style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="ace-auth-brand-name">
              <span className="brand-primary">ACE</span>
              <span className="brand-secondary">LOGISTICS</span>
            </div>
          </div>

          <div className="ace-auth-header-actions">
            {typeof toggleTheme === 'function' && (
              <button 
                type="button" 
                onClick={toggleTheme} 
                className="ace-auth-icon-btn"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            <button 
              type="button" 
              onClick={handleBackToWebsite} 
              className="ace-auth-back-link"
              id="back-to-website-btn"
            >
              <ArrowLeft size={14} />
              <span>Back to Website</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="ace-auth-body">
        <div className={`ace-auth-card ${isRegister ? 'register-mode' : ''}`}>
          
          {/* Company Branding Lockup */}
          <div className="auth-brand-lockup">
            <div className="auth-emblem-wrap">
              <img 
                src="/ace-emblem.png" 
                alt="ACE Global Logistics" 
                className="auth-emblem-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span className="auth-company-label">ACE GLOBAL LOGISTICS</span>
          </div>

          {/* Unified Portal Selector Tabs */}
          {!isRegister && (
            <div className="auth-portal-tabs" role="tablist" aria-label="Authentication Portal Selector">
              <button
                type="button"
                className={`auth-portal-tab ${selectedPortal === 'customer' ? 'active' : ''}`}
                onClick={() => handlePortalSwitch('customer')}
                role="tab"
                aria-selected={selectedPortal === 'customer'}
                id="portal-tab-customer"
              >
                <User size={13} />
                <span>Customer</span>
              </button>
              <button
                type="button"
                className={`auth-portal-tab ${selectedPortal === 'staff' ? 'active' : ''}`}
                onClick={() => handlePortalSwitch('staff')}
                role="tab"
                aria-selected={selectedPortal === 'staff'}
                id="portal-tab-staff"
              >
                <Truck size={13} />
                <span>Staff</span>
              </button>
              <button
                type="button"
                className={`auth-portal-tab ${selectedPortal === 'admin' ? 'active' : ''}`}
                onClick={() => handlePortalSwitch('admin')}
                role="tab"
                aria-selected={selectedPortal === 'admin'}
                id="portal-tab-admin"
              >
                <Shield size={13} />
                <span>Admin</span>
              </button>
            </div>
          )}

          {/* Portal Title & Concise Professional Wording */}
          <div className="auth-heading-block">
            <h1 className="auth-title">
              {isRegister ? 'Create Customer Account' : currentMeta.title}
            </h1>
            <p className="auth-description">
              {isRegister 
                ? 'Register to book shipments and track freight worldwide.'
                : currentMeta.description}
            </p>
          </div>

          {/* Action Notice (if directed from send package or quote) */}
          {authNotice && (
            <div className="auth-alert-notice" role="alert">
              <Package size={15} style={{ flexShrink: 0 }} />
              <span>{authNotice}</span>
            </div>
          )}

          {/* Professional Error Message */}
          {passwordError && (
            <div className="auth-alert-error" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{passwordError}</span>
            </div>
          )}

          {/* =========================================================
              CUSTOMER REGISTRATION FORM
              ========================================================= */}
          {isRegister ? (
            <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
              <div className="auth-row-2">
                <div className="auth-field">
                  <label className="auth-label">First Name</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><User size={15} /></span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Last Name</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><User size={15} /></span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-box">
                  <span className="auth-input-icon"><Mail size={15} /></span>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-row-2">
                <div className="auth-field">
                  <label className="auth-label">Country</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><Globe2 size={15} /></span>
                    <select
                      className="auth-select"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    >
                      <option value="Ghana">Ghana</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="United States">United States</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="China">China</option>
                      <option value="Germany">Germany</option>
                      <option value="Canada">Canada</option>
                      <option value="South Africa">South Africa</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="International">Other / International</option>
                    </select>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Phone Number</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><Phone size={15} /></span>
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Business / Consignment Goods</label>
                <div className="auth-input-box">
                  <span className="auth-input-icon"><Package size={15} /></span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Commercial Merchandise, General Cargo"
                    value={items}
                    onChange={(e) => setItems(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-row-2">
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><Lock size={15} /></span>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Minimum 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="auth-pwd-toggle"
                      aria-label="Toggle password visibility"
                    >
                      {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><Lock size={15} /></span>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="auth-checkbox-label" style={{ marginBottom: '18px' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="auth-checkbox"
                />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-submit-btn"
                id="signup-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="ace-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="auth-footer-switch">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setPasswordError(''); }}
                  className="auth-switch-btn"
                >
                  Log In
                </button>
              </div>
            </form>
          ) : (
            /* =========================================================
                AUTHENTICATION LOGIN FORM (ALL 3 PORTALS)
                ========================================================= */
            <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
              
              {/* Email / Username Field */}
              <div className="auth-field">
                <label className="auth-label">
                  {selectedPortal === 'admin' 
                    ? 'Administrator Email' 
                    : selectedPortal === 'staff' 
                    ? 'Staff Email' 
                    : 'Email Address'}
                </label>
                <div className="auth-input-box">
                  <span className="auth-input-icon"><Mail size={15} /></span>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email address"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    required
                    autoComplete="email"
                    id="auth-email-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-field">
                <label className="auth-label">
                  {selectedPortal === 'admin' ? 'Administrative Passkey' : 'Password'}
                </label>
                <div className="auth-input-box">
                  <span className="auth-input-icon"><Lock size={15} /></span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    className="auth-input"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    id="auth-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="auth-pwd-toggle"
                    title={showLoginPassword ? 'Hide password' : 'View password'}
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Staff Operating Station Dropdown (Staff portal only) */}
              {selectedPortal === 'staff' && (
                <div className="auth-field">
                  <label className="auth-label">Operating Terminal</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><Building2 size={15} /></span>
                    <select
                      className="auth-select"
                      value={staffStation}
                      onChange={(e) => setStaffStation(e.target.value)}
                      id="staff-station-select"
                    >
                      <option value="ACC-T1 (Accra Central Air Hub)">ACC-T1 (Accra Central Air Hub)</option>
                      <option value="LHR-T4 (Heathrow Cargo Village)">LHR-T4 (Heathrow Cargo Village, London)</option>
                      <option value="RTM-P2 (Rotterdam Maritime Port)">RTM-P2 (Rotterdam Deep-Water Port)</option>
                      <option value="JFK-C7 (New York Intermodal)">JFK-C7 (JFK Intermodal Air Hub)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Admin Hardware Security Token (Admin portal only) */}
              {selectedPortal === 'admin' && (
                <div className="auth-field">
                  <label className="auth-label">Hardware Security Token</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><KeyRound size={15} /></span>
                    <input
                      type="text"
                      className="auth-input"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                      placeholder="Enter security token (optional)"
                      id="admin-token-input"
                    />
                  </div>
                </div>
              )}

              {/* Remember Me and Forgot Password Options */}
              <div className="auth-options-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                    id="remember-me-checkbox"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotSubmitted(false);
                    setForgotEmail(loginEmail || '');
                    setShowForgotModal(true);
                  }}
                  className="auth-forgot-btn"
                  id="forgot-password-btn"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Authentication Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-submit-btn"
                id="auth-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="ace-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{currentMeta.btnText}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Portal Specific Footer Navigation / Account Creation */}
              {selectedPortal === 'customer' ? (
                <div className="auth-footer-switch">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setPasswordError(''); }}
                    className="auth-switch-btn"
                    id="switch-to-register-btn"
                  >
                    Create Account
                  </button>
                </div>
              ) : (
                <div className="auth-security-notice">
                  <Lock size={12} />
                  <span>
                    {selectedPortal === 'staff' 
                      ? 'Authorized terminal staff only. All activity is audited.'
                      : 'Restricted console. Unauthorized access is strictly prohibited.'}
                  </span>
                </div>
              )}
            </form>
          )}

        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="auth-modal-close" 
              onClick={() => setShowForgotModal(false)}
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            <div className="auth-modal-icon">
              <Mail size={22} color="#1683D8" />
            </div>

            <h2 className="auth-modal-title">Reset Your Password</h2>
            <p className="auth-modal-desc">
              Enter your registered email address and we'll send you instructions to recover your account.
            </p>

            {forgotSubmitted ? (
              <div className="auth-modal-success">
                <div className="modal-success-badge">
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span>Instructions Dispatched</span>
                </div>
                <p className="modal-success-text">
                  If an account exists for <strong>{forgotEmail}</strong>, password reset instructions have been sent.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="auth-submit-btn"
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  Return to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ marginTop: '16px' }}>
                <div className="auth-field">
                  <label className="auth-label">Registered Email</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon"><Mail size={15} /></span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  Send Reset Instructions
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="auth-modal-cancel"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Embedded Component Styles */}
      <style>{`
        .ace-auth-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at 50% 12%, #0F2A48 0%, #071526 65%, #040E1B 100%);
          color: #0F172A;
          position: relative;
          box-sizing: border-box;
          font-family: inherit;
        }

        /* Subtle ambient lighting */
        .ace-auth-root::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 350px;
          background: radial-gradient(ellipse at center, rgba(22, 131, 216, 0.15) 0%, rgba(22, 131, 216, 0) 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Top Bar */
        .ace-auth-header {
          position: relative;
          z-index: 10;
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(7, 21, 38, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .ace-auth-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ace-auth-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .ace-auth-logo-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .ace-auth-brand-name {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .brand-primary {
          color: #FFFFFF;
        }

        .brand-secondary {
          color: #38BDF8;
        }

        .ace-auth-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ace-auth-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ace-auth-icon-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }

        .ace-auth-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #F1F5F9;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .ace-auth-back-link:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #FFFFFF;
        }

        /* Main Body Area */
        .ace-auth-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px 48px;
          position: relative;
          z-index: 2;
          box-sizing: border-box;
        }

        /* Compact, Professional Login Card */
        .ace-auth-card {
          width: 100%;
          max-width: 430px;
          background: #FFFFFF;
          border-radius: 16px;
          padding: 32px 28px 26px;
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06);
          box-sizing: border-box;
          transition: max-width 0.2s ease;
        }

        .ace-auth-card.register-mode {
          max-width: 480px;
        }

        /* Branding lockup inside card */
        .auth-brand-lockup {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 18px;
        }

        .auth-emblem-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .auth-emblem-img {
          width: 22px;
          height: 22px;
          object-fit: contain;
        }

        .auth-company-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #1683D8;
          text-transform: uppercase;
        }

        /* Portal Tabs Switcher */
        .auth-portal-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #F1F5F9;
          border-radius: 9px;
          margin-bottom: 20px;
        }

        .auth-portal-tab {
          flex: 1;
          height: 34px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .auth-portal-tab:hover {
          color: #1E293B;
        }

        .auth-portal-tab.active {
          background: #FFFFFF;
          color: #0F172A;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        /* Heading */
        .auth-heading-block {
          text-align: center;
          margin-bottom: 18px;
        }

        .auth-title {
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }

        .auth-description {
          font-size: 13px;
          color: #64748B;
          line-height: 1.45;
          margin: 0;
        }

        /* Alerts */
        .auth-alert-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #1D4ED8;
          font-size: 12.5px;
          line-height: 1.4;
          margin-bottom: 16px;
        }

        .auth-alert-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #B91C1C;
          font-size: 12.5px;
          line-height: 1.4;
          margin-bottom: 16px;
        }

        /* Form elements */
        .auth-form {
          display: flex;
          flex-direction: column;
        }

        .auth-field {
          margin-bottom: 14px;
        }

        .auth-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .auth-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 5px;
        }

        .auth-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .auth-input-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-input,
        .auth-select {
          width: 100%;
          height: 40px;
          padding: 0 12px 0 36px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13.5px;
          color: #0F172A;
          background: #FFFFFF;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          outline: none;
        }

        .auth-input:focus,
        .auth-select:focus {
          border-color: #1683D8;
          box-shadow: 0 0 0 3px rgba(22, 131, 216, 0.15);
        }

        .auth-input::placeholder {
          color: #94A3B8;
          font-size: 13px;
        }

        .auth-pwd-toggle {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .auth-pwd-toggle:hover {
          color: #475569;
        }

        /* Options Row */
        .auth-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 2px 0 18px;
          font-size: 12.5px;
        }

        .auth-checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          color: #475569;
          user-select: none;
          font-size: 12.5px;
        }

        .auth-checkbox {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          cursor: pointer;
          accent-color: #1683D8;
          margin: 0;
        }

        .auth-forgot-btn {
          background: none;
          border: none;
          color: #1683D8;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .auth-forgot-btn:hover {
          color: #0E70BD;
          text-decoration: underline;
        }

        /* Submit Button */
        .auth-submit-btn {
          width: 100%;
          height: 42px;
          border: none;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          color: #FFFFFF;
          background: #1683D8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.15s ease, transform 0.1s ease;
          box-shadow: 0 2px 6px rgba(22, 131, 216, 0.25);
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: #0E70BD;
        }

        .auth-submit-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .auth-submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        /* Footer switches & notices */
        .auth-footer-switch {
          margin-top: 16px;
          text-align: center;
          font-size: 12.5px;
          color: #64748B;
        }

        .auth-switch-btn {
          background: none;
          border: none;
          color: #1683D8;
          font-weight: 600;
          cursor: pointer;
          margin-left: 5px;
          padding: 0;
          font-size: 12.5px;
        }

        .auth-switch-btn:hover {
          text-decoration: underline;
        }

        .auth-security-notice {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #F1F5F9;
          font-size: 11px;
          color: #94A3B8;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* Modal Styles */
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 14, 27, 0.75);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .auth-modal-dialog {
          width: 100%;
          max-width: 380px;
          background: #FFFFFF;
          border-radius: 14px;
          padding: 24px;
          position: relative;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
          box-sizing: border-box;
        }

        .auth-modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #F1F5F9;
          border: none;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .auth-modal-close:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .auth-modal-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #EFF6FF;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .auth-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px;
        }

        .auth-modal-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.45;
          margin: 0 0 16px;
        }

        .auth-modal-cancel {
          width: 100%;
          height: 38px;
          background: transparent;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          margin-top: 8px;
        }

        .auth-modal-cancel:hover {
          background: #F8FAFC;
        }

        .auth-modal-success {
          text-align: center;
          padding: 10px 0;
        }

        .modal-success-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          background: #DCFCE7;
          color: #15803D;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .modal-success-text {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        /* Spinner */
        @keyframes ace-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* High-Contrast Dark Mode Overrides for Login View */
        [data-theme="dark"] .ace-auth-header,
        body.dark-mode .ace-auth-header {
          background: rgba(7, 20, 34, 0.88);
          border-bottom-color: rgba(255, 255, 255, 0.12);
        }

        [data-theme="dark"] .auth-logo-text,
        body.dark-mode .auth-logo-text {
          color: #FFFFFF !important;
        }

        [data-theme="dark"] .auth-header-btn,
        body.dark-mode .auth-header-btn {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.18);
          color: #E2E8F0;
        }

        [data-theme="dark"] .auth-header-btn:hover,
        body.dark-mode .auth-header-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #FFFFFF;
        }

        [data-theme="dark"] .ace-auth-card,
        body.dark-mode .ace-auth-card {
          background: #0E1A29 !important;
          border: 1px solid #1E3851 !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55) !important;
          color: #FFFFFF !important;
        }

        [data-theme="dark"] .auth-company-label,
        body.dark-mode .auth-company-label {
          color: #38BDF8 !important;
        }

        [data-theme="dark"] .auth-portal-tabs,
        body.dark-mode .auth-portal-tabs {
          background: #071422 !important;
          border: 1px solid #1E3851 !important;
        }

        [data-theme="dark"] .auth-portal-tab,
        body.dark-mode .auth-portal-tab {
          color: #94A3B8 !important;
        }

        [data-theme="dark"] .auth-portal-tab:hover,
        body.dark-mode .auth-portal-tab:hover {
          color: #FFFFFF !important;
        }

        [data-theme="dark"] .auth-portal-tab.active,
        body.dark-mode .auth-portal-tab.active {
          background: #1E3851 !important;
          color: #FFFFFF !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3) !important;
        }

        [data-theme="dark"] .auth-title,
        body.dark-mode .auth-title {
          color: #FFFFFF !important;
        }

        [data-theme="dark"] .auth-description,
        body.dark-mode .auth-description {
          color: #94A3B8 !important;
        }

        [data-theme="dark"] .auth-label,
        body.dark-mode .auth-label {
          color: #E2E8F0 !important;
        }

        [data-theme="dark"] .auth-input,
        body.dark-mode .auth-input {
          background: #071422 !important;
          color: #FFFFFF !important;
          border-color: #1E3851 !important;
        }

        [data-theme="dark"] .auth-input:focus,
        body.dark-mode .auth-input:focus {
          border-color: #38BDF8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2) !important;
        }

        [data-theme="dark"] .auth-input::placeholder,
        body.dark-mode .auth-input::placeholder {
          color: #64748B !important;
        }

        [data-theme="dark"] .auth-input-icon,
        body.dark-mode .auth-input-icon {
          color: #64748B !important;
        }

        [data-theme="dark"] .auth-password-toggle,
        body.dark-mode .auth-password-toggle {
          color: #64748B !important;
        }

        [data-theme="dark"] .auth-password-toggle:hover,
        body.dark-mode .auth-password-toggle:hover {
          color: #E2E8F0 !important;
        }

        [data-theme="dark"] .auth-remember-label,
        body.dark-mode .auth-remember-label {
          color: #CBD5E1 !important;
        }

        [data-theme="dark"] .auth-forgot-link,
        body.dark-mode .auth-forgot-link {
          color: #38BDF8 !important;
        }

        [data-theme="dark"] .auth-demo-badge,
        body.dark-mode .auth-demo-badge {
          background: #071422 !important;
          border-color: #1E3851 !important;
          color: #38BDF8 !important;
        }

        [data-theme="dark"] .auth-footer-note,
        body.dark-mode .auth-footer-note {
          border-top-color: #1E3851 !important;
          color: #64748B !important;
        }

        [data-theme="dark"] .auth-modal-dialog,
        body.dark-mode .auth-modal-dialog {
          background: #0E1A29 !important;
          border: 1px solid #1E3851 !important;
          color: #FFFFFF !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7) !important;
        }

        [data-theme="dark"] .auth-modal-title,
        body.dark-mode .auth-modal-title {
          color: #FFFFFF !important;
        }

        [data-theme="dark"] .auth-modal-desc,
        body.dark-mode .auth-modal-desc {
          color: #94A3B8 !important;
        }

        [data-theme="dark"] .auth-modal-close,
        body.dark-mode .auth-modal-close {
          background: #1E3851 !important;
          color: #E2E8F0 !important;
        }

        [data-theme="dark"] .auth-modal-cancel,
        body.dark-mode .auth-modal-cancel {
          background: #071422 !important;
          border-color: #1E3851 !important;
          color: #E2E8F0 !important;
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 480px) {
          .ace-auth-header-inner {
            padding: 10px 14px;
          }

          .ace-auth-body {
            padding: 16px 12px 32px;
          }

          .ace-auth-card {
            padding: 22px 18px 20px;
            border-radius: 14px;
          }

          .auth-title {
            font-size: 18.5px;
          }

          .auth-description {
            font-size: 12.5px;
          }

          .auth-row-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .auth-portal-tab {
            font-size: 12px;
            height: 32px;
          }
        }
      `}</style>
    </div>
  );
}

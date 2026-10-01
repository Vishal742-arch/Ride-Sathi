'use client';
import Link from 'next/link';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';

export function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {}
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/login';
    } catch {}
  };

  const navLinks = [
    { label: 'Find a ride', href: '/find' },
    { label: 'Offer a ride', href: '/offer' },
    { label: 'Safety', href: '/about' },
    { label: 'Help', href: '/rules' },
  ];

  const handleNavClick = (href: string) => {
    if (href === '/find') trackEvent('find_ride_clicked');
    if (href === '/offer') trackEvent('offer_ride_clicked');
  };

  return (
    <header className="site-header">
      <div className="shell nav-wrap">
        {/* LEFT: Logo & Brand Name */}
        <Link href="/" className="brand" aria-label="Ride With Me home">
          <img
            src="/favicon.svg"
            alt="Ride With Me Logo"
            className="brand-logo-img"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
          />
          <span>
            Ride <b>With Me</b>
          </span>
        </Link>

        {/* CENTER: Navigation Links */}
        <nav className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => handleNavClick(link.href)}>
              {link.label}
            </Link>
          ))}
          {user && (
            <Link href="/dashboard" className="font-bold text-emerald-700">
              Dashboard
            </Link>
          )}
        </nav>

        {/* RIGHT: Login & Get Started or Profile & Logout */}
        <div className="nav-actions">
          {user ? (
            <>
              <Link href="/dashboard" className="login-link flex items-center gap-1.5 font-bold">
                <User size={16} /> {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Dashboard'}
              </Link>
              <button onClick={handleLogout} className="ride-btn ride-btn-dark flex items-center gap-1 cursor-pointer">
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="login-link">
                Log in
              </Link>
              <Link href="/signup" className="ride-btn ride-btn-dark">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="menu-button" aria-label="Toggle navigation">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="mobile-nav shell">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                setOpen(false);
                handleNavClick(link.href);
              }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link onClick={() => setOpen(false)} href="/dashboard" className="login-link font-bold text-emerald-700">
                Dashboard ({user.user_metadata?.full_name || user.email?.split('@')[0]})
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="ride-btn ride-btn-primary"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link onClick={() => setOpen(false)} href="/login" className="login-link">
                Log in
              </Link>
              <Link onClick={() => setOpen(false)} href="/signup" className="ride-btn ride-btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}



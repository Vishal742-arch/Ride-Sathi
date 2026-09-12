import Link from 'next/link';
import { ArrowRight, BadgeCheck, Bike, Car, MapPin, ShieldCheck, WalletCards } from 'lucide-react';
import { HomeSearchCard } from '@/components/home-search-card';

const routes = [
  { from: 'Indore', to: 'Dewas', note: 'Shared intercity rides' },
  { from: 'Dewas', to: 'Indore', note: 'Travel back with ease' },
  { from: 'Indore', to: 'Ujjain', note: 'Popular intercity corridor' },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="kicker"><span className="live-dot" /> Indore · Dewas · Ujjain and beyond</span>
            <h1>Share the journey.<br /><em>Spend less.</em></h1>
            <p className="hero-text">
              Friendly, affordable carpooling for the places you already go.
              Find a verified ride or offer the empty seats in yours.
            </p>
            <div className="hero-actions">
              <Link href="/find" className="ride-btn ride-btn-primary">Find a ride <ArrowRight size={18} /></Link>
              <Link href="/offer" className="ride-btn ride-btn-light">Offer a ride</Link>
            </div>
            <div className="trust-row">
              <span><BadgeCheck size={18} /> Verified profiles</span>
              <span><WalletCards size={18} /> Clear fare display</span>
            </div>
          </div>

          {/* Interactive search card — replaces the static route-card */}
          <HomeSearchCard />
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading">
          <div>
            <span className="kicker">SIMPLE &amp; FAIR</span>
            <h2>Travel together, your way.</h2>
          </div>
          <p>Whether it is a quick city trip or the Indore–Dewas corridor, choose the ride that fits the day.</p>
        </div>
        <div className="service-grid">
          <article className="service-card">
            <div className="service-icon mint"><Bike /></div>
            <h3>Bike share</h3>
            <p>For quick solo hops and everyday local trips.</p>
            <b>From ₹2.50 <small>/ km</small></b>
          </article>
          <article className="service-card featured">
            <div className="service-icon yellow"><Car /></div>
            <h3>Carpool</h3>
            <p>Share seats, costs and good conversation.</p>
            <b>From ₹4.50 <small>/ km</small></b>
          </article>
          <article className="service-card">
            <div className="service-icon peach"><MapPin /></div>
            <h3>Nearby routes</h3>
            <p>Pick up locally and travel farther together.</p>
            <b>Local &amp; intercity</b>
          </article>
        </div>
      </section>

      <section className="route-band">
        <div className="shell">
          <span className="kicker">POPULAR RIGHT NOW</span>
          <div className="popular-grid">
            {routes.map(route => (
              <Link href="/find" className="popular-route" key={`${route.from}-${route.to}`}>
                <div>
                  <span>{route.from}</span>
                  <ArrowRight size={18} />
                  <span>{route.to}</span>
                </div>
                <p>{route.note}</p>
                <i>Explore route →</i>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="shell section safety-section">
        <div className="safety-art">
          <div className="safety-orb"><ShieldCheck size={86} /></div>
          <div className="mini-card"><BadgeCheck size={20} /> Identity checked</div>
        </div>
        <div>
          <span className="kicker">BUILT AROUND TRUST</span>
          <h2>Good rides begin with confidence.</h2>
          <p>
            Ride With Me is designed around transparent profiles, clear ride details,
            and checks that are shown only when they are actually complete.
          </p>
          <ul>
            <li><BadgeCheck /> Phone and identity verification</li>
            <li><BadgeCheck /> Driver and vehicle review</li>
            <li><BadgeCheck /> Clear fare transparency</li>
          </ul>
          <Link href="/about" className="text-link">How safety works <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="shell cta">
        <div>
          <span className="kicker">READY WHEN YOU ARE</span>
          <h2>One empty seat can make a difference.</h2>
          <p>Find your next shared ride in just a few taps.</p>
        </div>
        <Link href="/find" className="ride-btn ride-btn-dark">Find a ride <ArrowRight size={18} /></Link>
      </section>
    </main>
  );
}

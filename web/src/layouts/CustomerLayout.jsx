import { Outlet } from 'react-router-dom';
import {
  Bot,
  FileClock,
  Home,
  MapPin,
  PackagePlus,
  User,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileNav from '../components/MobileNav';
import AssistantLauncher from '../components/AssistantLauncher';
import Footer from '../components/Footer';
import { useChannelSync } from '../hooks/useChannel';
import './layouts.css';

/** Desktop header links. */
const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ship', label: 'Shipping' },
  { to: '/track', label: 'Tracking' },
  { to: '/drafts', label: 'Drafts' },
  { to: '/shipments', label: 'Shipments' },
  { to: '/assistant', label: 'AI Assistant' },
];

/**
 * Mobile bottom tabs.
 *
 * A deliberately different set from the desktop header: the six destinations
 * a customer moves between on a phone, ordered by how often they are used.
 */
const MOBILE_TABS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/ship', label: 'Ship', icon: PackagePlus },
  { to: '/track', label: 'Track', icon: MapPin },
  { to: '/drafts', label: 'Drafts', icon: FileClock },
  { to: '/assistant', label: 'AI', icon: Bot },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function CustomerLayout() {
  // Report the real viewport as the channel so lastChannel stays honest.
  useChannelSync();

  return (
    <div className="layout layout--customer">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <Navbar links={NAV_LINKS} variant="customer" />

      <main id="main" className="layout__main" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
      <MobileNav items={MOBILE_TABS} />
      <AssistantLauncher />
    </div>
  );
}

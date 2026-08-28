import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Truck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useChannelSync } from '../hooks/useChannel';
import './layouts.css';

/**
 * Admin shell.
 *
 * Deliberately a different environment from the customer app: a persistent
 * operations sidebar, no shipping or assistant entry points, and none of the
 * customer navigation. The guard on these routes is a UX convenience - the
 * Express API independently enforces requireAdmin on every endpoint below.
 */
const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/vehicles', label: 'Vehicles', icon: Truck },
];

export default function AdminLayout() {
  useChannelSync();

  return (
    <div className="layout layout--admin">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <Navbar
        links={ADMIN_LINKS.map(({ to, label, end }) => ({ to, label, end }))}
        variant="admin"
      />

      <div className="admin-shell container">
        <aside className="admin-sidebar" aria-label="Admin sections">
          <p className="admin-sidebar__label">Operations</p>
          <nav>
            <ul className="admin-sidebar__list">
              {ADMIN_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `admin-sidebar__link ${isActive ? 'is-active' : ''}`
                      }
                    >
                      <Icon size={17} aria-hidden="true" />
                      {link.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main id="main" className="admin-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

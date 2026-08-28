import { useCallback, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, HeadphonesIcon, LogOut, Search, User } from 'lucide-react';
import Logo from './Logo';
import NotificationsMenu from './NotificationsMenu';
import { useAuth } from '../hooks/useAuth';
import { useDismissable } from '../hooks/useDismissable';
import { initials } from '../utils/format';
import './Navbar.css';

/**
 * Primary navigation: a slim utility strip over a white main bar.
 *
 * On viewports below the tablet breakpoint the link row is hidden and
 * MobileNav takes over with bottom tabs, so the header stays to the brand,
 * notifications and the account menu.
 */
export default function Navbar({ links = [], variant = 'customer' }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismissable(menuRef, menuOpen, closeMenu);

  function handleSignOut() {
    closeMenu();
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="navbar">
      {/* Utility strip - quiet, secondary destinations. */}
      <div className="navbar__utility">
        <div className="container navbar__utility-inner">
          <span className="navbar__utility-brand">
            {variant === 'admin' ? 'Operations console' : 'One Logistics Experience'}
          </span>
          <div className="navbar__utility-links">
            <Link to="/track" className="navbar__utility-link">
              <Search size={13} aria-hidden="true" />
              Track a shipment
            </Link>
            <Link to="/assistant" className="navbar__utility-link">
              <HeadphonesIcon size={13} aria-hidden="true" />
              Support
            </Link>
          </div>
        </div>
      </div>

      {/* Main white bar. */}
      <div className="navbar__main">
        <div className="container navbar__inner">
          <Logo to={variant === 'admin' ? '/admin' : '/dashboard'} />

          <nav className="navbar__links" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'is-active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar__actions">
            {variant === 'customer' && <NotificationsMenu />}

            <div className="navbar__account" ref={menuRef}>
              <button
                type="button"
                className="navbar__account-trigger"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="navbar__avatar" aria-hidden="true">
                  {initials(user?.name)}
                </span>
                <span className="navbar__account-name">{user?.name || 'Account'}</span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className="navbar__menu" role="menu">
                  <div className="navbar__menu-head">
                    <p className="navbar__menu-name">{user?.name}</p>
                    <p className="navbar__menu-email">{user?.email}</p>
                    {user?.role === 'admin' && (
                      <span className="navbar__menu-role">Administrator</span>
                    )}
                  </div>

                  <Link
                    to={user?.role === 'admin' ? '/admin/profile' : '/profile'}
                    className="navbar__menu-item"
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    <User size={16} aria-hidden="true" />
                    Profile
                  </Link>

                  <button
                    type="button"
                    className="navbar__menu-item navbar__menu-item--danger"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

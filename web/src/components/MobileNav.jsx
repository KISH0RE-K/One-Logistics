import { NavLink } from 'react-router-dom';
import './MobileNav.css';

/**
 * Bottom tab bar for the mobile web layout.
 *
 * This is not the desktop nav made smaller - it is a thumb-reachable tab bar
 * with its own information architecture (the six destinations a customer
 * actually moves between), safe-area padding for notched devices, and 56px
 * touch targets.
 */
export default function MobileNav({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="mobile-nav" aria-label="Primary">
      <ul className="mobile-nav__list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="mobile-nav__item">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? 'is-active' : ''}`
                }
              >
                <Icon className="mobile-nav__icon" size={21} aria-hidden="true" />
                <span className="mobile-nav__label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

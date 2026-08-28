import { Outlet } from 'react-router-dom';
import { Boxes, Route, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import './layouts.css';

/**
 * Split authentication shell: a deep brown brand panel beside the form card.
 *
 * The brand panel is decorative and collapses away below the tablet
 * breakpoint so the form gets the whole screen on a phone.
 */
const POINTS = [
  {
    icon: Route,
    title: 'One experience, every device',
    body: 'Start a shipment on the web and finish it on your phone. Your drafts follow you.',
  },
  {
    icon: Boxes,
    title: 'Recommended routing',
    body: 'Compare road, rail and air on real cost and transit-time estimates before you book.',
  },
  {
    icon: ShieldCheck,
    title: 'Tracked end to end',
    body: 'Every shipment carries a full timeline, from booking through to delivery.',
  },
];

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-brand on-dark" aria-hidden="true">
        <div className="auth-brand__inner">
          <Logo to={null} tone="light" size="lg" />

          <div>
            <h2 className="auth-brand__headline">
              Ship smarter.
              <br />
              Track seamlessly.
            </h2>
            <p className="auth-brand__lede">
              The logistics platform that keeps every shipment, draft and
              conversation in one place.
            </p>
          </div>

          <ul className="auth-brand__points">
            {POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.title} className="auth-brand__point">
                  <span className="auth-brand__point-icon">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="auth-brand__point-title">{point.title}</p>
                    <p className="auth-brand__point-body">{point.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <main className="auth-main" id="main">
        <div className="auth-main__inner">
          <div className="auth-main__logo">
            <Logo to={null} size="md" />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

/**
 * Site footer. Sits on the deep brown surface that anchors the page, matching
 * the reference language of brown section backgrounds under white content.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer on-dark">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo to={null} tone="light" />
          <p className="footer__blurb">
            A demonstration logistics platform - shipment booking, tracking and
            fleet operations in one experience.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          <div className="footer__group">
            <p className="footer__group-title">Shipping</p>
            <Link to="/ship">Create a shipment</Link>
            <Link to="/drafts">Saved drafts</Link>
            <Link to="/shipments">My shipments</Link>
          </div>

          <div className="footer__group">
            <p className="footer__group-title">Tracking</p>
            <Link to="/track">Track a shipment</Link>
            <Link to="/shipments/history">Shipment history</Link>
          </div>

          <div className="footer__group">
            <p className="footer__group-title">Support</p>
            <Link to="/assistant">AI assistant</Link>
            <Link to="/profile">Your profile</Link>
          </div>
        </nav>
      </div>

      <div className="container footer__base">
        <p>&copy; {year} One Logistics Experience. Demonstration project.</p>
        <p className="footer__note">
          Not affiliated with any commercial carrier.
        </p>
      </div>
    </footer>
  );
}

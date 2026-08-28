import { useNavigate } from 'react-router-dom';
import { Compass, MoveLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  useDocumentTitle('Page not found');

  const home = !isAuthenticated ? '/login' : isAdmin ? '/admin' : '/dashboard';

  return (
    <main className="notfound" id="main">
      <Logo to={null} size="lg" />

      <div className="notfound__body">
        <span className="notfound__icon" aria-hidden="true">
          <Compass size={26} />
        </span>
        <h1 className="notfound__title">This page has gone off route</h1>
        <p className="notfound__message">
          The page you were looking for does not exist, or it may have moved.
        </p>
      </div>

      <div className="notfound__actions">
        <Button variant="primary" to={home}>
          Back to {isAdmin ? 'the console' : 'your dashboard'}
        </Button>
        <Button variant="ghost" iconLeft={MoveLeft} onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    </main>
  );
}

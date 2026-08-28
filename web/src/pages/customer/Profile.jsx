import { useNavigate } from 'react-router-dom';
import { Info, LogOut, Mail, ShieldCheck, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, initials } from '../../utils/format';
import './profile.css';

/**
 * Account profile.
 *
 * Read-only: the Express API exposes no profile-update route (there is no
 * PUT /api/auth/me), so no edit form is offered that could not actually
 * save. The fields are shown as they come from GET /api/auth/me.
 */
export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('Profile');

  function handleSignOut() {
    signOut();
    toast.info('You have been signed out.');
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="container page profile">
      <header className="page-header">
        <h1 className="page-title">Your profile</h1>
        <p className="page-subtitle">Your account details and session.</p>
      </header>

      <Card padding="lg" className="profile__card">
        <div className="profile__identity">
          <span className="profile__avatar" aria-hidden="true">
            {initials(user.name)}
          </span>
          <div>
            <h2 className="profile__name">{user.name}</h2>
            <p className="profile__email">{user.email}</p>
            <Badge tone={isAdmin ? 'gold' : 'neutral'} size="sm">
              {isAdmin ? 'Administrator' : 'Customer'}
            </Badge>
          </div>
        </div>

        <dl className="profile__facts">
          <div className="profile__fact">
            <dt>
              <User size={14} aria-hidden="true" /> Name
            </dt>
            <dd>{user.name}</dd>
          </div>
          <div className="profile__fact">
            <dt>
              <Mail size={14} aria-hidden="true" /> Email
            </dt>
            <dd>{user.email}</dd>
          </div>
          <div className="profile__fact">
            <dt>
              <ShieldCheck size={14} aria-hidden="true" /> Role
            </dt>
            <dd className="profile__capitalize">{user.role}</dd>
          </div>
          {user.createdAt && (
            <div className="profile__fact">
              <dt>Member since</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          )}
        </dl>

        <p className="profile__note">
          <Info size={15} aria-hidden="true" />
          <span>
            Profile editing is not available yet - the API has no
            profile-update endpoint. Your details are shown exactly as the
            account holds them.
          </span>
        </p>
      </Card>

      <Card padding="lg" className="profile__session">
        <div>
          <h2 className="profile__session-title">Session</h2>
          <p className="profile__session-copy">
            Signing out clears your access token from this device. Your
            shipments and drafts stay on your account.
          </p>
        </div>
        <Button variant="outline" iconLeft={LogOut} onClick={handleSignOut}>
          Log out
        </Button>
      </Card>
    </div>
  );
}

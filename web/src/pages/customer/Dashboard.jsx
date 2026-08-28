import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  FileClock,
  History,
  MapPin,
  Monitor,
  PackagePlus,
  Smartphone,
  Truck,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Skeleton from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getActiveShipments, getDrafts, getShipments } from '../../api/shipmentApi';
import { channelLabel, draftProgress, statusMeta } from '../../utils/shipment';
import { formatDuration, formatRelative } from '../../utils/format';
import './dashboard.css';

/**
 * Customer home.
 *
 * Loads active shipments, drafts and history in parallel. Each panel renders
 * its own skeleton so a slow request never blanks the whole page, and every
 * figure shown is a count of real documents.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Dashboard');

  const active = useAsync(getActiveShipments, []);
  const drafts = useAsync(getDrafts, []);
  const history = useAsync(() => getShipments(), []);

  const isLoading = active.isLoading || drafts.isLoading || history.isLoading;

  const latestDraft = useMemo(() => {
    if (!drafts.data?.length) return null;
    return [...drafts.data].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    )[0];
  }, [drafts.data]);

  const completed = useMemo(
    () =>
      (history.data || []).filter((s) =>
        ['delivered', 'cancelled'].includes(s.status)
      ),
    [history.data]
  );

  const recentActive = active.data?.[0] || null;
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Every request failed - the API is very likely unreachable.
  const allFailed = active.error && drafts.error && history.error;

  function continueDraft(draft) {
    navigate(`/ship?draft=${draft._id}`);
  }

  return (
    <>
      {/* -- Hero -------------------------------------------------------- */}
      <section className="hero on-dark">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="hero__eyebrow">Welcome back, {firstName}</p>
            <h1 className="hero__title">
              Ship smarter.
              <br />
              Track seamlessly.
            </h1>
            <p className="hero__lede">
              Book a shipment, compare road, rail and air, and follow every
              parcel from pickup to doorstep - on whichever device you happen to
              have open.
            </p>

            <div className="hero__actions">
              <Button size="lg" to="/ship" iconLeft={PackagePlus}>
                Create shipment
              </Button>
              <Button size="lg" variant="outline" to="/track" iconLeft={MapPin}>
                Track shipment
              </Button>
            </div>
          </div>

          <div className="hero__panel">
            <p className="hero__panel-label">At a glance</p>
            <div className="hero__stats">
              <HeroStat
                label="Active"
                value={active.data?.length}
                isLoading={active.isLoading}
                hasError={Boolean(active.error)}
              />
              <HeroStat
                label="Drafts"
                value={drafts.data?.length}
                isLoading={drafts.isLoading}
                hasError={Boolean(drafts.error)}
              />
              <HeroStat
                label="Completed"
                value={completed.length}
                isLoading={history.isLoading}
                hasError={Boolean(history.error)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container page">
        {allFailed && !isLoading && (
          <div className="dashboard__error">
            <ErrorState
              error={active.error}
              onRetry={() => {
                active.reload();
                drafts.reload();
                history.reload();
              }}
            />
          </div>
        )}

        {/* -- Continue where you left off ------------------------------- */}
        {latestDraft && (
          <section className="continue" aria-labelledby="continue-heading">
            <Card tone="gold" padding="lg" className="continue__card">
              <div className="continue__body">
                <div className="continue__meta">
                  <p className="section-label">Continue where you left off</p>
                  <h2 className="continue__route" id="continue-heading">
                    {latestDraft.from || 'Pickup not set'}
                    <ArrowRight size={20} aria-hidden="true" />
                    {latestDraft.to || 'Delivery not set'}
                  </h2>

                  <p className="continue__channel">
                    {latestDraft.lastChannel === 'mobile' ? (
                      <Smartphone size={14} aria-hidden="true" />
                    ) : (
                      <Monitor size={14} aria-hidden="true" />
                    )}
                    Started on {channelLabel(latestDraft.lastChannel)} ·{' '}
                    {formatRelative(latestDraft.updatedAt || latestDraft.createdAt)}
                  </p>
                </div>

                <div className="continue__progress">
                  <ProgressBar
                    value={draftProgress(latestDraft)}
                    label="Booking progress"
                  />
                </div>
              </div>

              <div className="continue__actions">
                <Button size="lg" onClick={() => continueDraft(latestDraft)} iconRight={ArrowRight}>
                  Continue shipment
                </Button>
                <Button variant="ghost" to="/drafts">
                  All drafts ({drafts.data?.length ?? 0})
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* -- Dashboard cards ------------------------------------------- */}
        <section className="dash-grid" aria-label="Your logistics summary">
          {/* Active shipments */}
          <Card as="section" padding="lg" className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card__icon" aria-hidden="true">
                <Truck size={19} />
              </span>
              <div>
                <h2 className="dash-card__title">Active shipments</h2>
                <p className="dash-card__sub">In transit or awaiting pickup</p>
              </div>
            </div>

            {active.isLoading ? (
              <DashSkeleton />
            ) : active.error ? (
              <p className="dash-card__error">Could not load your shipments.</p>
            ) : (
              <>
                <p className="dash-card__figure">{active.data.length}</p>

                {recentActive ? (
                  <div className="dash-card__detail">
                    <p className="dash-card__detail-label">Most recent</p>
                    <p className="dash-card__detail-value mono">
                      {recentActive.trackingNumber}
                    </p>
                    <div className="dash-card__detail-row">
                      <StatusBadge status={recentActive.status} size="sm" />
                      <span className="dash-card__detail-muted">
                        {statusMeta(recentActive.status).description}
                      </span>
                    </div>
                    <p className="dash-card__detail-muted">
                      {recentActive.from} to {recentActive.to} ·{' '}
                      {formatDuration(recentActive.estimatedTime)}
                    </p>
                  </div>
                ) : (
                  <p className="dash-card__empty">
                    You have no shipments in transit right now.
                  </p>
                )}

                <div className="dash-card__foot">
                  <Button variant="outline" size="sm" to="/shipments" iconRight={ArrowRight}>
                    {recentActive ? 'View active shipments' : 'Create a shipment'}
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Saved drafts */}
          <Card as="section" padding="lg" className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card__icon" aria-hidden="true">
                <FileClock size={19} />
              </span>
              <div>
                <h2 className="dash-card__title">Saved drafts</h2>
                <p className="dash-card__sub">Unfinished bookings</p>
              </div>
            </div>

            {drafts.isLoading ? (
              <DashSkeleton />
            ) : drafts.error ? (
              <p className="dash-card__error">Could not load your drafts.</p>
            ) : (
              <>
                <p className="dash-card__figure">{drafts.data.length}</p>

                {latestDraft ? (
                  <div className="dash-card__detail">
                    <p className="dash-card__detail-label">Most recent</p>
                    <p className="dash-card__detail-value">
                      {latestDraft.from || 'Pickup not set'} to{' '}
                      {latestDraft.to || 'delivery not set'}
                    </p>
                    <p className="dash-card__detail-muted">
                      {draftProgress(latestDraft)}% complete · last edited on{' '}
                      {channelLabel(latestDraft.lastChannel)}
                    </p>
                  </div>
                ) : (
                  <p className="dash-card__empty">No saved drafts.</p>
                )}

                <div className="dash-card__foot">
                  {latestDraft ? (
                    <Button size="sm" onClick={() => continueDraft(latestDraft)}>
                      Continue
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" to="/ship">
                      Start a shipment
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>

          {/* History */}
          <Card as="section" padding="lg" className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card__icon" aria-hidden="true">
                <History size={19} />
              </span>
              <div>
                <h2 className="dash-card__title">Shipment history</h2>
                <p className="dash-card__sub">Delivered and cancelled</p>
              </div>
            </div>

            {history.isLoading ? (
              <DashSkeleton />
            ) : history.error ? (
              <p className="dash-card__error">Could not load your history.</p>
            ) : (
              <>
                <p className="dash-card__figure">{completed.length}</p>

                {completed.length ? (
                  <ul className="dash-card__list">
                    {completed.slice(0, 3).map((shipment) => (
                      <li key={shipment._id} className="dash-card__list-item">
                        <span className="mono dash-card__list-code">
                          {shipment.trackingNumber}
                        </span>
                        <StatusBadge status={shipment.status} size="sm" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dash-card__empty">
                    Completed shipments will appear here.
                  </p>
                )}

                <div className="dash-card__foot">
                  <Button
                    variant="outline"
                    size="sm"
                    to="/shipments/history"
                    iconRight={ArrowRight}
                  >
                    View history
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Assistant */}
          <Card as="section" tone="dark" padding="lg" className="dash-card dash-card--assistant">
            <div className="dash-card__head">
              <span className="dash-card__icon dash-card__icon--gold" aria-hidden="true">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="dash-card__title">AI assistant</h2>
                <p className="dash-card__sub">Ask about anything you ship</p>
              </div>
            </div>

            <p className="dash-card__assistant-copy">
              Track a parcel, pick up a saved draft, or compare road, rail and
              air without leaving the conversation.
            </p>

            <div className="dash-card__foot">
              <Button size="sm" to="/assistant" iconRight={ArrowRight}>
                Open assistant
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

function HeroStat({ label, value, isLoading, hasError }) {
  return (
    <div className="hero__stat">
      <span className="hero__stat-label">{label}</span>
      {isLoading ? (
        <Skeleton width={38} height={30} />
      ) : (
        <span className="hero__stat-value">{hasError ? '—' : (value ?? 0)}</span>
      )}
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="dash-card__skeleton" aria-busy="true">
      <Skeleton width={64} height={44} />
      <Skeleton width="80%" height={14} />
      <Skeleton width="55%" height={14} />
    </div>
  );
}

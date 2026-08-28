import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { EmptyState, ErrorState } from '../../components/ui/States';
import Skeleton from '../../components/ui/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getAuditLogs } from '../../api/adminApi';
import { formatDateTime, humanizeAction } from '../../utils/format';
import './admin.css';

/** The action vocabulary the backend's AuditLog enum accepts. */
const ACTIONS = [
  'LOGIN',
  'REGISTER',
  'CREATE_SHIPMENT',
  'UPDATE_SHIPMENT',
  'CANCEL_SHIPMENT',
  'DELETE_SHIPMENT',
  'SAVE_DRAFT',
  'RESUME_DRAFT',
  'DELETE_DRAFT',
  'CREATE_VEHICLE',
  'UPDATE_VEHICLE',
  'CHATBOT_REQUEST',
  'GET_RECOMMENDATION',
  'VIEW_SHIPMENT',
];

const TONE = {
  LOGIN: 'info',
  REGISTER: 'info',
  CREATE_SHIPMENT: 'success',
  CREATE_VEHICLE: 'success',
  CANCEL_SHIPMENT: 'danger',
  DELETE_SHIPMENT: 'danger',
  DELETE_DRAFT: 'danger',
  CHATBOT_REQUEST: 'warning',
};

const PAGE_SIZE = 25;

/**
 * Audit log viewer.
 *
 * Read-only by design: the backend exposes no mutation route for audit
 * records, and an audit trail an administrator could edit would be worthless.
 * Action filtering and pagination are both done server-side, since the API
 * supports `action`, `page` and `limit` query parameters.
 *
 * The free-text box filters the current page in the browser - the backend has
 * no search parameter, so it is labelled as filtering this page rather than
 * pretending to search the whole log.
 */
export default function AuditLogs() {
  useDocumentTitle('Audit logs');

  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, error, isLoading, reload } = useAsync(
    () => getAuditLogs({ action: action || undefined, page, limit: PAGE_SIZE }),
    [action, page]
  );

  // Changing the filter invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [action]);

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total ?? 0;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => {
      const haystack = [
        log.action,
        log.resource,
        log.resourceId,
        log.userId?.name,
        log.userId?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [logs, search]);

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Audit logs</h1>
        <p className="page-subtitle">
          Every significant action recorded by the platform. Read-only - audit
          records cannot be edited or removed.
        </p>
      </header>

      {/* -- Controls ------------------------------------------------------- */}
      <Card padding="md" className="admin-filters">
        <Select
          label="Action"
          options={ACTIONS.map((a) => ({ value: a, label: humanizeAction(a) }))}
          placeholder="All actions"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          containerClassName="admin-filters__field"
        />

        <Input
          label="Filter this page"
          placeholder="User, resource or ID"
          iconLeft={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          hint="Filters the rows shown below."
          containerClassName="admin-filters__field"
        />

        {(action || search) && (
          <Button
            variant="ghost"
            onClick={() => {
              setAction('');
              setSearch('');
            }}
          >
            Clear
          </Button>
        )}
      </Card>

      {error && <ErrorState error={error} onRetry={reload} />}

      {isLoading && (
        <Card padding="none" className="table-card">
          <div className="audit-skeleton" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={20} />
            ))}
          </div>
        </Card>
      )}

      {!isLoading && !error && total === 0 && (
        <EmptyState
          icon={ScrollText}
          title="No audit records yet"
          message="Actions such as sign-ins, bookings and vehicle changes will be recorded here automatically."
        />
      )}

      {!isLoading && !error && total > 0 && (
        <>
          <p className="list-count">
            {total} record{total === 1 ? '' : 's'}
            {action ? ` for ${humanizeAction(action)}` : ''} · page {page} of{' '}
            {totalPages}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nothing on this page matches"
              message="Clear the filter, or move to another page."
            />
          ) : (
            <Card padding="none" className="table-card">
              <div className="scroll-x">
                <table className="data-table">
                  <caption className="sr-only">Audit log records</caption>
                  <thead>
                    <tr>
                      <th scope="col">Timestamp</th>
                      <th scope="col">User</th>
                      <th scope="col">Action</th>
                      <th scope="col">Resource</th>
                      <th scope="col">Resource ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((log) => (
                      <tr key={log._id}>
                        <td className="data-table__nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td>
                          {log.userId ? (
                            <>
                              <span className="data-table__strong">
                                {log.userId.name}
                              </span>
                              <span className="data-table__sub">
                                {log.userId.email}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted">Unknown user</span>
                          )}
                        </td>
                        <td>
                          <Badge tone={TONE[log.action] || 'neutral'} size="sm">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="data-table__capitalize">{log.resource}</td>
                        <td className="mono data-table__id">
                          {log.resourceId || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination - server-side, via the API's page/limit params. */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Audit log pages">
              <Button
                variant="outline"
                size="sm"
                iconLeft={ChevronLeft}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>

              <span className="pagination__status" aria-live="polite">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                iconRight={ChevronRight}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  );
}

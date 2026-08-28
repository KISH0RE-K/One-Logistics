import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileClock, PackagePlus } from 'lucide-react';
import DraftCard from '../../components/DraftCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getDrafts, deleteShipment } from '../../api/shipmentApi';
import './lists.css';

/**
 * Saved drafts.
 *
 * The list is the same on every device because it comes from MongoDB, and
 * each card states which channel it was last edited on - the visible half of
 * the cross-device story.
 */
export default function Drafts() {
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('Saved drafts');

  const { data: drafts, error, isLoading, reload } = useAsync(getDrafts, []);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function continueDraft(draft) {
    navigate(`/ship?draft=${draft._id}`);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setIsDeleting(true);
    try {
      await deleteShipment(pendingDelete._id);
      toast.success('Draft deleted.');
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  const sorted = [...(drafts || [])].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );

  return (
    <div className="container page">
      <header className="page-header list-header">
        <div>
          <h1 className="page-title">Saved drafts</h1>
          <p className="page-subtitle">
            Unfinished bookings, waiting wherever you left them. Open a draft on
            any device and carry on from the same step.
          </p>
        </div>

        <Button to="/ship" iconLeft={PackagePlus}>
          New shipment
        </Button>
      </header>

      {isLoading && <LoadingState label="Loading your drafts" count={3} />}

      {!isLoading && error && <ErrorState error={error} onRetry={reload} />}

      {!isLoading && !error && sorted.length === 0 && (
        <EmptyState
          icon={FileClock}
          title="No saved drafts."
          message="When you save a shipment part-way through, it will appear here so you can finish it later - on this device or another."
          action={
            <Button to="/ship" iconLeft={PackagePlus}>
              Create a shipment
            </Button>
          }
        />
      )}

      {!isLoading && !error && sorted.length > 0 && (
        <>
          <Card tone="sunken" padding="md" className="cross-channel-note">
            <p>
              <strong>One experience, every device.</strong> These drafts live
              with your account, not on this device - sign in on your phone and
              the same list appears.
            </p>
          </Card>

          <div className="card-grid">
            {sorted.map((draft) => (
              <DraftCard
                key={draft._id}
                draft={draft}
                onContinue={continueDraft}
                onDelete={setPendingDelete}
                isDeleting={isDeleting && pendingDelete?._id === draft._id}
              />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete this draft?"
        message={
          pendingDelete
            ? `The draft for ${pendingDelete.from || 'an unset pickup'} to ${
                pendingDelete.to || 'an unset destination'
              } will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete draft"
        cancelLabel="Keep draft"
      />
    </div>
  );
}

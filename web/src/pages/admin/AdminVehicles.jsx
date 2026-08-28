import { useState } from 'react';
import { Pencil, Plus, Search, Truck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { EmptyState, ErrorState, FormError } from '../../components/ui/States';
import Skeleton from '../../components/ui/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { createVehicle, getVehicles, updateVehicle } from '../../api/adminApi';
import {
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  vehicleStatusMeta,
} from '../../utils/shipment';
import { isClean, validateVehicleForm } from '../../utils/validation';
import './admin.css';

const emptyVehicle = () => ({
  vehicleNumber: '',
  type: '',
  location: '',
  capacityKg: '',
  status: 'available',
});

/**
 * Fleet management.
 *
 * Create and update only - the backend exposes no delete route for vehicles,
 * so no delete affordance is offered. Status filtering goes to the API, which
 * supports `status`, `type` and `location` parameters.
 */
export default function AdminVehicles() {
  useDocumentTitle('Vehicles');
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: vehicles, error, isLoading, reload } = useAsync(
    () => getVehicles({ status: statusFilter || undefined }),
    [statusFilter]
  );

  const [editing, setEditing] = useState(null); // null | 'new' | vehicle
  const [form, setForm] = useState(emptyVehicle);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setForm(emptyVehicle());
    setFormErrors({});
    setSubmitError(null);
    setEditing('new');
  }

  function openEdit(vehicle) {
    setForm({
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      location: vehicle.location,
      capacityKg: String(vehicle.capacityKg),
      status: vehicle.status,
    });
    setFormErrors({});
    setSubmitError(null);
    setEditing(vehicle);
  }

  function closeModal() {
    setEditing(null);
  }

  function update(patch) {
    setForm((current) => ({ ...current, ...patch }));
    setFormErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateVehicleForm(form);
    if (!isClean(errors)) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    const payload = {
      vehicleNumber: form.vehicleNumber.trim(),
      type: form.type,
      location: form.location.trim(),
      capacityKg: Number(form.capacityKg),
      status: form.status,
    };

    try {
      if (editing === 'new') {
        await createVehicle(payload);
        toast.success(`Vehicle ${payload.vehicleNumber} added to the fleet.`);
      } else {
        await updateVehicle(editing._id, payload);
        toast.success(`Vehicle ${payload.vehicleNumber} updated.`);
      }
      closeModal();
      reload();
    } catch (err) {
      // A duplicate vehicleNumber comes back as 409 with a usable message.
      setSubmitError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const visible = (vehicles || []).filter((vehicle) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [vehicle.vehicleNumber, vehicle.location, vehicle.type]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  return (
    <>
      <header className="page-header list-header">
        <div>
          <h1 className="page-title">Fleet</h1>
          <p className="page-subtitle">
            Vehicles available to carry shipments, and their current status.
          </p>
        </div>

        <Button iconLeft={Plus} onClick={openCreate}>
          Add vehicle
        </Button>
      </header>

      <Card padding="md" className="admin-filters">
        <Select
          label="Status"
          options={VEHICLE_STATUSES}
          placeholder="All statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          containerClassName="admin-filters__field"
        />

        <Input
          label="Search"
          placeholder="Vehicle number, location or type"
          iconLeft={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="admin-filters__field"
        />
      </Card>

      {error && <ErrorState error={error} onRetry={reload} />}

      {isLoading && (
        <Card padding="none" className="table-card">
          <div className="audit-skeleton" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={20} />
            ))}
          </div>
        </Card>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <EmptyState
          icon={Truck}
          title={search || statusFilter ? 'No matching vehicles' : 'No vehicles yet'}
          message={
            search || statusFilter
              ? 'Try a different status or search term.'
              : 'Add a vehicle to make it available for customer shipments.'
          }
          action={
            !search && !statusFilter ? (
              <Button iconLeft={Plus} onClick={openCreate}>
                Add vehicle
              </Button>
            ) : null
          }
        />
      )}

      {!isLoading && !error && visible.length > 0 && (
        <>
          <p className="list-count">
            {visible.length} vehicle{visible.length === 1 ? '' : 's'}
          </p>

          <Card padding="none" className="table-card">
            <div className="scroll-x">
              <table className="data-table">
                <caption className="sr-only">Fleet vehicles</caption>
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Type</th>
                    <th scope="col">Location</th>
                    <th scope="col">Capacity</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((vehicle) => {
                    const status = vehicleStatusMeta(vehicle.status);
                    return (
                      <tr key={vehicle._id}>
                        <td className="mono data-table__strong">
                          {vehicle.vehicleNumber}
                        </td>
                        <td>{vehicle.type}</td>
                        <td>{vehicle.location}</td>
                        <td>{vehicle.capacityKg} kg</td>
                        <td>
                          <Badge tone={status.tone} size="sm">
                            {status.label}
                          </Badge>
                        </td>
                        <td className="data-table__actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={Pencil}
                            onClick={() => openEdit(vehicle)}
                          >
                            Edit
                            <span className="sr-only">
                              {' '}
                              vehicle {vehicle.vehicleNumber}
                            </span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* -- Create / edit dialog ------------------------------------------- */}
      <Modal
        isOpen={Boolean(editing)}
        onClose={closeModal}
        title={editing === 'new' ? 'Add a vehicle' : 'Edit vehicle'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isSaving}
              loadingText="Saving"
            >
              {editing === 'new' ? 'Add vehicle' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form className="vehicle-form" onSubmit={handleSubmit} noValidate>
          {submitError && <FormError message={submitError} />}

          <Input
            label="Vehicle number"
            value={form.vehicleNumber}
            onChange={(e) => update({ vehicleNumber: e.target.value })}
            error={formErrors.vehicleNumber}
            placeholder="TN01AB1234"
            hint="Must be unique across the fleet."
            required
          />

          <div className="vehicle-form__row">
            <Select
              label="Type"
              options={VEHICLE_TYPES}
              placeholder="Choose a type"
              value={form.type}
              onChange={(e) => update({ type: e.target.value })}
              error={formErrors.type}
              required
            />

            <Select
              label="Status"
              options={VEHICLE_STATUSES}
              value={form.status}
              onChange={(e) => update({ status: e.target.value })}
              required
            />
          </div>

          <div className="vehicle-form__row">
            <Input
              label="Current location"
              value={form.location}
              onChange={(e) => update({ location: e.target.value })}
              error={formErrors.location}
              placeholder="Chennai"
              required
            />

            <Input
              label="Capacity"
              type="number"
              min="1"
              step="1"
              suffix="kg"
              value={form.capacityKg}
              onChange={(e) => update({ capacityKg: e.target.value })}
              error={formErrors.capacityKg}
              placeholder="1000"
              required
            />
          </div>

          {/* Lets Enter submit the form from any field. */}
          <button type="submit" className="sr-only" tabIndex={-1}>
            Save
          </button>
        </form>
      </Modal>
    </>
  );
}

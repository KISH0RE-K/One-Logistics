import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Package,
  Save,
  Truck,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Stepper from '../../components/Stepper';
import { ErrorState, FormError } from '../../components/ui/States';
import FullPageLoader from '../../components/FullPageLoader';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as shipmentApi from '../../api/shipmentApi';
import { nextIncompleteStep } from '../../utils/shipment';
import {
  isClean,
  validateDelivery,
  validatePackage,
  validatePickup,
  validateService,
} from '../../utils/validation';

import StepLocation from './wizard/StepLocation';
import StepPackage from './wizard/StepPackage';
import StepService from './wizard/StepService';
import StepVehicles from './wizard/StepVehicles';
import StepReview from './wizard/StepReview';
import ShipmentSuccess from './wizard/ShipmentSuccess';
import './wizard/wizard.css';

const STEPS = [
  { key: 'pickup', label: 'Pickup' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'package', label: 'Package Details' },
  { key: 'service', label: 'Service Options' },
  { key: 'vehicles', label: 'Recommended Vehicles' },
  { key: 'review', label: 'Review & Confirm' },
];

const emptyLocation = () => ({
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  contactName: '',
  contactPhone: '',
});

const emptyForm = () => ({
  pickup: emptyLocation(),
  delivery: emptyLocation(),
  package: {
    weight: '',
    length: '',
    width: '',
    height: '',
    packageType: '',
    fragile: false,
  },
  deliveryOption: '',
  transportMode: '',
  cost: undefined,
  estimatedTime: undefined,
  vehicle: null,
});

/**
 * Six-step booking wizard - the primary workflow in the app.
 *
 * A draft can be resumed with ?draft=<id>, which loads the saved shipment and
 * opens at the first step that is still incomplete, so a booking begun on one
 * device continues on another exactly where it stopped.
 */
export default function CreateShipment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('Create shipment');

  const draftParam = searchParams.get('draft');

  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [draftId, setDraftId] = useState(draftParam || null);

  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftParam));
  const [loadError, setLoadError] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const headingRef = useRef(null);

  /* -- Resume a saved draft --------------------------------------------- */
  useEffect(() => {
    if (!draftParam) {
      setIsLoadingDraft(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingDraft(true);
    setLoadError(null);

    shipmentApi
      .getShipment(draftParam)
      .then((shipment) => {
        if (cancelled || !shipment) return;

        const pkg = shipment.packageId || {};
        setForm((current) => ({
          ...current,
          // Only the city round-trips: the backend models origin and
          // destination as single strings (see shipmentApi.js).
          pickup: { ...emptyLocation(), city: shipment.from || '' },
          delivery: { ...emptyLocation(), city: shipment.to || '' },
          package: {
            weight: pkg.weight ?? '',
            length: pkg.length ?? '',
            width: pkg.width ?? '',
            height: pkg.height ?? '',
            packageType: pkg.packageType ?? '',
            fragile: Boolean(pkg.fragile),
          },
          deliveryOption: shipment.deliveryOption || '',
          transportMode: shipment.transportMode || '',
          cost: shipment.cost,
          estimatedTime: shipment.estimatedTime,
        }));

        setDraftId(shipment._id);
        // Open at the first thing still missing.
        setStep(Math.min(nextIncompleteStep(shipment), STEPS.length - 1));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDraft(false);
      });

    return () => {
      cancelled = true;
    };
  }, [draftParam]);

  /* Move focus to the step heading on change - keyboard users should not
     have to hunt for where the page went. */
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  /* -- Form helpers ------------------------------------------------------ */

  const updateSection = useCallback((section, patch) => {
    setForm((current) => ({ ...current, [section]: { ...current[section], ...patch } }));
    setErrors({});
  }, []);

  const updateField = useCallback((patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors({});
  }, []);

  const validateStep = useCallback(
    (index) => {
      switch (index) {
        case 0:
          return validatePickup(form.pickup);
        case 1:
          return validateDelivery(form.delivery);
        case 2:
          return validatePackage(form.package);
        case 3:
          return validateService(form);
        case 4:
          // A vehicle is optional: the customer may not care which one.
          return {};
        default:
          return {};
      }
    },
    [form]
  );

  function goNext() {
    const stepErrors = validateStep(step);
    if (!isClean(stepErrors)) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }

  function goToStep(index) {
    if (index >= step) return;
    setErrors({});
    setStep(index);
  }

  /* -- Save draft --------------------------------------------------------
     Creates on first save, updates thereafter, so repeatedly saving does not
     litter the account with duplicate drafts.                             */

  async function handleSaveDraft() {
    setIsSavingDraft(true);
    setSubmitError(null);

    try {
      const saved = draftId
        ? await shipmentApi.updateShipment(draftId, form)
        : await shipmentApi.saveDraft(form);

      if (saved?._id && saved._id !== draftId) {
        setDraftId(saved._id);
        setSearchParams({ draft: saved._id }, { replace: true });
      }

      toast.success('Draft saved. You can pick it up on any device.');
    } catch (err) {
      setSubmitError(err.message);
      toast.error(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  }

  /* -- Confirm ----------------------------------------------------------- */

  async function handleConfirm() {
    // Re-check every step that carries required data before booking.
    for (let i = 0; i <= 3; i += 1) {
      const stepErrors = validateStep(i);
      if (!isClean(stepErrors)) {
        setErrors(stepErrors);
        setStep(i);
        toast.error('Some details still need attention.');
        return;
      }
    }

    if (!form.transportMode) {
      setStep(3);
      toast.error('Choose a transport mode before confirming.');
      return;
    }

    setIsConfirming(true);
    setSubmitError(null);

    try {
      // Promote the draft in place if we have one, otherwise create fresh.
      const shipment = draftId
        ? await shipmentApi.confirmDraft(draftId, form)
        : await shipmentApi.createShipment(form);

      setConfirmed(shipment);
      toast.success('Shipment created successfully.');
    } catch (err) {
      setSubmitError(err.message);
      toast.error(err.message);
    } finally {
      setIsConfirming(false);
    }
  }

  /* -- Render ------------------------------------------------------------ */

  if (isLoadingDraft) return <FullPageLoader label="Loading your draft" />;

  if (loadError) {
    return (
      <div className="container page">
        <ErrorState
          error={loadError}
          title="We couldn't open that draft"
          onRetry={() => navigate('/drafts')}
        />
      </div>
    );
  }

  if (confirmed) {
    return <ShipmentSuccess shipment={confirmed} />;
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="container page wizard">
      <header className="wizard__header">
        <div>
          <h1 className="page-title">Create a shipment</h1>
          <p className="page-subtitle">
            {draftId
              ? 'Continuing a saved draft. Your progress is kept as you go.'
              : 'Six quick steps. Save as a draft at any point and finish later.'}
          </p>
        </div>

        <Button
          variant="outline"
          iconLeft={Save}
          onClick={handleSaveDraft}
          isLoading={isSavingDraft}
          loadingText="Saving"
        >
          Save as draft
        </Button>
      </header>

      <Card padding="md" className="wizard__stepper">
        <Stepper steps={STEPS} current={step} onStepClick={goToStep} />
      </Card>

      <div className="wizard__body">
        <h2
          className="wizard__step-title"
          ref={headingRef}
          tabIndex={-1}
        >
          <StepIcon index={step} />
          {STEPS[step].label}
        </h2>

        {submitError && <FormError message={submitError} />}

        {step === 0 && (
          <StepLocation
            kind="pickup"
            value={form.pickup}
            errors={errors}
            onChange={(patch) => updateSection('pickup', patch)}
          />
        )}

        {step === 1 && (
          <StepLocation
            kind="delivery"
            value={form.delivery}
            errors={errors}
            onChange={(patch) => updateSection('delivery', patch)}
          />
        )}

        {step === 2 && (
          <StepPackage
            value={form.package}
            errors={errors}
            onChange={(patch) => updateSection('package', patch)}
          />
        )}

        {step === 3 && (
          <StepService form={form} errors={errors} onChange={updateField} />
        )}

        {step === 4 && (
          <StepVehicles
            form={form}
            onSelect={(vehicle) => updateField({ vehicle })}
          />
        )}

        {step === 5 && <StepReview form={form} onEditStep={setStep} />}
      </div>

      <div className="wizard__nav">
        <Button
          variant="ghost"
          iconLeft={ArrowLeft}
          onClick={goBack}
          disabled={step === 0}
        >
          Back
        </Button>

        <div className="wizard__nav-right">
          {isLastStep ? (
            <Button
              size="lg"
              onClick={handleConfirm}
              isLoading={isConfirming}
              loadingText="Confirming"
              iconLeft={CheckCircle2}
            >
              Confirm shipment
            </Button>
          ) : (
            <Button size="lg" onClick={goNext} iconRight={ArrowRight}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIcon({ index }) {
  const Icon = index <= 1 ? MapPin : index === 2 ? Package : index === 4 ? Truck : Package;
  return (
    <span className="wizard__step-icon" aria-hidden="true">
      <Icon size={18} />
    </span>
  );
}

import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import './ui.css';

/**
 * Labelled text field with inline validation messaging.
 *
 * The label is always a real <label> bound to the input, errors are wired up
 * with aria-describedby and announced via role="alert", and the invalid state
 * is exposed through aria-invalid rather than colour alone.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    id,
    type = 'text',
    required = false,
    suffix,
    iconLeft: IconLeft = null,
    className = '',
    containerClassName = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`field ${containerClassName}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
          {required && (
            <span className="field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div
        className={`field__control ${IconLeft ? 'field__control--with-icon' : ''} ${
          error ? 'field__control--invalid' : ''
        }`}
      >
        {IconLeft && <IconLeft className="field__icon" size={18} aria-hidden="true" />}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`field__input ${className}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          aria-required={required || undefined}
          {...rest}
        />
        {suffix && <span className="field__suffix">{suffix}</span>}
      </div>

      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p className="field__error" id={errorId} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;

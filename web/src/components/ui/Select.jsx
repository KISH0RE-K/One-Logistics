import { forwardRef, useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import './ui.css';

/**
 * Native <select> with the app's field styling.
 *
 * Deliberately native: it inherits the platform's keyboard behaviour, screen
 * reader support and mobile picker for free, which a custom listbox would
 * have to reimplement.
 */
const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    id,
    options = [],
    placeholder,
    required = false,
    className = '',
    containerClassName = '',
    children,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`field ${containerClassName}`}>
      {label && (
        <label className="field__label" htmlFor={selectId}>
          {label}
          {required && (
            <span className="field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={`field__control ${error ? 'field__control--invalid' : ''}`}>
        <select
          ref={ref}
          id={selectId}
          className={`field__input field__select ${className}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          aria-required={required || undefined}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const text = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
          {children}
        </select>
        <ChevronDown className="field__chevron" size={18} aria-hidden="true" />
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

export default Select;

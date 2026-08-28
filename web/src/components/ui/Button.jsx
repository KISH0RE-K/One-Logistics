import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import './ui.css';

/**
 * The one button in the app.
 *
 * variant: primary (gold CTA) | secondary (dark) | outline | ghost | danger
 * size:    sm | md | lg
 *
 * Pass `to` to render a react-router Link, or `href` for an external anchor -
 * both keep the same visual treatment while staying semantically correct.
 * While `isLoading` the button is disabled and announces itself as busy.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    type = 'button',
    isLoading = false,
    loadingText,
    disabled = false,
    fullWidth = false,
    iconLeft: IconLeft = null,
    iconRight: IconRight = null,
    to,
    href,
    className = '',
    children,
    ...rest
  },
  ref
) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--block' : '',
    isLoading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="btn__spinner" size={16} aria-hidden="true" />
      ) : (
        IconLeft && <IconLeft className="btn__icon" size={16} aria-hidden="true" />
      )}
      <span className="btn__label">
        {isLoading && loadingText ? loadingText : children}
      </span>
      {!isLoading && IconRight && (
        <IconRight className="btn__icon" size={16} aria-hidden="true" />
      )}
    </>
  );

  if (to && !disabled && !isLoading) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled && !isLoading) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;

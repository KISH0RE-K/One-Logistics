import './ui.css';

/**
 * The large rounded surface the whole layout is built from.
 *
 * tone: light (default white) | sunken | dark (deep brown) | gold
 * Pass `as` to change the element - use "section" or "article" wherever the
 * card is a real landmark rather than decoration.
 */
export default function Card({
  as: Tag = 'div',
  tone = 'light',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'card',
    `card--${tone}`,
    `card--pad-${padding}`,
    interactive ? 'card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, className = '' }) {
  return (
    <div className={`card__header ${className}`}>
      <div className="card__heading">
        {Icon && (
          <span className="card__header-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h3 className="card__title">{title}</h3>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="card__action">{action}</div>}
    </div>
  );
}

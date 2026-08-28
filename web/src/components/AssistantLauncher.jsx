import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Maximize2, X } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { useIsMobile } from '../hooks/useMediaQuery';
import './chat.css';

/**
 * Global floating entry point to the assistant.
 *
 * Hidden on the dedicated /assistant page (it would be redundant) and on
 * mobile, where the bottom tab bar already carries an AI tab and a floating
 * button would sit on top of it.
 */
export default function AssistantLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const location = useLocation();
  const isMobile = useIsMobile();

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  // Close when navigating elsewhere.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (isMobile || location.pathname.startsWith('/assistant')) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="assistant-launcher"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="assistant-panel"
      >
        <MessageSquare size={19} aria-hidden="true" />
        <span>AI Assistant</span>
      </button>

      {isOpen && (
        <div
          className="assistant-panel"
          id="assistant-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Logistics assistant"
        >
          <header className="assistant-panel__head">
            <div>
              <p className="assistant-panel__title">Logistics assistant</p>
              <p className="assistant-panel__subtitle">Ask about shipments and routes</p>
            </div>
            <div className="assistant-panel__actions">
              <Link
                to="/assistant"
                className="assistant-panel__icon-btn"
                aria-label="Open the full assistant page"
              >
                <Maximize2 size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="assistant-panel__icon-btn"
                onClick={close}
                aria-label="Close assistant"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </header>

          <ChatWindow
            variant="panel"
            autoFocus
            conversationId={conversationId}
            onConversationChange={setConversationId}
          />
        </div>
      )}
    </>
  );
}

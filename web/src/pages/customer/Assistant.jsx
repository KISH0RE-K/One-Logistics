import { useState } from 'react';
import { MessageSquarePlus, Sparkles } from 'lucide-react';
import ChatWindow from '../../components/ChatWindow';
import Button from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getConversations } from '../../api/chatApi';
import { formatRelative } from '../../utils/format';
import { channelLabel } from '../../utils/shipment';
import './assistant.css';

/**
 * Full-page assistant: conversation history beside the active thread.
 *
 * Replies come from POST /api/chat. The backend's LLM is not connected yet,
 * so today it returns a holding message - which is what appears here.
 * Nothing on this page is generated client-side.
 */
export default function Assistant() {
  useDocumentTitle('AI assistant');

  const [activeId, setActiveId] = useState(null);
  const { data: conversations, isLoading, reload } = useAsync(getConversations, []);

  function startNew() {
    setActiveId(null);
  }

  function handleConversationCreated(id) {
    setActiveId(id);
    reload();
  }

  return (
    <div className="container page assistant-page">
      <header className="page-header assistant-page__header">
        <div>
          <h1 className="page-title">
            <Sparkles size={24} aria-hidden="true" />
            Logistics assistant
          </h1>
          <p className="page-subtitle">
            Ask about a shipment, pick up a saved draft, or compare shipping
            options - in plain language.
          </p>
        </div>

        <Button variant="outline" iconLeft={MessageSquarePlus} onClick={startNew}>
          New conversation
        </Button>
      </header>

      <div className="assistant-page__layout">
        {/* History rail */}
        <aside className="assistant-history" aria-label="Conversation history">
          <p className="section-label assistant-history__label">Your conversations</p>

          {isLoading && <p className="assistant-history__empty">Loading…</p>}

          {!isLoading && !conversations?.length && (
            <p className="assistant-history__empty">
              No conversations yet. Ask a question to start one.
            </p>
          )}

          {!isLoading && conversations?.length > 0 && (
            <ul className="assistant-history__list">
              {conversations.map((conversation) => (
                <li key={conversation._id}>
                  <button
                    type="button"
                    className={`assistant-history__item ${
                      activeId === conversation._id ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveId(conversation._id)}
                    aria-current={activeId === conversation._id ? 'true' : undefined}
                  >
                    <span className="assistant-history__title">
                      {conversation.title || 'Conversation'}
                    </span>
                    <span className="assistant-history__meta">
                      {channelLabel(conversation.channel)} ·{' '}
                      {formatRelative(conversation.updatedAt || conversation.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Active thread */}
        <div className="assistant-page__chat">
          <ChatWindow
            key={activeId || 'new'}
            variant="page"
            conversationId={activeId}
            onConversationChange={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  );
}

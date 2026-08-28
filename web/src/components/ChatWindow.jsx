import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import ChatMessage from './ChatMessage';
import Button from './ui/Button';
import { FormError } from './ui/States';
import * as chatApi from '../api/chatApi';
import './chat.css';

/**
 * The assistant conversation surface, shared by the dedicated page and the
 * floating panel.
 *
 * Every reply shown here comes from POST /api/chat. Nothing is generated in
 * the browser: while the backend's LLM is still a stub it returns a fixed
 * holding reply, and that is exactly what appears - no simulated intelligence
 * standing in for a model that is not connected yet.
 */

const SUGGESTIONS = [
  'Where is my shipment?',
  'What is the cheapest way to send 5 kg from Chennai to Mumbai?',
  'Show me my saved drafts',
  'Which vehicles are available in Chennai?',
];

const GREETING =
  'Hi! I can help you track shipments, continue saved shipments, compare shipping options, and answer logistics questions.';

export default function ChatWindow({
  conversationId: initialConversationId = null,
  onConversationChange,
  variant = 'page',
  autoFocus = false,
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(initialConversationId));
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  /* Load an existing conversation when one is selected. */
  useEffect(() => {
    setConversationId(initialConversationId);

    if (!initialConversationId) {
      setMessages([]);
      setIsLoadingHistory(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingHistory(true);
    setError(null);

    chatApi
      .getConversation(initialConversationId)
      .then((conversation) => {
        if (cancelled) return;
        setMessages(conversation?.messages || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  /* Keep the newest turn in view. */
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setError(null);
      setIsSending(true);

      // Show the user's own turn immediately; the server round-trip replaces
      // the whole thread with its authoritative copy.
      const optimistic = { role: 'user', content: trimmed, timestamp: new Date().toISOString() };
      setMessages((current) => [...current, optimistic]);
      setDraft('');

      try {
        const conversation = await chatApi.sendMessage({
          message: trimmed,
          conversationId,
        });

        if (conversation) {
          setMessages(conversation.messages || []);
          if (conversation._id && conversation._id !== conversationId) {
            setConversationId(conversation._id);
            onConversationChange?.(conversation._id);
          }
        }
      } catch (err) {
        setError(err);
        // Roll the optimistic turn back so the transcript stays truthful.
        setMessages((current) => current.filter((m) => m !== optimistic));
        setDraft(trimmed);
      } finally {
        setIsSending(false);
        inputRef.current?.focus();
      }
    },
    [conversationId, isSending, onConversationChange]
  );

  function handleSubmit(event) {
    event.preventDefault();
    send(draft);
  }

  function handleKeyDown(event) {
    // Enter sends, Shift+Enter adds a newline.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }

  const isEmpty = !messages.length && !isLoadingHistory;

  return (
    <div className={`chat chat--${variant}`}>
      <div className="chat__scroll" ref={scrollRef}>
        <div className="chat__thread" role="log" aria-live="polite" aria-label="Conversation">
          {isEmpty && (
            <>
              <div className="chat-msg chat-msg--assistant">
                <span className="chat-msg__avatar" aria-hidden="true">
                  <Bot size={15} />
                </span>
                <div className="chat-msg__bubble">
                  <p className="chat-msg__text">{GREETING}</p>
                </div>
              </div>

              <div className="chat__suggestions">
                <p className="chat__suggestions-label">Try asking</p>
                <div className="chat__suggestion-list">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="chat__suggestion"
                      onClick={() => send(suggestion)}
                      disabled={isSending}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {isLoadingHistory && (
            <p className="chat__status" aria-busy="true">
              Loading conversation…
            </p>
          )}

          {messages.map((message, index) => (
            <ChatMessage key={`${message.role}-${index}`} message={message} />
          ))}

          {isSending && (
            <div className="chat-msg chat-msg--assistant">
              <span className="chat-msg__avatar" aria-hidden="true">
                <Bot size={15} />
              </span>
              <div className="chat-msg__bubble chat-msg__bubble--typing">
                <span className="chat-typing" aria-label="Assistant is replying">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <div className="chat__composer">
        {error && <FormError message={error.message} />}

        <form className="chat__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="chat-input">
            Message the logistics assistant
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="chat__input"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a shipment, a route or a saved draft…"
            maxLength={2000}
            disabled={isSending}
          />
          <Button
            type="submit"
            variant="primary"
            iconLeft={Send}
            disabled={!draft.trim()}
            isLoading={isSending}
            aria-label="Send message"
          >
            <span className="chat__send-label">Send</span>
          </Button>
        </form>

        <p className="chat__hint">
          Press Enter to send, Shift + Enter for a new line.
        </p>
      </div>
    </div>
  );
}

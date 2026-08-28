import { Bot, User, Wrench } from 'lucide-react';
import { formatTime } from '../utils/format';
import './chat.css';

/**
 * A single turn in the assistant conversation.
 *
 * The backend's message schema allows three roles - user, assistant and tool.
 * Tool turns are rendered as a distinct, collapsed technical trace rather
 * than as prose, so when function calling is switched on it is obvious which
 * backend function answered and with what, instead of it being passed off as
 * something the model simply knew.
 */
export default function ChatMessage({ message }) {
  if (!message) return null;

  const { role, content, toolName, toolResult, timestamp } = message;

  if (role === 'tool') {
    return (
      <div className="chat-msg chat-msg--tool">
        <details className="chat-tool">
          <summary className="chat-tool__summary">
            <Wrench size={14} aria-hidden="true" />
            <span>
              Looked up <strong>{toolName || 'backend data'}</strong>
            </span>
          </summary>
          <pre className="chat-tool__result">
            {typeof toolResult === 'string'
              ? toolResult
              : JSON.stringify(toolResult ?? content, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  const isUser = role === 'user';
  const Icon = isUser ? User : Bot;

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--assistant'}`}>
      <span className="chat-msg__avatar" aria-hidden="true">
        <Icon size={15} />
      </span>

      <div className="chat-msg__bubble">
        <p className="sr-only">{isUser ? 'You said' : 'Assistant said'}</p>
        <p className="chat-msg__text">{content}</p>
        {timestamp && (
          <time className="chat-msg__time" dateTime={timestamp}>
            {formatTime(timestamp)}
          </time>
        )}
      </div>
    </div>
  );
}

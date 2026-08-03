import { useState } from 'react';
import Icon from '../common/Icon';
import { formatDate } from '../../utils/formatters';

export default function IncidentDetailPanel({ incident, onUpdateStatus, onSendMessage, messages }) {
  const [inputMsg, setInputMsg] = useState('');

  if (!incident) {
    return (
      <div className="relief-col-center">
        <div className="relief-detail-empty">
          <Icon name="satellite_alt" size={48} style={{ opacity: 0.4 }} />
          <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '12px', letterSpacing: '0.08em' }}>
            SELECT AN INCIDENT FROM THE QUEUE
          </div>
        </div>
      </div>
    );
  }

  const shortId = incident._id ? incident._id.slice(-6).toUpperCase() : '000000';

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    onSendMessage(incident._id, inputMsg.trim());
    setInputMsg('');
  };

  return (
    <div className="relief-col-center">
      <div className="relief-detail-panel">
        <div className="relief-detail-header">
          <span
            className="relief-detail-status"
            style={{
              background:
                incident.status === 'resolved'
                  ? 'rgba(52,199,89,0.2)'
                  : 'rgba(249,115,22,0.2)',
              color:
                incident.status === 'resolved'
                  ? '#34C759'
                  : '#F97316',
            }}
          >
            {incident.status?.toUpperCase()}
          </span>
          <div className="relief-detail-id">INCIDENT_ID // NX-{shortId}</div>
          <h2 className="relief-detail-title">
            {incident.type || incident.title} — {incident.location?.address || 'Unknown Address'}
          </h2>

          <div className="relief-meta-grid">
            <div>
              <div className="relief-meta-label">SEVERITY / PRIORITY</div>
              <div className="relief-meta-value" style={{ textTransform: 'uppercase' }}>
                {incident.severity || 'NORMAL'}
              </div>
            </div>
            <div>
              <div className="relief-meta-label">ZONE / SECTOR</div>
              <div className="relief-meta-value">{incident.zone || 'SECTOR_0'}</div>
            </div>
          </div>
        </div>

        <div className="relief-detail-body">
          <div>
            <div className="relief-meta-label" style={{ marginBottom: '6px' }}>DESCRIPTION</div>
            <p className="relief-detail-desc">
              {incident.description || 'No additional details provided by reporting party.'}
            </p>
          </div>

          <div>
            <div className="relief-meta-label" style={{ marginBottom: '6px' }}>REPORTED AT</div>
            <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '13px', color: 'var(--nt-bright)' }}>
              {formatDate(incident.createdAt)}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="relief-meta-label" style={{ marginBottom: '10px' }}>DISPATCH & STATUS CONTROLS</div>
            <div className="relief-actions">
              <button
                className="relief-action-btn en-route"
                onClick={() => onUpdateStatus(incident._id, 'en_route')}
                disabled={incident.status === 'en_route' || incident.status === 'resolved'}
              >
                Dispatch Unit (En Route)
              </button>
              <button
                className="relief-action-btn resolve"
                onClick={() => onUpdateStatus(incident._id, 'resolved')}
                disabled={incident.status === 'resolved'}
              >
                Mark Resolved
              </button>
              <button
                className="relief-action-btn dismiss"
                onClick={() => onUpdateStatus(incident._id, 'dismissed')}
                disabled={incident.status === 'dismissed'}
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Chat / Dispatch Log */}
          <div className="chat-section">
            <div className="chat-section-title">COMMUNICATIONS & DISPATCH LOG</div>
            <div className="chat-log">
              {(!messages || messages.length === 0) && (
                <div style={{ fontSize: '12px', color: 'var(--nt-dim)', fontStyle: 'italic' }}>
                  No messages recorded for this incident yet.
                </div>
              )}
              {messages &&
                messages.map((msg, idx) => (
                  <div
                    key={msg._id || idx}
                    className={`chat-msg ${msg.senderRole === 'relief_admin' ? 'relief' : 'user'}`}
                  >
                    <div>{msg.content || msg.message}</div>
                    <div className="chat-msg-meta">
                      {msg.senderName || (msg.senderRole === 'relief_admin' ? 'Relief Command' : 'Field Unit')}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Chat input form */}
        <form className="chat-input-area" onSubmit={handleSend}>
          <div className="chat-input-wrap">
            <input
              type="text"
              className="chat-text-input"
              placeholder="Transmit message to field units..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
            />
            <button type="submit" className="icon-btn chat-send-btn" title="Send message">
              <Icon name="send" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

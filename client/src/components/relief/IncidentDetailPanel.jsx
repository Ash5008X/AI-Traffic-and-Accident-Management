import { useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import { useToast } from '../common/ToastContext';
import { formatDate, formatLocation } from '../../utils/formatters';

export default function IncidentDetailPanel({ incident, onUpdateStatus, onSendMessage, messages }) {
  const [inputMsg, setInputMsg] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { addToast } = useToast();

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

  const displayId = incident.incidentId || incident._id || 'UNKNOWN';

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) {
      addToast('Message cannot be empty.', 'error');
      return;
    }
    try {
      await onSendMessage(incident._id, inputMsg.trim());
      setInputMsg('');
      addToast('Message transmitted successfully.', 'success');
    } catch {
      addToast('Failed to send message.', 'error');
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      await onUpdateStatus(incident._id, 'resolved');
      setShowResolveModal(false);
      addToast('Incident marked as resolved.', 'success');
    } catch {
      addToast('Failed to resolve incident.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async () => {
    setActionLoading(true);
    try {
      await onUpdateStatus(incident._id, 'dismissed');
      setShowDismissModal(false);
      addToast('Incident dismissed.', 'info');
    } catch {
      addToast('Failed to dismiss incident.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async () => {
    setActionLoading(true);
    try {
      await onUpdateStatus(incident._id, 'en_route');
      addToast('Field Unit dispatched successfully.', 'success');
    } catch {
      addToast('Failed to dispatch unit.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isResolved = incident.status === 'resolved';
  const isDismissed = incident.status === 'dismissed';
  const isCompleted = isResolved || isDismissed;
  const isEnRoute = incident.status === 'en_route' || incident.status === 'dispatched';
  const hasAssignedUnit = !!incident.assignedUnit;
  const assignedUnitName = incident.assignedUnit?.unitId || incident.assignedTeamId?.name || 'Unknown Unit';

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
                  : incident.status === 'dismissed'
                  ? 'rgba(255,59,48,0.2)'
                  : incident.status === 'en_route' || incident.status === 'dispatched'
                  ? 'rgba(0,122,255,0.2)'
                  : 'rgba(249,115,22,0.2)',
              color:
                incident.status === 'resolved'
                  ? '#34C759'
                  : incident.status === 'dismissed'
                  ? '#FF3B30'
                  : incident.status === 'en_route' || incident.status === 'dispatched'
                  ? '#007AFF'
                  : '#F97316',
            }}
          >
            {incident.status === 'dismissed' ? 'FALSE ALARM' : incident.status?.toUpperCase()}
          </span>
          <div className="relief-detail-id">INCIDENT_ID // {displayId}</div>
          <h2 className="relief-detail-title">
            {incident.type || incident.title} — {formatLocation(incident.location)}
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

          {/* Dispatch & Status Controls (Only for active incidents) */}
          {!isCompleted && (
            <div>
              <div className="relief-meta-label" style={{ marginBottom: '10px' }}>DISPATCH & STATUS CONTROLS</div>
              <div className="relief-actions">
                <button
                  className="relief-action-btn en-route"
                  onClick={handleDispatch}
                  disabled={actionLoading || isEnRoute || isResolved}
                >
                  {isEnRoute ? 'UNIT DISPATCHED' : actionLoading ? 'DISPATCHING...' : 'DISPATCH UNIT'}
                </button>
                <button
                  className="relief-action-btn resolve"
                  onClick={() => setShowResolveModal(true)}
                  disabled={actionLoading || isResolved}
                >
                  Mark Resolved
                </button>
                <button
                  className="relief-action-btn dismiss"
                  onClick={() => setShowDismissModal(true)}
                  disabled={actionLoading || isDismissed}
                >
                  Dismiss
                </button>
              </div>

              {hasAssignedUnit && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--nt-bright)' }}>
                  <strong style={{ color: 'var(--primary-accent)' }}>Assigned Unit:</strong> {assignedUnitName}
                </div>
              )}
            </div>
          )}

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

        {/* Chat input form (Only for active incidents) */}
        {!isCompleted && (
          <form className="chat-input-area" onSubmit={handleSend}>
            <div className="chat-input-wrap">
              <input
                type="text"
                className="chat-text-input"
                placeholder="Transmit message to field units..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={isResolved}
              />
              <button type="submit" className="icon-btn chat-send-btn" title="Send message" disabled={isResolved}>
                <Icon name="send" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title="Confirm Resolution">
        <p>Mark this incident as resolved?</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button className="relief-action-btn dismiss" onClick={() => setShowResolveModal(false)} style={{ padding: '8px 16px', background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button className="relief-action-btn resolve" onClick={handleResolve} style={{ padding: '8px 16px' }}>
            Confirm
          </button>
        </div>
      </Modal>

      <Modal isOpen={showDismissModal} onClose={() => setShowDismissModal(false)} title="Confirm Dismissal">
        <p>Dismiss this incident?</p>
        <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>This report will be marked as a false alarm.</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button className="relief-action-btn dismiss" onClick={() => setShowDismissModal(false)} style={{ padding: '8px 16px', background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button className="relief-action-btn dismiss" onClick={handleDismiss} style={{ padding: '8px 16px' }}>
            Dismiss
          </button>
        </div>
      </Modal>
    </div>
  );
}

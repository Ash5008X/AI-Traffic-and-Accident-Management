import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { formatDate, formatTimeUTC } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';
import '../../styles/field.css';

export default function FieldDashboard() {
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [statusText, setStatusText] = useState('ON PATROL // EN-ROUTE');

  useEffect(() => {
    loadMissions();
    const id = setInterval(loadMissions, 15000);
    return () => clearInterval(id);
  }, []);

  const loadMissions = async () => {
    try {
      const data = await api.get('/incidents').catch(() => []);
      const active = (Array.isArray(data) ? data : []).filter((inc) =>
        ['pending', 'assigned', 'en_route'].includes(inc.status)
      );
      setMissions(active);
      if (!selectedId && active.length > 0) {
        setSelectedId(active[0]._id);
      }
    } catch (err) {
      console.error('FieldDashboard load error:', err);
    }
  };

  const selectedMission = missions.find((m) => m._id === selectedId) || null;

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId]);

  const loadMessages = async (incId) => {
    try {
      const msgs = await api.get(`/messages?incidentId=${incId}`).catch(() => []);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Messages load error:', err);
    }
  };

  const updateStatus = async (incId, newStatus) => {
    try {
      await api.patch(`/incidents/${incId}`, { status: newStatus });
      await loadMissions();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedId) return;
    try {
      await api.post('/messages', {
        incidentId: selectedId,
        content: inputMsg.trim(),
        senderRole: 'field_unit',
        senderName: user?.name || 'Field Unit',
      });
      setInputMsg('');
      await loadMessages(selectedId);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  return (
    <div className="field-main">
      {/* Left: Mission Queue */}
      <div className="field-col-left">
        <div style={{ padding: 16, borderBottom: '1px solid var(--nt-card-border)', background: 'var(--nt-card)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '0.08em', color: 'var(--nt-bright)' }}>
            DISPATCHED_MISSIONS ({missions.length})
          </div>
          <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, color: 'var(--nt-dim)', marginTop: 4 }}>
            STATUS: <span style={{ color: '#34C759' }}>{statusText}</span>
          </div>
        </div>

        <div>
          {missions.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--nt-dim)', fontSize: 13 }}>
              No active dispatch missions assigned.
            </div>
          ) : (
            missions.map((inc) => {
              const isSelected = selectedId === inc._id;
              const sevClass = getSeverityClass(inc.severity);
              return (
                <div
                  key={inc._id}
                  className={`mission-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedId(inc._id)}
                >
                  <div className="mission-card-top">
                    <span className="mission-id">#{inc._id?.slice(-6).toUpperCase()}</span>
                    <span
                      className="mission-status-badge"
                      style={{
                        background:
                          sevClass === 'critical' ? 'rgba(255,59,48,0.15)' : 'rgba(255,149,0,0.15)',
                        color: sevClass === 'critical' ? '#FF3B30' : '#FF9500',
                      }}
                    >
                      {inc.severity || 'normal'}
                    </span>
                  </div>
                  <div className="mission-title">{inc.type || inc.title}</div>
                  <div className="mission-loc">
                    <Icon name="location_on" size={14} style={{ verticalAlign: 'middle' }} />
                    {inc.zone || inc.location?.address || 'Sector Grid'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Center: Mission Detail & Status Bar */}
      <div className="field-col-center">
        {!selectedMission ? (
          <div style={{ textAlign: 'center', color: 'var(--nt-dim)', padding: 60 }}>
            <Icon name="directions_car" size={48} style={{ opacity: 0.3 }} />
            <div style={{ fontFamily: 'Fira Code, monospace', marginTop: 12 }}>
              SELECT A MISSION FROM THE DISPATCH QUEUE
            </div>
          </div>
        ) : (
          <>
            <div className="mission-detail-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 12, color: 'var(--nt-dim)' }}>
                  MISSION #{selectedMission._id?.slice(-6).toUpperCase()} // {selectedMission.zone || 'GEN'}
                </span>
                <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 13, fontWeight: 700, color: '#F97316' }}>
                  {selectedMission.status?.toUpperCase()}
                </span>
              </div>
              <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--nt-bright)', marginTop: 8 }}>
                {selectedMission.type || selectedMission.title}
              </h1>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: 'var(--nt-bright)', marginTop: 12 }}>
                {selectedMission.description || 'No additional mission details provided.'}
              </div>

              {/* Status control buttons */}
              <div className="mission-status-bar">
                <button
                  className="status-action-btn accept"
                  onClick={() => updateStatus(selectedMission._id, 'en_route')}
                  disabled={selectedMission.status === 'en_route'}
                >
                  <Icon name="directions_car" size={16} /> Confirm En-Route
                </button>
                <button
                  className="status-action-btn arrive"
                  onClick={() => updateStatus(selectedMission._id, 'en_route')}
                >
                  <Icon name="location_on" size={16} /> Arrived on Scene
                </button>
                <button
                  className="status-action-btn resolve"
                  onClick={() => updateStatus(selectedMission._id, 'resolved')}
                >
                  <Icon name="check_circle" size={16} /> Resolve Incident
                </button>
              </div>
            </div>

            {/* Tactical map placeholder */}
            <div className="tactical-map">
              <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 12, color: '#F97316', fontWeight: 700 }}>
                TACTICAL_MAP_VIEW // SECTOR_GRID_NOMINAL
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Communications & Dispatch Chat */}
      <div className="field-col-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '0.08em', color: 'var(--nt-bright)' }}>
          COMMUNICATIONS CHANNEL
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {(!messages || messages.length === 0) && (
            <div style={{ color: 'var(--nt-dim)', fontSize: 12, fontStyle: 'italic' }}>
              No radio messages logged for this mission.
            </div>
          )}
          {messages &&
            messages.map((msg, idx) => (
              <div
                key={msg._id || idx}
                className={`chat-msg ${msg.senderRole === 'field_unit' ? 'relief' : 'user'}`}
              >
                <div>{msg.content || msg.message}</div>
                <div className="chat-msg-meta">
                  {msg.senderName || (msg.senderRole === 'field_unit' ? 'Field Unit' : 'Relief Command')}
                </div>
              </div>
            ))}
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="chat-text-input"
            placeholder="Transmit to command..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
          />
          <button type="submit" className="icon-btn chat-send-btn" title="Transmit">
            <Icon name="send" />
          </button>
        </form>
      </div>
    </div>
  );
}

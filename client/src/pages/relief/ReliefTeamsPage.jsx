import { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/relief.css';

export default function ReliefTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await api.get('/teams').catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        setTeams(data);
      } else {
        // Fallback default teams if API is empty
        setTeams([
          { _id: 't1', name: 'Alpha Response Unit 01', sector: 'SECTOR-N', status: 'ACTIVE', members: 4, incidentsHandled: 18 },
          { _id: 't2', name: 'Bravo Patrol Unit 02', sector: 'SECTOR-S', status: 'ACTIVE', members: 3, incidentsHandled: 14 },
          { _id: 't3', name: 'Charlie Medical Team', sector: 'SECTOR-E', status: 'ON-CALL', members: 5, incidentsHandled: 22 },
          { _id: 't4', name: 'Delta Rapid Transit', sector: 'SECTOR-W', status: 'ACTIVE', members: 4, incidentsHandled: 19 },
        ]);
      }
    } catch (err) {
      console.error('Teams load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relief-page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '0.08em', color: 'var(--nt-bright)' }}>
          FIELD_RESPONSE_TEAMS ({teams.length})
        </h1>
      </div>

      {loading ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>Loading response teams...</div>
      ) : (
        <div className="teams-grid">
          {teams.map((t) => {
            const initials = t.name
              ? t.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'TM';

            return (
              <div className="team-card" key={t._id}>
                <div className="team-card-top">
                  <div className="team-avatar">{initials}</div>
                  <div>
                    <div className="team-name">{t.name}</div>
                    <div className="team-role">SECTOR: {t.sector || 'GEN'} // {t.status || 'ACTIVE'}</div>
                  </div>
                </div>

                <div className="team-stats">
                  <div className="team-stat">
                    Members: <strong>{t.members || 4}</strong>
                  </div>
                  <div className="team-stat">
                    Incidents Resolved: <strong>{t.incidentsHandled || 12}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

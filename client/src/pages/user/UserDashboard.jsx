import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import socketManager from '../../services/socket';
import HeroCard from '../../components/user/HeroCard';
import ReportsFeed from '../../components/user/ReportsFeed';
import ActiveReportMonitor from '../../components/user/ActiveReportMonitor';
import NearbyAlerts from '../../components/user/NearbyAlerts';
import ReportModal from '../../components/user/ReportModal';
import '../../styles/user.css';

export default function UserDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [myReports, allIncidents] = await Promise.all([
        api.get('/incidents?reportedBy=me').catch(() => []),
        api.get('/incidents').catch(() => []),
      ]);
      setReports(Array.isArray(myReports) ? myReports : []);
      setIncidents(Array.isArray(allIncidents) ? allIncidents : []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    socketManager.on('incident:updated', loadData);
    socketManager.on('incident:new', loadData);

    return () => {
      socketManager.off('incident:updated', loadData);
      socketManager.off('incident:new', loadData);
    };
  }, [loadData]);

  const activeReport = reports.find((r) =>
    ['pending', 'en_route', 'dispatched'].includes(r.status)
  );

  return (
    <div className="page-layout">
      <div className="left-col">
        <HeroCard onReport={() => setModalOpen(true)} />
        <ReportsFeed reports={reports} loading={loading} />
      </div>

      <div className="right-col">
        <ActiveReportMonitor report={activeReport} />
        <NearbyAlerts incidents={incidents} userId={user?._id} />

        <div className="card sys-footer">
          <div className="sys-footer-text">
            SYSTEM_STATUS: <span className="sys-version">NOMINAL</span>
            <br />
            ENCRYPTION: AES-256 · PROTOCOL: TLS 1.3
            <br />
            VERSION: <span className="sys-version">2.4.1-STABLE</span>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => {
          setModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../components/styling/Dashboard.css';

const Dashboard = () => {
    const history = useHistory();
    const [stats, setStats]     = useState(null);
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, userRes] = await Promise.all([
                    api.get('/Register/stats'),
                    api.get('/Register/user'),
                ]);
                setStats(statsRes.data);
                setUser(userRes.data);
            } catch (err) {
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="dashboard-container">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="dashboard-welcome">
                <h2>Welcome back, {user?.firstname} {user?.lastname}</h2>
                <p className="dashboard-subtitle">Here is a quick overview of your activity.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats?.totalUsers ?? '—'}</div>
                    <div className="stat-label">Registered Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.totalMessages ?? '—'}</div>
                    <div className="stat-label">Total Messages Sent</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.totalGroups ?? '—'}</div>
                    <div className="stat-label">Active Groups</div>
                </div>
            </div>

            <div className="dashboard-actions">
                <h4>Quick Access</h4>
                <div className="action-buttons">
                    <button onClick={() => history.push('/chat')} className="btn btn-primary action-btn">
                        Private Chat
                    </button>
                    <button onClick={() => history.push('/groups')} className="btn btn-secondary action-btn">
                        Group Chat
                    </button>
                    <button onClick={() => history.push('/profile')} className="btn btn-outline-primary action-btn">
                        My Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

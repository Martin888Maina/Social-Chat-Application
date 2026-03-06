import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import '../styling/GroupSettings.css';

const GroupSettings = () => {
    const { groupId } = useParams();
    const history     = useHistory();

    const [group, setGroup]       = useState(null);
    const [members, setMembers]   = useState([]);
    const [currentUserId, setCurrentUserId] = useState('');
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [groupRes, userRes] = await Promise.all([
                    api.get(`/Group/groups/${groupId}/members`),
                    api.get('/Register/userById'),
                ]);
                setGroup(groupRes.data);
                setMembers(groupRes.data.members || []);
                setCurrentUserId(userRes.data.userId);
            } catch (err) {
                setError('Failed to load group settings.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [groupId]);

    const handleRemoveMember = async (userId, name) => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: `Remove ${name}?`,
            text: 'This member will be removed from the group.',
            showCancelButton: true,
            confirmButtonText: 'Remove',
            confirmButtonColor: '#d32f2f',
        });

        if (!confirm.isConfirmed) return;

        try {
            await api.delete(`/Group/groups/${groupId}/members/${userId}`);
            setMembers((prev) => prev.filter((m) => m._id !== userId));
            Swal.fire({ icon: 'success', title: 'Removed', text: `${name} has been removed.`, confirmButtonText: 'OK' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not remove the member. Please try again.', confirmButtonText: 'OK' });
        }
    };

    const handleDeleteGroup = async () => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Delete this group?',
            text: 'This action cannot be undone. All messages in the group will be deleted.',
            showCancelButton: true,
            confirmButtonText: 'Delete Group',
            confirmButtonColor: '#d32f2f',
        });

        if (!confirm.isConfirmed) return;

        try {
            await api.delete(`/Group/groups/${groupId}`);
            Swal.fire({ icon: 'success', title: 'Group Deleted', text: 'The group has been deleted.', confirmButtonText: 'OK' })
                .then(() => history.push('/groups'));
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete the group. Please try again.', confirmButtonText: 'OK' });
        }
    };

    if (loading) return <LoadingSpinner />;

    const isCreator = group?.creator && group.creator.toString() === currentUserId;

    return (
        <div className="group-settings-container">
            <div className="group-settings-header">
                <h2>{group?.name} — Settings</h2>
                <button onClick={() => history.push('/groups')} className="btn btn-outline-secondary btn-sm">
                    Back to Groups
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="members-section">
                <h4>Members ({members.length})</h4>
                <ul className="members-list">
                    {members.map((member) => (
                        <li key={member._id} className="member-item">
                            <div className="member-info">
                                {member.profilePicture ? (
                                    <img src={member.profilePicture} alt={member.firstname} className="member-avatar" />
                                ) : (
                                    <div className="member-avatar-placeholder">
                                        {member.firstname?.[0]}{member.lastname?.[0]}
                                    </div>
                                )}
                                <span className="member-name">{member.firstname} {member.lastname}</span>
                            </div>

                            {/* only the creator sees the remove button, and can't remove themselves */}
                            {isCreator && member._id !== currentUserId && (
                                <button
                                    onClick={() => handleRemoveMember(member._id, `${member.firstname} ${member.lastname}`)}
                                    className="btn btn-outline-danger btn-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {isCreator && (
                <div className="danger-zone">
                    <h4>Danger Zone</h4>
                    <p>Deleting this group will remove all messages and members permanently.</p>
                    <button onClick={handleDeleteGroup} className="btn btn-danger">
                        Delete Group
                    </button>
                </div>
            )}
        </div>
    );
};

export default GroupSettings;

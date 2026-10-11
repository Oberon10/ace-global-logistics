import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { USERS_LIST } from '../data/shipments';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  UserCheck, 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  Copy, 
  Check, 
  Search, 
  ShieldAlert, 
  KeyRound, 
  Phone, 
  AlertTriangle, 
  ArrowRight, 
  Building2, 
  Truck, 
  RefreshCw,
  Shield
} from 'lucide-react';

export default function UserManagementView({ 
  setView, 
  activeRole, 
  setActiveRole,
  initialFilter = 'ALL',
  currentView = 'users'
}) {
  const getApiBase = () => {
    if (typeof window !== 'undefined') {
      if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
    }
    return process.env.NEXT_PUBLIC_API_URL || '';
  };

  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(initialFilter); // 'ALL', 'Staff', 'Customer', 'Admin'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Fetch live users directly from MongoDB
  const fetchMongoUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const backendUrl = `${getApiBase()}/api/auth/users`;
      const res = await fetch(backendUrl);
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.users)) {
          const mapped = data.users.map(u => ({
            id: u._id || u.id,
            _id: u._id || u.id,
            name: u.name,
            email: u.email,
            loginPassword: '••••••••',
            role: u.role,
            department: u.department || 'Operations',
            phone: u.phone || '+44 20 7946 0000',
            status: u.status || 'Active',
            lastLogin: u.lastLogin || 'Active',
            accessScope: u.accessScope || (u.role === 'Admin' ? 'Full All-Portals Executive Authority' : u.role === 'Staff' ? 'Terminal Dispatcher & Customer Console Only' : 'Personal Shipments & Telemetry Records Only')
          }));

          setUsers(mapped);
        }
      }
    } catch (err) {
      console.warn('Could not fetch MongoDB users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchMongoUsers();
  }, []);

  
  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Secure Password Reset State (Admin Privilege)
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState({ type: '', text: '' });

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Staff');
  const [newUserDept, setNewUserDept] = useState('Terminal Operations');
  const [newUserPhone, setNewUserPhone] = useState('+44 20 7946 0000');

  // Copy helper
  const handleCopy = (text, fieldId) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Secure Password Reset Submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!resetNewPassword || resetNewPassword.trim().length < 6) {
      setResetNotice({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsResetting(true);
    setResetNotice({ type: '', text: '' });
    try {
      const targetId = resetModalUser._id || resetModalUser.id || resetModalUser.email;
      const res = await fetch(`${getApiBase()}/api/auth/users/${encodeURIComponent(targetId)}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetNewPassword.trim() })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setResetNotice({ type: 'success', text: `Password successfully updated and securely hashed for ${resetModalUser.email}.` });
        setTimeout(() => {
          setResetModalUser(null);
          setResetNewPassword('');
          setResetNotice({ type: '', text: '' });
        }, 1600);
      } else {
        setResetNotice({ type: 'error', text: data?.message || 'Failed to reset password.' });
      }
    } catch (err) {
      setResetNotice({ type: 'error', text: 'Network error resetting password: ' + err.message });
    } finally {
      setIsResetting(false);
    }
  };

  // Toggle active / inactive status
  const toggleStatus = async (id) => {
    let nextStatus = 'Active';
    const previousUsers = [...users];
    const updatedUsers = users.map(u => {
      if (u.id === id || u._id === id) {
        nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsers(updatedUsers);

    // Sync status change to backend MongoDB
    try {
      const backendUrl = `${getApiBase()}/api/auth/users/${id}`;
      const res = await fetch(backendUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        console.warn('User status sync failed on server');
        setUsers(previousUsers);
        alert('Failed to update status in MongoDB Atlas.');
        return;
      }
    } catch (err) {
      console.warn('User status sync warning:', err);
      setUsers(previousUsers);
      alert('Error updating status in MongoDB Atlas: ' + err.message);
      return;
    }

    if (inspectUser && (inspectUser.id === id || inspectUser._id === id)) {
      setInspectUser(prev => ({ ...prev, status: nextStatus }));
    }
  };

  // Delete user from MongoDB Atlas
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this account from MongoDB Atlas?')) return;
    try {
      const backendBase = getApiBase();
      const res = await fetch(`${backendBase}/api/auth/users/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id && u._id !== id));
        if (inspectUser && (inspectUser.id === id || inspectUser._id === id)) {
          setInspectUser(null);
        }
      } else {
        alert(data?.message || 'Failed to delete user from MongoDB Atlas.');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Error connecting to database to delete user: ' + err.message);
    }
  };

  // Add new user with strict MongoDB Atlas persistence
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const tempPassword = newUserPassword || (newUserRole === 'Admin' ? 'AdminSecurePass#2026' : newUserRole === 'Staff' ? 'StaffDispatchKey@99' : 'ClientSecure#2026');

    const backendBase = getApiBase();

    try {
      let endpoint = `${backendBase}/api/auth/register`;
      let payload = {
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: tempPassword,
        role: 'CUSTOMER',
        phone: newUserPhone,
        company: newUserDept
      };

      if (newUserRole === 'Staff') {
        endpoint = `${backendBase}/api/auth/staff`;
        payload = {
          name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          password: tempPassword,
          role: 'STAFF',
          department: newUserDept,
          phone: newUserPhone
        };
      } else if (newUserRole === 'Admin') {
        endpoint = `${backendBase}/api/auth/admin`;
        payload = {
          name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          password: tempPassword,
          role: 'ADMIN',
          title: 'Systems Administrator',
          department: newUserDept,
          phone: newUserPhone
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message || 'Failed to persist account to MongoDB Atlas. Please verify input data.');
        return;
      }

      // Re-fetch users directly from MongoDB Atlas to ensure consistency
      await fetchMongoUsers();

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('+44 20 7946 0000');
      setAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create account in MongoDB:', err);
      alert('Network or server error while connecting to MongoDB Atlas: ' + err.message);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    // Role filter
    if (activeFilter !== 'ALL' && u.role.toLowerCase() !== activeFilter.toLowerCase()) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchDept = (u.department || '').toLowerCase().includes(q);
      const matchRole = (u.role || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchDept || matchRole || matchPhone;
    }
    return true;
  });

  // Security Check: Only Admin has administrative privilege to view this management console
  if (activeRole !== 'admin') {
    return (
      <div className="ace-dashboard-layout">
        <Sidebar 
          role={activeRole} 
          currentView={currentView} 
          setView={setView} 
          setActiveRole={setActiveRole} 
        />
        <main className="ace-dashboard-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="ace-card" style={{ maxWidth: '520px', textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: '#FEE2E2', 
              color: '#DC2626', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px' 
            }}>
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary-blue)', marginBottom: '10px' }}>
              Administrative Privilege Required
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Access to personnel records and the administrative authority to view <strong>Staff and Customer login credentials</strong> is strictly restricted to System Administrators.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setView(activeRole === 'staff' ? 'staff-dashboard' : 'customer-dashboard')} 
                className="ace-btn ace-btn-secondary"
              >
                Return to My Console
              </button>
              <button 
                onClick={() => {
                  setActiveRole('guest');
                  setView('login');
                }} 
                className="ace-btn ace-btn-action"
              >
                Sign In as Administrator
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ace-dashboard-layout">
      <Sidebar 
        role="admin" 
        currentView={currentView} 
        setView={setView} 
        setActiveRole={setActiveRole} 
      />

      <main className="ace-dashboard-main">
        {/* ADMINISTRATIVE SECURITY CLEARANCE BANNER */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
          borderLeft: '4px solid #38BDF8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
              flexShrink: 0
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  ADMINISTRATIVE PRIVILEGE ACTIVE
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>• Executive Clearance Level 1</span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#E2E8F0', lineHeight: 1.4 }}>
                As an <strong>Administrator</strong>, you possess executive oversight to audit user access, manage operational accounts, and securely reset passwords. All passwords are encrypted with one-way cryptographic hashing (Bcrypt) and cannot be recovered in plaintext.
              </p>
            </div>
          </div>

          <div className="admin-banner-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setAddModalOpen(true)}
              className="ace-btn ace-btn-action"
              style={{ fontSize: '12.5px', padding: '7px 16px' }}
            >
              <Plus size={15} />
              <span>Provision User</span>
            </button>
          </div>
        </div>

        {/* Header & Overview Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', color: 'var(--color-primary-blue)', fontWeight: 800, margin: 0 }}>
              Personnel & Credentials Directory
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Administrative oversight for corporate staff dispatchers, warehouse operators, and verified customer portals.
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="ace-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={16} color="var(--color-bright-action)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ACCOUNTS</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-blue)' }}>{users.length}</div>
              </div>
            </div>
            <div className="ace-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck size={16} color="#0D9488" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STAFF DISPATCHERS</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0D9488' }}>
                  {users.filter(u => u.role === 'Staff').length}
                </div>
              </div>
            </div>
            <div className="ace-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#1683D8" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CUSTOMERS</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1683D8' }}>
                  {users.filter(u => u.role === 'Customer').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          {/* Category Filter Tabs */}
          <div className="ace-filter-scroll" style={{ display: 'flex', gap: '8px', maxWidth: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'ALL', label: `All Accounts (${users.length})` },
              { id: 'Staff', label: `Staff Personnel (${users.filter(u => u.role === 'Staff').length})` },
              { id: 'Customer', label: `Customer Accounts (${users.filter(u => u.role === 'Customer').length})` },
              { id: 'Admin', label: `Administrators (${users.filter(u => u.role === 'Admin').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeFilter === tab.id ? '1px solid var(--color-primary-blue)' : '1px solid var(--color-border)',
                  backgroundColor: activeFilter === tab.id ? 'var(--color-primary-blue)' : 'var(--color-white)',
                  color: activeFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: 'min(100%, 240px)', flex: '1 1 240px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search user, email, dept, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ace-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px', width: '100%' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Personnel & Credentials Table */}
        <div className="ace-table-container">
          <table className="ace-table">
            <thead>
              <tr>
                <th>User / Identity</th>
                <th>Role Tier</th>
                <th>Login Email (Clearance)</th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lock size={13} color="#0284C7" />
                    <span>Password Security</span>
                  </div>
                </th>
                <th>Department / Organization</th>
                <th>Access Scope & Clearance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    No accounts matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  return (
                    <tr key={u.id}>
                      {/* Name & Phone */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: u.role === 'Admin' ? '#FEF3C7' : u.role === 'Staff' ? '#CCFBF1' : 'var(--color-light-blue)',
                            color: u.role === 'Admin' ? '#B45309' : u.role === 'Staff' ? '#0F766E' : 'var(--color-primary-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}>
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-primary-blue)', fontSize: '13.5px' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={10} /> {u.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span style={{
                          backgroundColor: u.role === 'Admin' ? '#FEF3C7' : u.role === 'Staff' ? '#CCFBF1' : '#E0F2FE',
                          color: u.role === 'Admin' ? '#B45309' : u.role === 'Staff' ? '#0F766E' : '#0369A1',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {u.role === 'Admin' && <Shield size={11} />}
                          {u.role === 'Staff' && <Truck size={11} />}
                          {u.role === 'Customer' && <Building2 size={11} />}
                          {u.role}
                        </span>
                      </td>

                      {/* Login Email */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                            {u.email}
                          </span>
                          <button
                            onClick={() => handleCopy(u.email, `email-${u.id}`)}
                            title="Copy email"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: copiedField === `email-${u.id}` ? '#10B981' : 'var(--text-muted)'
                            }}
                          >
                            {copiedField === `email-${u.id}` ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Password Security Status & Reset */}
                      <td>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'var(--color-surface)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)'
                        }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            letterSpacing: '2px'
                          }}>
                            ••••••••••••
                          </span>

                          {/* Reset Password Action Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetNewPassword('');
                              setResetNotice({ type: '', text: '' });
                              setResetModalUser(u);
                            }}
                            title="Securely reset password (hashed with Bcrypt)"
                            style={{
                              backgroundColor: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              color: '#0284C7',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <KeyRound size={11} />
                            <span>Reset</span>
                          </button>
                        </div>
                      </td>

                      {/* Department / Org */}
                      <td style={{ fontSize: '12.5px' }}>{u.department}</td>

                      {/* Access Scope */}
                      <td>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          display: 'inline-block',
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={u.accessScope}>
                          {u.accessScope || (u.role === 'Staff' ? 'Dispatcher & Terminal Only' : 'Client Shipments Only')}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: u.status === 'Active' ? '#059669' : '#94A3B8'
                        }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: u.status === 'Active' ? '#10B981' : '#94A3B8' }} />
                          {u.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setInspectUser(u)}
                          className="ace-btn ace-btn-ghost ace-btn-sm"
                          style={{ fontSize: '11.5px', marginRight: '6px', color: 'var(--color-primary-blue)', fontWeight: 600 }}
                        >
                          Inspect Details
                        </button>
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className="ace-btn ace-btn-ghost ace-btn-sm"
                          style={{ fontSize: '11.5px', color: u.status === 'Active' ? '#DC2626' : '#059669' }}
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            MODAL: INSPECT PERSONNEL LOGIN DOSSIER (ADMIN ONLY)
            =================================================== */}
        {inspectUser && (
          <div className="ace-modal-backdrop" onClick={() => setInspectUser(null)}>
            <div className="ace-modal" onClick={e => e.stopPropagation()} style={{ padding: 'clamp(18px, 4vw, 30px)', maxWidth: 'min(560px, calc(100vw - 24px))', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      ADMINISTRATIVE CREDENTIAL DOSSIER
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {inspectUser.id}</span>
                  </div>
                  <h3 style={{ fontSize: '20px', color: 'var(--color-primary-blue)', fontWeight: 800, margin: 0 }}>
                    {inspectUser.name}
                  </h3>
                </div>
                <button 
                  onClick={() => setInspectUser(null)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Administrative Notice */}
              <div style={{
                backgroundColor: 'var(--color-light-blue)',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <ShieldCheck size={20} color="var(--color-bright-action)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--color-primary-blue)', lineHeight: 1.4 }}>
                  Verified Admin Privilege: You are viewing confidential authentication keys and login routing parameters.
                </span>
              </div>

              {/* Credential Details Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {/* Role & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Role</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-blue)', marginTop: '4px' }}>
                      {inspectUser.role}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Account Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: inspectUser.status === 'Active' ? '#059669' : '#94A3B8', marginTop: '4px' }}>
                      {inspectUser.status}
                    </div>
                  </div>
                </div>

                {/* Login Email */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Login Email Address
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {inspectUser.email}
                    </span>
                    <button
                      onClick={() => handleCopy(inspectUser.email, 'modal-email')}
                      className="ace-btn ace-btn-ghost ace-btn-sm"
                      style={{ fontSize: '11.5px', gap: '4px' }}
                    >
                      {copiedField === 'modal-email' ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                      <span>{copiedField === 'modal-email' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Password Security Status & Reset */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Password Security Status
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} color="#059669" />
                      <span>Encrypted & Hashed (Bcrypt)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setResetNewPassword('');
                        setResetNotice({ type: '', text: '' });
                        setResetModalUser(inspectUser);
                      }}
                      className="ace-btn ace-btn-ghost ace-btn-sm"
                      style={{ fontSize: '11.5px', gap: '4px', color: '#0284C7', border: '1px solid #BAE6FD' }}
                    >
                      <KeyRound size={13} />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>

                {/* Phone & Department */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Phone Number</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {inspectUser.phone || '+44 20 7946 0199'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Department / Hub</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {inspectUser.department}
                    </div>
                  </div>
                </div>

                {/* Access Scope */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Access Clearance & Portal Scope
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {inspectUser.accessScope || (
                      inspectUser.role === 'Admin'
                        ? 'Full Executive Authority: Live Telemetry, All Portals, Analytics, User Management & Credential Audits.'
                        : inspectUser.role === 'Staff'
                        ? 'Authorized for Staff Dispatcher and Customer Portal View only. Prohibited from Admin Command.'
                        : 'Authorized for Personal Deliveries & Tracking Telemetry only. Restricted from other accounts.'
                    )}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => toggleStatus(inspectUser.id)}
                    className="ace-btn ace-btn-ghost"
                    style={{ color: inspectUser.status === 'Active' ? '#D97706' : '#059669', fontSize: '13px' }}
                  >
                    {inspectUser.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(inspectUser.id || inspectUser._id || inspectUser.email)}
                    className="ace-btn ace-btn-ghost"
                    style={{ color: '#DC2626', fontSize: '13px', fontWeight: 600 }}
                  >
                    Delete Account
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const dossierText = `User: ${inspectUser.name}\nRole: ${inspectUser.role}\nEmail: ${inspectUser.email}\nPassword Status: Securely Hashed (Bcrypt)\nPhone: ${inspectUser.phone}\nDepartment: ${inspectUser.department}\nAccess Scope: ${inspectUser.accessScope}`;
                      handleCopy(dossierText, 'modal-all');
                    }}
                    className="ace-btn ace-btn-secondary"
                    style={{ fontSize: '13px' }}
                  >
                    {copiedField === 'modal-all' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    <span>{copiedField === 'modal-all' ? 'Dossier Copied!' : 'Copy Full Dossier'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectUser(null)}
                    className="ace-btn ace-btn-action"
                    style={{ fontSize: '13px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            MODAL: ADD NEW USER WITH CREDENTIALS (ADMIN ONLY)
            =================================================== */}
        {addModalOpen && (
          <div className="ace-modal-backdrop" onClick={() => setAddModalOpen(false)}>
            <div className="ace-modal" onClick={e => e.stopPropagation()} style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 'min(500px, calc(100vw - 24px))', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--color-primary-blue)', fontWeight: 800, margin: 0 }}>
                    Provision New Platform Account
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Configure credentials and grant portal permissions.
                  </p>
                </div>
                <button onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddUser}>
                <div className="ace-form-group">
                  <label className="ace-label ace-label-required">Full Name</label>
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="e.g. Samuel Adjei"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="ace-form-group">
                  <label className="ace-label ace-label-required">Email Address (Login Identity)</label>
                  <input
                    type="email"
                    className="ace-input"
                    placeholder="e.g. s.adjei@acelogistics.com"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="ace-form-group">
                  <label className="ace-label ace-label-required">Initial Login Password</label>
                  <input
                    type="password"
                    className="ace-input"
                    placeholder="Min 6 characters"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Password is encrypted with Bcrypt before persistence in MongoDB Atlas.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
                  <div className="ace-form-group">
                    <label className="ace-label ace-label-required">Role Permission</label>
                    <select
                      className="ace-select"
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value)}
                    >
                      <option value="Staff">Staff Dispatcher</option>
                      <option value="Customer">Customer Account</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>

                  <div className="ace-form-group">
                    <label className="ace-label">Contact Phone</label>
                    <input
                      type="text"
                      className="ace-input"
                      value={newUserPhone}
                      onChange={e => setNewUserPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ace-form-group">
                  <label className="ace-label">Department / Branch Organization</label>
                  <input
                    type="text"
                    className="ace-input"
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setAddModalOpen(false)} className="ace-btn ace-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="ace-btn ace-btn-action">
                    Create & Save Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================
            MODAL: SECURE PASSWORD RESET (ADMIN PRIVILEGE)
            =================================================== */}
        {resetModalUser && (
          <div className="ace-modal-backdrop" onClick={() => !isResetting && setResetModalUser(null)}>
            <div className="ace-modal" onClick={e => e.stopPropagation()} style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 'min(460px, calc(100vw - 24px))', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', color: 'var(--color-primary-blue)', fontWeight: 800, margin: 0 }}>
                      Reset User Password
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      Assign a new securely hashed password for {resetModalUser.name}
                    </p>
                  </div>
                </div>
                <button onClick={() => !isResetting && setResetModalUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Account:</span>
                  <strong>{resetModalUser.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Login Email:</span>
                  <span style={{ fontFamily: 'monospace' }}>{resetModalUser.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Role Clearance:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary-blue)' }}>{resetModalUser.role}</span>
                </div>
              </div>

              {resetNotice.text && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: resetNotice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: resetNotice.type === 'success' ? '#065F46' : '#991B1B',
                  border: `1px solid ${resetNotice.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                }}>
                  {resetNotice.text}
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit}>
                <div className="ace-form-group" style={{ marginBottom: '18px' }}>
                  <label className="ace-label ace-label-required">New Temporary or Permanent Password</label>
                  <input
                    type="password"
                    className="ace-input"
                    placeholder="Min 6 characters (e.g. SecurePass#2026)"
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    The password will be hashed using Bcrypt before storage in MongoDB. Original passwords can never be recovered.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="ace-btn ace-btn-ghost"
                    disabled={isResetting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ace-btn ace-btn-action"
                    disabled={isResetting || !resetNewPassword || resetNewPassword.length < 6}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isResetting ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                    <span>{isResetting ? 'Hashing & Saving...' : 'Confirm & Save Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <style>{`
          @media (max-width: 640px) {
            .admin-banner-actions {
              width: 100%;
            }
            .admin-banner-actions button {
              flex: 1;
              justify-content: center;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

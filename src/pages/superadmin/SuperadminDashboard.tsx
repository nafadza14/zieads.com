import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Users, CreditCard, Zap, Cpu, MessageSquare, FileText,
  Key, BarChart2, Activity, Shield, UserCog, Settings, LogOut, Search,
  SlidersHorizontal, Plus, RotateCw, Play, CheckCircle, XCircle, X,
  ChevronRight, Calendar, DollarSign, TrendingUp, UserCheck, UserX,
  ExternalLink, Lock, MoreVertical, AlertTriangle
} from 'lucide-react';
import ZieAdsLogo from '../../components/ZieAdsLogo';

// Predefined list of predefined keys to manage
const PREDEFINED_KEYS = [
  { service_name: 'anthropic', display_name: 'Anthropic Claude API', warning: false, notes: 'Used for AI Chat & Strategic Report dimensions' },
  { service_name: 'stripe_secret', display_name: 'Stripe — Secret Key', warning: false, notes: 'Stripe backend billing transactions' },
  { service_name: 'stripe_webhook', display_name: 'Stripe — Webhook Secret', warning: false, notes: 'Stripe webhook notifications' },
  { service_name: 'resend', display_name: 'Resend — Email API', warning: false, notes: 'For onboarding and notification emails' },
  { service_name: 'supabase_service_role', display_name: 'Supabase — Service Role Key', warning: true, notes: '⚠️ Handle with extreme care. Full DB access.' },
  { service_name: 'twitter', display_name: 'Twitter/X API — Hermes', warning: false, notes: 'Used by HERMES marketing agent' },
  { service_name: 'linkedin', display_name: 'LinkedIn API — Hermes', warning: false, notes: 'Used by HERMES marketing agent' },
  { service_name: 'reddit', display_name: 'Reddit API — Hermes (read-only)', warning: false, notes: 'Used by HERMES marketing agent' },
  { service_name: 'google_search_console', display_name: 'Google Search Console API', warning: false, notes: 'Used for SEO dimensions auditing' },
  { service_name: 'browserbase', display_name: 'Browserbase — Browser Automation', warning: false, notes: 'Used for web rendering/screenshot scanning' }
];

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminProfile, setAdminProfile] = useState<any>({ name: 'Superadmin', email: 'admin@zieads.com', role: 'superadmin' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };

  // Header helpers
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeString = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // ─── DATA STATES ──────────────────────────────────────────
  const [overviewData, setOverviewData] = useState<any>({
    kpi: { mrr: 0, totalUsers: 0, planCounts: { free: 0, starter: 0, pro: 0, agency: 0 }, activeToday: 0, apiCostToday: 0, skillRunsToday: 0, failedSkillRunsToday: 0 },
    signupsChart: [], apiCostChart: [], recentSignups: [], activeAlerts: []
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersFilterPlan, setUsersFilterPlan] = useState('all');
  const [usersFilterStatus, setUsersFilterStatus] = useState('all');
  
  // Selected user for drawer
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingPlan, setEditingPlan] = useState('free');
  const [grantPool, setGrantPool] = useState('ai_chat_daily');
  const [grantAmount, setGrantAmount] = useState(10);
  const [banReason, setBanReason] = useState('');
  
  // Confirm actions modals
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: string; title: string; body: string; confirmText: string; inputVerify?: string; verifyPlaceholder?: string; action: () => void }>({
    open: false, type: 'info', title: '', body: '', confirmText: '', verifyPlaceholder: '', action: () => {}
  });
  const [confirmInput, setConfirmInput] = useState('');

  // Other pages lists
  const [billingOverview, setBillingOverview] = useState<any>({ mrr: 0, newMrrThisMonth: 0, churnedMrrThisMonth: 0, netChange: 0, failedPaymentsCount: 0 });
  const [billingTransactions, setBillingTransactions] = useState<any[]>([]);
  const [creditsSummary, setCreditsSummary] = useState<any>({ ai_messages_today: 0, skill_runs_today: 0, resets_today: 0, grants_this_month: 0, top_users: [] });
  const [creditsTransactions, setCreditsTransactions] = useState<any[]>([]);
  const [skillRuns, setSkillRuns] = useState<any[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [expandedConvMessages, setExpandedConvMessages] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiCostData, setApiCostData] = useState<any>({ summary: { total_cost: '$0.00', anthropic_cost: '$0.00', avg_cost_run: '$0.00', avg_cost_message: '$0.00', projected_monthly: '$0.00' }, distribution: [], plan_economics: [] });
  const [healthData, setHealthData] = useState<any>({ services: [], queue: { queued_runs: 0, processing_runs: 0, oldest_queued: 'None' }, hermes: [] });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [admins, setAdmins] = useState<any[]>([]);

  // Add new API Key Modal
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ serviceName: 'anthropic', displayName: '', keyValue: '', environment: 'production', notes: '' });

  // Add new Admin Modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', role: 'support', password: '' });

  // ─── INITIAL SYNC & TOKEN CHECK ──────────────────────────
  const token = localStorage.getItem('zieads_superadmin_token');

  useEffect(() => {
    if (!token) {
      navigate('/superadmin/login');
      return;
    }
    
    // Load local profile cached
    const profileJson = localStorage.getItem('zieads_superadmin_profile');
    if (profileJson) {
      setAdminProfile(JSON.parse(profileJson));
    }
    
    fetchSession();
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    loadTabDetails(activeTab);
  }, [activeTab, usersPage, usersSearch, usersFilterPlan, usersFilterStatus, auditPage]);

  const fetchSession = async () => {
    try {
      const resp = await fetch('/api/superadmin/v1/auth/session', {
        headers: { 'x-superadmin-session-token': token || '' }
      });
      if (!resp.ok) {
        throw new Error('Session invalid');
      }
      const data = await resp.json();
      setAdminProfile(data.admin);
    } catch {
      localStorage.removeItem('zieads_superadmin_token');
      localStorage.removeItem('zieads_superadmin_profile');
      navigate('/superadmin/login');
    }
  };

  const loadTabDetails = async (tab: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = { 'x-superadmin-session-token': token || '' };
      
      if (tab === 'overview') {
        const resp = await fetch('/api/superadmin/v1/overview', { headers });
        const json = await resp.json();
        if (json.success) setOverviewData(json.data);
      } else if (tab === 'users') {
        const query = new URLSearchParams({
          search: usersSearch,
          plan: usersFilterPlan,
          status: usersFilterStatus,
          page: String(usersPage),
          limit: '20'
        });
        const resp = await fetch(`/api/superadmin/v1/users?${query.toString()}`, { headers });
        const json = await resp.json();
        if (json.success) {
          setUsersList(json.data);
          setUsersCount(json.total);
        }
      } else if (tab === 'billing') {
        const [overRes, txRes] = await Promise.all([
          fetch('/api/superadmin/v1/billing/overview', { headers }),
          fetch('/api/superadmin/v1/billing/transactions', { headers })
        ]);
        const overJson = await overRes.json();
        const txJson = await txRes.json();
        if (overJson.success) setBillingOverview(overJson.data);
        if (txJson.success) setBillingTransactions(txJson.data);
      } else if (tab === 'credits') {
        const [sumRes, txRes] = await Promise.all([
          fetch('/api/superadmin/v1/credits/summary', { headers }),
          fetch('/api/superadmin/v1/credits/transactions', { headers })
        ]);
        const sumJson = await sumRes.json();
        const txJson = await txRes.json();
        if (sumJson.success) setCreditsSummary(sumJson.data);
        if (txJson.success) setCreditsTransactions(txJson.data);
      } else if (tab === 'skill-runs') {
        const resp = await fetch('/api/superadmin/v1/skill-runs', { headers });
        const json = await resp.json();
        if (json.success) setSkillRuns(json.data);
      } else if (tab === 'conversations') {
        const resp = await fetch('/api/superadmin/v1/conversations', { headers });
        const json = await resp.json();
        if (json.success) setConversations(json.data);
      } else if (tab === 'api-keys') {
        if (adminProfile.role === 'superadmin') {
          const resp = await fetch('/api/superadmin/v1/api-keys', { headers });
          const json = await resp.json();
          if (json.success) setApiKeys(json.data);
        }
      } else if (tab === 'api-cost') {
        const resp = await fetch('/api/superadmin/v1/api-cost', { headers });
        const json = await resp.json();
        if (json.success) setApiCostData(json.data);
      } else if (tab === 'health') {
        const resp = await fetch('/api/superadmin/v1/health', { headers });
        const json = await resp.json();
        if (json.success) setHealthData(json.data);
      } else if (tab === 'alerts') {
        const resp = await fetch('/api/superadmin/v1/alerts', { headers });
        const json = await resp.json();
        if (json.success) setAlerts(json.data);
      } else if (tab === 'audit-log') {
        const resp = await fetch(`/api/superadmin/v1/audit-log?page=${auditPage}&limit=20`, { headers });
        const json = await resp.json();
        if (json.success) {
          setAuditLogs(json.data);
          setAuditCount(json.total);
        }
      } else if (tab === 'admins') {
        if (adminProfile.role === 'superadmin') {
          const resp = await fetch('/api/superadmin/v1/admins', { headers });
          const json = await resp.json();
          if (json.success) setAdmins(json.data);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/superadmin/v1/auth/logout', {
        method: 'POST',
        headers: { 'x-superadmin-session-token': token || '' }
      });
    } catch {}
    localStorage.removeItem('zieads_superadmin_token');
    localStorage.removeItem('zieads_superadmin_profile');
    navigate('/superadmin/login');
  };

  // ─── USER DRAWER DETAILS ──────────────────────────────────
  const fetchUserDetail = async (userId: string) => {
    try {
      const resp = await fetch(`/api/superadmin/v1/users/${userId}`, {
        headers: { 'x-superadmin-session-token': token || '' }
      });
      const json = await resp.json();
      if (json.success) {
        setSelectedUser(json.data);
        setEditingPlan(json.data.account.plan_id);
        setDrawerOpen(true);
      }
    } catch {
      showToast('Could not load user profile details', 'error');
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || !selectedUser) return;
    try {
      const resp = await fetch(`/api/superadmin/v1/users/${selectedUser.account.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-session-token': token || ''
        },
        body: JSON.stringify({ note: newNote }),
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        showToast('Internal note saved successfully');
        setSelectedUser({ ...selectedUser, notes: [json.data, ...selectedUser.notes] });
        setNewNote('');
      } else {
        showToast(json.error || 'Failed to save note', 'error');
      }
    } catch {
      showToast('Save note connection error', 'error');
    }
  };

  const triggerPlanChange = async () => {
    if (!selectedUser) return;
    setConfirmModal({
      open: true,
      type: 'warning',
      title: 'Modify Account Plan?',
      body: `This will update ${selectedUser.account.email} plan to ${editingPlan.toUpperCase()}. This directly changes their monthly API credit limits.`,
      confirmText: 'Confirm Plan Change',
      action: async () => {
        try {
          const resp = await fetch(`/api/superadmin/v1/users/${selectedUser.account.id}/plan`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-superadmin-session-token': token || ''
            },
            body: JSON.stringify({ planId: editingPlan }),
          });
          if (resp.ok) {
            showToast('User plan updated successfully');
            fetchUserDetail(selectedUser.account.id);
            loadTabDetails('users');
          } else {
            const data = await resp.json();
            showToast(data.error || 'Failed to change plan', 'error');
          }
        } catch {
          showToast('Plan change connection error', 'error');
        }
      }
    });
  };

  const triggerCreditGrant = async () => {
    if (!selectedUser) return;
    try {
      const resp = await fetch(`/api/superadmin/v1/users/${selectedUser.account.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-session-token': token || ''
        },
        body: JSON.stringify({ pool: grantPool, amount: grantAmount }),
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        showToast(`Granted ${grantAmount} credits to ${poolName(grantPool)} balance`);
        fetchUserDetail(selectedUser.account.id);
      } else {
        showToast(json.error || 'Failed to grant credits', 'error');
      }
    } catch {
      showToast('Credit grant connection error', 'error');
    }
  };

  const triggerSuspendAccount = async (suspend: boolean) => {
    if (!selectedUser) return;
    if (suspend && !banReason.trim()) {
      showToast('Please specify a suspension reason', 'error');
      return;
    }

    setConfirmModal({
      open: true,
      type: 'critical',
      title: suspend ? 'Suspend User Account?' : 'Activate User Account?',
      body: suspend 
        ? `Are you sure you want to suspend ${selectedUser.account.email}? The user will be logged out instantly and shown a suspension banner.` 
        : `Are you sure you want to restore access for ${selectedUser.account.email}?`,
      confirmText: suspend ? 'Suspend' : 'Activate',
      inputVerify: suspend ? selectedUser.account.email : undefined,
      verifyPlaceholder: 'Type email to confirm',
      action: async () => {
        try {
          const resp = await fetch(`/api/superadmin/v1/users/${selectedUser.account.id}/suspend`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-superadmin-session-token': token || ''
            },
            body: JSON.stringify({ isSuspended: suspend, reason: banReason }),
          });
          if (resp.ok) {
            showToast(suspend ? 'Account suspended successfully' : 'Account reactivated');
            setBanReason('');
            fetchUserDetail(selectedUser.account.id);
            loadTabDetails('users');
          } else {
            const data = await resp.json();
            showToast(data.error || 'Operation failed', 'error');
          }
        } catch {
          showToast('Suspension connection error', 'error');
        }
      }
    });
  };

  const triggerImpersonation = async () => {
    if (!selectedUser) return;
    try {
      const resp = await fetch(`/api/superadmin/v1/users/${selectedUser.account.id}/impersonate`, {
        headers: { 'x-superadmin-session-token': token || '' }
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        showToast('Impersonation token generated. Opening dashboard in read-only mode.');
        window.open(json.redirectUrl, '_blank');
      } else {
        showToast(json.error || 'Failed to impersonate', 'error');
      }
    } catch {
      showToast('Impersonation network error', 'error');
    }
  };

  // ─── ALERTS ───────────────────────────────────────────────
  const resolveSystemAlert = async (alertId: string) => {
    try {
      const resp = await fetch(`/api/superadmin/v1/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'x-superadmin-session-token': token || '' }
      });
      if (resp.ok) {
        showToast('System alert marked as resolved');
        loadTabDetails('alerts');
      } else {
        showToast('Could not resolve alert', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
  };

  // ─── API KEYS ACTIONS ──────────────────────────────────────
  const handleAddNewKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch('/api/superadmin/v1/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-session-token': token || ''
        },
        body: JSON.stringify(newKeyForm),
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        showToast('External API credential configured');
        setKeyModalOpen(false);
        setNewKeyForm({ serviceName: 'anthropic', displayName: '', keyValue: '', environment: 'production', notes: '' });
        loadTabDetails('api-keys');
      } else {
        showToast(json.error || 'Failed to configure key', 'error');
      }
    } catch {
      showToast('Network error adding key', 'error');
    }
  };

  const rotateApiKey = async (key: any) => {
    let newKeyVal = '';
    setConfirmModal({
      open: true,
      type: 'warning',
      title: `Rotate ${key.display_name}?`,
      body: `Provide the new secret key value to replace the existing one. The old preview key will be deactivated.`,
      confirmText: 'Rotate Secret Key',
      inputVerify: key.service_name,
      verifyPlaceholder: `Type "${key.service_name}" to confirm`,
      action: async () => {
        if (!newKeyVal) {
          showToast('A new key value is required to rotate.', 'error');
          return;
        }
        try {
          const resp = await fetch(`/api/superadmin/v1/api-keys/${key.id}/rotate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-superadmin-session-token': token || ''
            },
            body: JSON.stringify({ newKeyValue: newKeyVal }),
          });
          if (resp.ok) {
            showToast('Credential rotated successfully');
            loadTabDetails('api-keys');
          } else {
            showToast('Rotation failed', 'error');
          }
        } catch {
          showToast('Connection error', 'error');
        }
      }
    });
    
    // Prompt wrapper helper
    const val = prompt(`Paste the new key value for ${key.display_name}:`);
    if (val) newKeyVal = val;
  };

  const testApiKey = async (keyId: string) => {
    try {
      const resp = await fetch(`/api/superadmin/v1/api-keys/${keyId}/test`, {
        method: 'POST',
        headers: { 'x-superadmin-session-token': token || '' }
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        showToast(json.result);
      } else {
        showToast('Test failed. Key appears invalid or expired.', 'error');
      }
    } catch {
      showToast('Test key connection error', 'error');
    }
  };

  const deactivateApiKey = async (key: any) => {
    setConfirmModal({
      open: true,
      type: 'critical',
      title: `Deactivate ${key.display_name}?`,
      body: `This will mark the credential as inactive. The application will no longer be able to call this API service.`,
      confirmText: 'Deactivate',
      inputVerify: key.service_name,
      verifyPlaceholder: `Type "${key.service_name}" to deactivate`,
      action: async () => {
        try {
          const resp = await fetch(`/api/superadmin/v1/api-keys/${key.id}/deactivate`, {
            method: 'PATCH',
            headers: { 'x-superadmin-session-token': token || '' }
          });
          if (resp.ok) {
            showToast('Key deactivated');
            loadTabDetails('api-keys');
          } else {
            showToast('Failed to deactivate key', 'error');
          }
        } catch {
          showToast('Connection error', 'error');
        }
      }
    });
  };

  // ─── ADMIN USERS CRUD ─────────────────────────────────────
  const handleAddNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch('/api/superadmin/v1/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-session-token': token || ''
        },
        body: JSON.stringify(newAdminForm),
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        showToast('Superadmin team member added');
        setAdminModalOpen(false);
        setNewAdminForm({ name: '', email: '', role: 'support', password: '' });
        loadTabDetails('admins');
      } else {
        showToast(json.error || 'Failed to add admin user', 'error');
      }
    } catch {
      showToast('Network error adding admin', 'error');
    }
  };

  const toggleAdminStatus = async (adminUser: any) => {
    const nextStatus = !adminUser.is_active;
    setConfirmModal({
      open: true,
      type: 'warning',
      title: nextStatus ? 'Enable Admin User?' : 'Disable Admin User?',
      body: `This will toggle access permissions for ${adminUser.name} (${adminUser.email}).`,
      confirmText: nextStatus ? 'Enable' : 'Disable',
      action: async () => {
        try {
          const resp = await fetch(`/api/superadmin/v1/admins/${adminUser.id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-superadmin-session-token': token || ''
            },
            body: JSON.stringify({ isActive: nextStatus }),
          });
          if (resp.ok) {
            showToast(nextStatus ? 'Admin account enabled' : 'Admin account disabled');
            loadTabDetails('admins');
          } else {
            const data = await resp.json();
            showToast(data.error || 'Failed to change admin status', 'error');
          }
        } catch {
          showToast('Connection error', 'error');
        }
      }
    });
  };

  const handleAdminRoleChange = async (adminUser: any, newRole: string) => {
    try {
      const resp = await fetch(`/api/superadmin/v1/admins/${adminUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-session-token': token || ''
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (resp.ok) {
        showToast(`Updated admin role to ${newRole.toUpperCase()}`);
        loadTabDetails('admins');
      } else {
        const data = await resp.json();
        showToast(data.error || 'Failed to update role', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
  };

  // ─── CONVERSATIONS EXPAND THREAD ──────────────────────────
  const toggleConvThread = async (convId: string) => {
    if (expandedConv === convId) {
      setExpandedConv(null);
      setExpandedConvMessages([]);
      return;
    }

    if (adminProfile.role === 'support') {
      showToast('Support role is not authorized to read chat logs.', 'error');
      return;
    }

    setExpandedConv(convId);
    try {
      const resp = await fetch(`/api/superadmin/v1/conversations/${convId}/thread`, {
        headers: { 'x-superadmin-session-token': token || '' }
      });
      const json = await resp.json();
      if (json.success) {
        setExpandedConvMessages(json.data);
      }
    } catch {
      showToast('Failed to fetch conversation thread logs', 'error');
    }
  };

  // ─── UI HELPERS ───────────────────────────────────────────
  const poolName = (p: string) => p === 'ai_chat_daily' ? 'Daily AI Chat' : 'Monthly Skill Runs';
  
  const getPlanBadgeClass = (plan: string) => {
    if (plan === 'starter') return 'bg-[#EFF6FF] text-[#1D4ED8] font-medium';
    if (plan === 'pro') return 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold';
    if (plan === 'agency') return 'bg-[#09090B] text-[#FFFFFF] font-bold';
    return 'bg-[#F4F4F5] text-[#52525B] font-medium';
  };

  const getAlertSeverityClass = (sev: string) => {
    if (sev === 'critical') return 'bg-[#FEF2F2] text-[#B91C1C] font-semibold';
    if (sev === 'warning') return 'bg-[#FEFCE8] text-[#A16207]';
    return 'bg-[#EFF6FF] text-[#1D4ED8]';
  };

  const handleVerifyAction = () => {
    if (confirmModal.inputVerify && confirmInput !== confirmModal.inputVerify) {
      showToast('Target identifier mismatch. Action aborted.', 'error');
      return;
    }
    confirmModal.action();
    setConfirmModal(c => ({ ...c, open: false }));
    setConfirmInput('');
  };

  return (
    <div className="flex h-screen bg-white text-[#09090B] font-sans overflow-hidden">
      
      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="w-[240px] bg-[#09090B] text-[#A1A1AA] flex flex-col shrink-0 border-r border-zinc-800">
        
        {/* Sidebar Header / Logo */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="lp-auth-logo-bg p-1.5 rounded-lg bg-[#27272A] border border-[#3F3F46]">
            <ZieAdsLogo size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-white tracking-tight">zieads</span>
            <span className="text-[9px] font-mono font-bold tracking-widest text-[#B91C1C] uppercase mt-0.5 bg-[#FEF2F2] px-1 py-0.5 rounded leading-none w-fit">superadmin</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 text-sm">
          
          <div>
            <ul className="space-y-1">
              <li 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'overview' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </li>
              <li 
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'alerts' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <div className="flex items-center gap-3">
                  <Bell size={16} />
                  <span>Alerts</span>
                </div>
                {overviewData.activeAlerts.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-red-600 text-white rounded-full">
                    {overviewData.activeAlerts.length}
                  </span>
                )}
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase px-3 mb-2">Customers</div>
            <ul className="space-y-1">
              <li 
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'users' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <Users size={16} />
                <span>All Users</span>
              </li>
              <li 
                onClick={() => setActiveTab('billing')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'billing' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <CreditCard size={16} />
                <span>Billing & Revenue</span>
              </li>
              <li 
                onClick={() => setActiveTab('credits')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'credits' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <Zap size={16} />
                <span>Credits & Usage</span>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase px-3 mb-2">Platform</div>
            <ul className="space-y-1">
              <li 
                onClick={() => setActiveTab('skill-runs')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'skill-runs' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <Cpu size={16} />
                <span>Skill Runs</span>
              </li>
              <li 
                onClick={() => setActiveTab('conversations')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'conversations' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <MessageSquare size={16} />
                <span>AI Conversations</span>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase px-3 mb-2">System</div>
            <ul className="space-y-1">
              {adminProfile.role === 'superadmin' && (
                <li 
                  onClick={() => setActiveTab('api-keys')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'api-keys' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
                >
                  <Key size={16} />
                  <span>API Keys</span>
                </li>
              )}
              <li 
                onClick={() => setActiveTab('api-cost')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'api-cost' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <BarChart2 size={16} />
                <span>API Cost Tracker</span>
              </li>
              <li 
                onClick={() => setActiveTab('health')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'health' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <Activity size={16} />
                <span>System Health</span>
              </li>
              <li 
                onClick={() => setActiveTab('audit-log')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'audit-log' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
              >
                <Shield size={16} />
                <span>Audit Log</span>
              </li>
            </ul>
          </div>

          {adminProfile.role === 'superadmin' && (
            <div>
              <div className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase px-3 mb-2">Team</div>
              <ul className="space-y-1">
                <li 
                  onClick={() => setActiveTab('admins')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${activeTab === 'admins' ? 'bg-[#27272A] text-white font-medium' : 'hover:bg-[#27272A]/40 hover:text-zinc-200'}`}
                >
                  <UserCog size={16} />
                  <span>Admin Users</span>
                </li>
              </ul>
            </div>
          )}

        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#09090b]/80 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-white uppercase select-none">
              {adminProfile.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{adminProfile.name}</div>
              <div className="text-[10px] font-mono text-zinc-500 capitalize">{adminProfile.role}</div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-1.5 border border-zinc-800 hover:border-zinc-700 rounded-md text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">

        {/* Topbar */}
        <header className="h-[56px] border-b border-[#E4E4E7] flex justify-between items-center px-8 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2.5 text-xs text-[#52525B]">
            <span>Good morning</span>
            <span className="text-zinc-350">•</span>
            <span className="font-medium">{dateString}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#71717A]">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
            <span>Last updated: {timeString} · Auto-refreshes 60s</span>
          </div>
        </header>

        {/* Sub-page Content body */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* ════════════ TABS RENDER ════════════ */}

          {/* ── Tab: Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* KPI Strip */}
              <div className="grid grid-cols-5 gap-4">
                
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5 shadow-sm">
                  <div className="text-[11px] font-mono tracking-widest font-semibold text-[#71717A] uppercase">mrr</div>
                  <div className="text-2xl font-bold font-mono text-[#09090B] mt-2">${overviewData.kpi.mrr.toLocaleString()}</div>
                  <div className="text-[10px] text-green-600 mt-1 font-mono">+$290 vs last month</div>
                </div>

                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5 shadow-sm">
                  <div className="text-[11px] font-mono tracking-widest font-semibold text-[#71717A] uppercase">Total Users</div>
                  <div className="text-2xl font-bold font-mono text-[#09090B] mt-2">{overviewData.kpi.totalUsers}</div>
                  <div className="text-[10px] text-[#71717A] mt-1 truncate">
                    F: {overviewData.kpi.planCounts.free} / S: {overviewData.kpi.planCounts.starter} / P: {overviewData.kpi.planCounts.pro} / A: {overviewData.kpi.planCounts.agency}
                  </div>
                </div>

                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5 shadow-sm">
                  <div className="text-[11px] font-mono tracking-widest font-semibold text-[#71717A] uppercase">Active Today</div>
                  <div className="text-2xl font-bold font-mono text-[#09090B] mt-2">{overviewData.kpi.activeToday}</div>
                  <div className="text-[10px] text-green-600 mt-1 font-mono">+2 vs yesterday</div>
                </div>

                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5 shadow-sm">
                  <div className="text-[11px] font-mono tracking-widest font-semibold text-[#71717A] uppercase">API Cost Today</div>
                  <div className={`text-2xl font-bold font-mono mt-2 ${overviewData.kpi.apiCostToday > 50 ? 'text-[#DC2626]' : 'text-[#09090B]'}`}>
                    ${overviewData.kpi.apiCostToday.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#71717A] mt-1 font-mono">Limit: $50.00/day</div>
                </div>

                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5 shadow-sm">
                  <div className="text-[11px] font-mono tracking-widest font-semibold text-[#71717A] uppercase">Skill Runs Today</div>
                  <div className="text-2xl font-bold font-mono text-[#09090B] mt-2">{overviewData.kpi.skillRunsToday}</div>
                  <div className="text-[10px] text-[#71717A] mt-1">
                    <span className={overviewData.kpi.failedSkillRunsToday > 0 ? 'text-[#DC2626]' : ''}>
                      {overviewData.kpi.failedSkillRunsToday} failures
                    </span>
                  </div>
                </div>

              </div>

              {/* Charts Mock Grid */}
              <div className="grid grid-cols-2 gap-8">
                
                <div className="bg-white border border-[#E4E4E7] rounded-lg p-6 shadow-sm">
                  <h3 className="text-xs font-semibold text-[#09090B] mb-4 uppercase tracking-wider">New Signups — Last 30 Days</h3>
                  <div className="h-[200px] flex items-end justify-between gap-1.5 border-b border-[#E4E4E7] pb-1">
                    {overviewData.signupsChart.map((s: any, idx: number) => (
                      <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#09090B] text-white text-[9px] font-mono py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap mb-1 z-20">
                          {s.date}: {s.free + s.paid} (F: {s.free}, P: {s.paid})
                        </div>
                        <div className="w-full bg-[#3B82F6] rounded-t-sm" style={{ height: `${s.paid * 15}px` }}></div>
                        <div className="w-full bg-[#E4E4E7]" style={{ height: `${s.free * 15}px` }}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#71717A] mt-2">
                    <span>{overviewData.signupsChart[0]?.date}</span>
                    <span>{overviewData.signupsChart[29]?.date}</span>
                  </div>
                </div>

                <div className="bg-white border border-[#E4E4E7] rounded-lg p-6 shadow-sm">
                  <h3 className="text-xs font-semibold text-[#09090B] mb-4 uppercase tracking-wider">API Cost — Last 30 Days ($)</h3>
                  <div className="h-[200px] flex items-end justify-between gap-1 border-b border-[#E4E4E7] pb-1">
                    {overviewData.apiCostChart.map((c: any, idx: number) => (
                      <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#09090B] text-white text-[9px] font-mono py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap mb-1 z-20">
                          {c.date}: ${c.total.toFixed(2)} (S: ${c.sonnet}, H: ${c.haiku})
                        </div>
                        <div className="w-full bg-[#2563EB] rounded-t-sm" style={{ height: `${c.total * 8}px` }}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#71717A] mt-2">
                    <span>{overviewData.apiCostChart[0]?.date}</span>
                    <span>{overviewData.apiCostChart[29]?.date}</span>
                  </div>
                </div>

              </div>

              {/* Plan Distribution breakdown */}
              <div>
                <h3 className="text-xs font-semibold text-[#52525B] mb-4 uppercase tracking-wider">Plan Distribution</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span>Free</span>
                      <span className="font-bold">{overviewData.kpi.planCounts.free}</span>
                    </div>
                    <div className="w-full bg-[#E4E4E7] h-1.5 rounded-full mt-2">
                      <div className="bg-zinc-400 h-1.5 rounded-full" style={{ width: `${(overviewData.kpi.planCounts.free / (overviewData.kpi.totalUsers || 1)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span>Starter $29</span>
                      <span className="font-bold">{overviewData.kpi.planCounts.starter}</span>
                    </div>
                    <div className="w-full bg-[#E4E4E7] h-1.5 rounded-full mt-2">
                      <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${(overviewData.kpi.planCounts.starter / (overviewData.kpi.totalUsers || 1)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span>Pro $79</span>
                      <span className="font-bold">{overviewData.kpi.planCounts.pro}</span>
                    </div>
                    <div className="w-full bg-[#E4E4E7] h-1.5 rounded-full mt-2">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(overviewData.kpi.planCounts.pro / (overviewData.kpi.totalUsers || 1)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span>Agency $199</span>
                      <span className="font-bold">{overviewData.kpi.planCounts.agency}</span>
                    </div>
                    <div className="w-full bg-[#E4E4E7] h-1.5 rounded-full mt-2">
                      <div className="bg-zinc-950 h-1.5 rounded-full" style={{ width: `${(overviewData.kpi.planCounts.agency / (overviewData.kpi.totalUsers || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row Activity */}
              <div className="grid grid-cols-2 gap-8">
                
                {/* Recent Signups */}
                <div className="bg-white border border-[#E4E4E7] rounded-lg p-6 shadow-sm">
                  <h3 className="text-xs font-semibold text-[#09090B] mb-4 uppercase tracking-wider">Recent Signups</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#F4F4F5] text-[#71717A] uppercase font-mono tracking-wider">
                          <th className="py-2">Email</th>
                          <th className="py-2">Plan</th>
                          <th className="py-2 text-right">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewData.recentSignups.map((s: any, idx: number) => (
                          <tr 
                            key={idx} 
                            onClick={() => { fetchUserDetail(s.id); setActiveTab('users'); }}
                            className="border-b border-[#F4F4F5] hover:bg-[#FAFAFA] cursor-pointer"
                          >
                            <td className="py-3 font-medium text-[#09090B]">{s.email}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${getPlanBadgeClass(s.plan_id)}`}>
                                {s.plan_id}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono text-[#71717A]">
                              {new Date(s.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                        {overviewData.recentSignups.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-zinc-400">No recent signups.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Active System Alerts */}
                <div className="bg-white border border-[#E4E4E7] rounded-lg p-6 shadow-sm">
                  <h3 className="text-xs font-semibold text-[#09090B] mb-4 uppercase tracking-wider">Active System Alerts</h3>
                  <div className="space-y-3">
                    {overviewData.activeAlerts.map((a: any, idx: number) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveTab('alerts')}
                        className="p-3 border border-[#E4E4E7] rounded-lg bg-[#FAFAFA] flex justify-between items-center cursor-pointer hover:bg-zinc-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getAlertSeverityClass(a.severity)}`}>
                            {a.severity}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-[#09090B]">{a.title}</div>
                            <div className="text-[10px] text-[#71717A] font-mono mt-0.5">{new Date(a.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-zinc-400" />
                      </div>
                    ))}
                    {overviewData.activeAlerts.length === 0 && (
                      <div className="py-8 text-center text-zinc-400 text-xs">
                        <CheckCircle className="mx-auto text-green-500 mb-2" size={24} />
                        <span>All systems healthy. No active alerts.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── Tab: Alerts ── */}
          {activeTab === 'alerts' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">Active Alerts</h2>
                <p className="text-xs text-[#71717A]">Resolve anomalous service events and alert rules exceptions.</p>
              </div>

              {/* Active list */}
              <div className="grid grid-cols-1 gap-4">
                {alerts.filter(a => !a.is_resolved).map((a: any) => (
                  <div key={a.id} className="border border-[#E4E4E7] rounded-lg p-5 shadow-sm bg-white flex justify-between items-start">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${getAlertSeverityClass(a.severity)}`}>
                          {a.severity}
                        </span>
                        <h3 className="text-sm font-semibold text-[#09090B]">{a.title}</h3>
                      </div>
                      <p className="text-xs text-[#52525B] leading-relaxed pt-1">{a.body}</p>
                      <div className="text-[10px] text-[#71717A] font-mono pt-2">
                        Triggered at: {new Date(a.created_at).toLocaleString()}
                        {a.entity_id && ` • Target Entity: [${a.entity_type}:${a.entity_id}]`}
                      </div>
                    </div>
                    <button 
                      onClick={() => resolveSystemAlert(a.id)}
                      className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded hover:bg-zinc-800 transition"
                    >
                      Mark Resolved
                    </button>
                  </div>
                ))}
                {alerts.filter(a => !a.is_resolved).length === 0 && (
                  <div className="border border-dashed border-[#E4E4E7] rounded-lg p-8 text-center bg-[#FAFAFA]">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={28} />
                    <span className="text-sm font-medium text-zinc-500">No active unresolved alerts</span>
                  </div>
                )}
              </div>

              {/* Resolved history table */}
              <div>
                <h3 className="text-sm font-semibold text-[#09090B] mb-4">Resolved Alerts Archive</h3>
                <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">Severity</th>
                        <th className="p-4">Resolved Date</th>
                        <th className="p-4">Triggered Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.filter(a => a.is_resolved).map((a: any) => (
                        <tr key={a.id} className="border-b border-[#F4F4F5] hover:bg-[#FAFAFA]">
                          <td className="p-4 font-semibold text-[#09090B]">{a.title}</td>
                          <td className="p-4">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600 uppercase">
                              {a.severity}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[#71717A]">{new Date(a.resolved_at).toLocaleString()}</td>
                          <td className="p-4 font-mono text-[#71717A]">{new Date(a.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {alerts.filter(a => a.is_resolved).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-zinc-400">No resolved alerts in archives.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Configurable Alert Rules */}
              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-6">
                <h3 className="text-sm font-semibold text-[#09090B] mb-4">Alert Rules Thresholds</h3>
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-zinc-500 font-mono uppercase mb-1.5">Daily API cost limit ($)</label>
                      <input type="number" readOnly value={50} className="h-9 w-full bg-white border border-[#E4E4E7] rounded px-3 text-[#09090B] font-mono outline-none" />
                    </div>
                    <div>
                      <label className="block text-zinc-500 font-mono uppercase mb-1.5">Single user daily cost trigger ($)</label>
                      <input type="number" readOnly value={10} className="h-9 w-full bg-white border border-[#E4E4E7] rounded px-3 text-[#09090B] font-mono outline-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-zinc-500 font-mono uppercase mb-1.5">Skill run hourly failure rate (%)</label>
                      <input type="number" readOnly value={5} className="h-9 w-full bg-white border border-[#E4E4E7] rounded px-3 text-[#09090B] font-mono outline-none" />
                    </div>
                    <div>
                      <label className="block text-zinc-500 font-mono uppercase mb-1.5">Free tier daily runs abuse trigger</label>
                      <input type="number" readOnly value={15} className="h-9 w-full bg-white border border-[#E4E4E7] rounded px-3 text-[#09090B] font-mono outline-none" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── Tab: All Users ── */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">Customers & Accounts</h2>
                <p className="text-xs text-[#71717A]">Monitor user profiles, billing packages, credit allocations, and internal support notes.</p>
              </div>

              {/* Filters Panel */}
              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-4 flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search by email..."
                    value={usersSearch}
                    onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                    className="h-10 w-full pl-10 pr-4 bg-white border border-[#E4E4E7] rounded-md text-xs focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#71717A]">Plan:</span>
                  <select 
                    value={usersFilterPlan}
                    onChange={(e) => { setUsersFilterPlan(e.target.value); setUsersPage(1); }}
                    className="h-10 px-3 bg-white border border-[#E4E4E7] rounded-md focus:outline-none"
                  >
                    <option value="all">All Packages</option>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#71717A]">Status:</span>
                  <select 
                    value={usersFilterStatus}
                    onChange={(e) => { setUsersFilterStatus(e.target.value); setUsersPage(1); }}
                    className="h-10 px-3 bg-white border border-[#E4E4E7] rounded-md focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="banned">Banned Only</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                    <tr>
                      <th className="p-4 font-semibold">Email</th>
                      <th className="p-4 font-semibold">Plan</th>
                      <th className="p-4 font-semibold">Joined Date</th>
                      <th className="p-4 font-semibold">Last Active</th>
                      <th className="p-4 font-semibold text-right">Skill Runs</th>
                      <th className="p-4 font-semibold text-right">AI Messages</th>
                      <th className="p-4 font-semibold text-right">API Cost</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u: any) => (
                      <tr 
                        key={u.id} 
                        onClick={() => fetchUserDetail(u.id)}
                        className={`border-b border-[#F4F4F5] hover:bg-[#FAFAFA] cursor-pointer ${u.is_banned ? 'bg-red-500/[0.02]' : ''}`}
                      >
                        <td className="p-4">
                          <div className="font-semibold text-[#09090B] flex items-center gap-2">
                            <span>{u.email}</span>
                            {u.is_banned && (
                              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#FEF2F2] text-[#B91C1C] rounded">BANNED</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${getPlanBadgeClass(u.plan_id)}`}>
                            {u.plan_id}
                          </span>
                        </td>
                        <td className="p-4 text-[#71717A] font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-[#71717A] font-mono">{new Date(u.last_active).toLocaleDateString()}</td>
                        <td className="p-4 text-right font-mono text-[#09090B]">{u.skill_runs_total}</td>
                        <td className="p-4 text-right font-mono text-[#09090B]">{u.ai_messages_total}</td>
                        <td className="p-4 text-right font-mono text-[#52525B] font-semibold">${u.api_cost_total.toFixed(2)}</td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => fetchUserDetail(u.id)}
                            className="p-1 hover:bg-[#F4F4F5] rounded"
                          >
                            <MoreVertical size={14} className="text-zinc-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-zinc-400">No users match the search parameters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersCount > 20 && (
                <div className="flex justify-between items-center text-xs font-mono text-[#71717A]">
                  <span>Showing {(usersPage - 1) * 20 + 1} to {Math.min(usersPage * 20, usersCount)} of {usersCount} users</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={usersPage === 1}
                      onClick={() => setUsersPage(p => Math.max(p - 1, 1))}
                      className="px-3 h-8 border border-[#E4E4E7] rounded hover:bg-[#FAFAFA] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button 
                      disabled={usersPage * 20 >= usersCount}
                      onClick={() => setUsersPage(p => p + 1)}
                      className="px-3 h-8 border border-[#E4E4E7] rounded hover:bg-[#FAFAFA] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* All other tabs render */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">Billing & Revenue</h2>
                <p className="text-xs text-[#71717A]">Track Monthly Recurring Revenue (MRR), plan distribution economics, and transactional logs.</p>
              </div>

              {/* Stripe KPI strip */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">mrr</span>
                  <div className="text-2xl font-bold font-mono mt-2">${billingOverview.mrr.toLocaleString()}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">New MRR This Month</span>
                  <div className="text-2xl font-bold font-mono text-green-600 mt-2">+${billingOverview.newMrrThisMonth}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Churned MRR</span>
                  <div className="text-2xl font-bold font-mono text-red-600 mt-2">-${billingOverview.churnedMrrThisMonth}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Net Monthly Change</span>
                  <div className={`text-2xl font-bold font-mono mt-2 ${billingOverview.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${billingOverview.netChange >= 0 ? '+' : ''}{billingOverview.netChange}
                  </div>
                </div>
              </div>

              {/* Transactions Log */}
              <div>
                <h3 className="text-xs font-semibold text-[#52525B] mb-4 uppercase tracking-wider">Recent Transactions (Stripe)</h3>
                <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                      <tr>
                        <th className="p-4">Charge ID</th>
                        <th className="p-4">User Email</th>
                        <th className="p-4">Plan</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingTransactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-[#F4F4F5]">
                          <td className="p-4 font-mono font-medium text-[#2563EB] hover:underline cursor-pointer">{tx.id}</td>
                          <td className="p-4 font-semibold text-[#09090B]">{tx.user_email}</td>
                          <td className="p-4">{tx.plan}</td>
                          <td className="p-4 font-mono font-semibold text-[#09090B]">{tx.amount}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-700 border border-green-200">
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[#71717A]">{new Date(tx.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Credits & Usage Tab */}
          {activeTab === 'credits' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">Credits & API Usage</h2>
                <p className="text-xs text-[#71717A]">Audit manual credit grants, live transaction logs, and consumption behaviors.</p>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">AI Messages Today</span>
                  <div className="text-2xl font-bold font-mono mt-2">{creditsSummary.ai_messages_today}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Skill Runs Today</span>
                  <div className="text-2xl font-bold font-mono mt-2">{creditsSummary.skill_runs_today}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Daily Resets Triggered</span>
                  <div className="text-2xl font-bold font-mono mt-2">{creditsSummary.resets_today}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Credits Granted (Month)</span>
                  <div className="text-2xl font-bold font-mono text-blue-600 mt-2">{creditsSummary.grants_this_month} grants</div>
                </div>
              </div>

              {/* Top Heaviest Users */}
              <div>
                <h3 className="text-xs font-semibold text-[#52525B] mb-4 uppercase tracking-wider">Top 10 Heaviest Users Today</h3>
                <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4 text-right">Lifetime AI Messages</th>
                        <th className="p-4 text-right">Lifetime Skill Runs</th>
                        <th className="p-4 text-right">Est. API Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditsSummary.top_users.map((tu: any, idx: number) => (
                        <tr key={idx} className="border-b border-[#F4F4F5] hover:bg-[#FAFAFA] cursor-pointer">
                          <td className="p-4 font-semibold text-[#09090B]">{tu.email}</td>
                          <td className="p-4 text-right font-mono">{tu.ai_messages}</td>
                          <td className="p-4 text-right font-mono">{tu.skill_runs}</td>
                          <td className="p-4 text-right font-mono font-semibold">${tu.cost.toFixed(2)}</td>
                        </tr>
                      ))}
                      {creditsSummary.top_users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-zinc-400">No active usage metrics logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Credit Transaction Log */}
              <div>
                <h3 className="text-xs font-semibold text-[#52525B] mb-4 uppercase tracking-wider">Credit Transaction Log</h3>
                <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Pool</th>
                        <th className="p-4 text-right">Delta</th>
                        <th className="p-4 text-right">Balance After</th>
                        <th className="p-4">Operation</th>
                        <th className="p-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditsTransactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-[#F4F4F5]">
                          <td className="p-4 font-semibold text-[#09090B]">{tx.user_email}</td>
                          <td className="p-4 capitalize">{tx.transaction_type}</td>
                          <td className="p-4 font-mono text-[10px] text-zinc-500">{tx.credit_pool}</td>
                          <td className={`p-4 text-right font-mono font-bold ${tx.credits_delta >= 0 ? 'text-green-600' : 'text-[#09090B]'}`}>
                            {tx.credits_delta >= 0 ? '+' : ''}{tx.credits_delta}
                          </td>
                          <td className="p-4 text-right font-mono">{tx.credits_after}</td>
                          <td className="p-4 text-zinc-500 font-mono text-[10px]">{tx.operation_id || '—'}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">{new Date(tx.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {creditsTransactions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-400">No transaction logs in buffer.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Skill Runs Tab */}
          {activeTab === 'skill-runs' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">Skill Runs Log</h2>
                <p className="text-xs text-[#71717A]">Granular output and cost metrics of individual agent execution cycles.</p>
              </div>

              <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                    <tr>
                      <th className="p-4">Run ID</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Skill</th>
                      <th className="p-4">URL Scanned</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Tokens (In/Out)</th>
                      <th className="p-4 text-right">Cost</th>
                      <th className="p-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillRuns.map((r: any) => (
                      <React.Fragment key={r.id}>
                        <tr 
                          onClick={() => setExpandedRun(expandedRun === r.id ? null : r.id)}
                          className="border-b border-[#F4F4F5] hover:bg-[#FAFAFA] cursor-pointer"
                        >
                          <td className="p-4 font-mono font-medium text-[#2563EB]">{r.id.slice(0, 8)}</td>
                          <td className="p-4 font-semibold text-[#09090B]">{r.user_email}</td>
                          <td className="p-4">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-mono border border-blue-100">
                              {r.skill_command}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-500 font-mono truncate max-w-[200px]" title={r.website_url}>{r.website_url}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-700 font-medium">
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-zinc-500">{r.input_tokens} / {r.output_tokens}</td>
                          <td className="p-4 text-right font-mono font-bold text-[#09090B]">${r.cost_usd.toFixed(4)}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                        {expandedRun === r.id && (
                          <tr>
                            <td colSpan={8} className="bg-[#FAFAFA] p-6 border-b border-[#E4E4E7]">
                              <div className="space-y-3">
                                <span className="text-xs font-semibold text-[#09090B] block">Execution Output JSON:</span>
                                <pre className="p-4 bg-[#18181B] text-zinc-200 rounded-lg text-[10px] font-mono overflow-auto max-h-[300px] shadow-inner">
                                  {JSON.stringify(r.result_json || {}, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {skillRuns.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-zinc-400">No skill runs logged in database yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* AI Conversations Tab */}
          {activeTab === 'conversations' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">AI Conversations Log</h2>
                <p className="text-xs text-[#71717A]">
                  Review message thread interactions with the marketing intelligence agent. 
                  {adminProfile.role === 'support' && ' 🔒 Logs are restricted to admin/superadmin roles.'}
                </p>
              </div>

              <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                    <tr>
                      <th className="p-4">Conversation ID</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Analysis Mode</th>
                      <th className="p-4 text-right">Messages</th>
                      <th className="p-4 text-right">Credits Used</th>
                      <th className="p-4 text-right">Created At</th>
                      <th className="p-4 text-right">Last Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map((c: any) => (
                      <React.Fragment key={c.id}>
                        <tr 
                          onClick={() => toggleConvThread(c.id)}
                          className="border-b border-[#F4F4F5] hover:bg-[#FAFAFA] cursor-pointer"
                        >
                          <td className="p-4 font-mono font-medium text-[#2563EB]">{c.id}</td>
                          <td className="p-4 font-semibold text-[#09090B]">{c.user_email}</td>
                          <td className="p-4">{c.active_mode}</td>
                          <td className="p-4 text-right font-mono">{c.message_count}</td>
                          <td className="p-4 text-right font-mono">{c.total_credits_used}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">{new Date(c.updated_at).toLocaleDateString()}</td>
                        </tr>
                        {expandedConv === c.id && adminProfile.role !== 'support' && (
                          <tr>
                            <td colSpan={7} className="bg-[#FAFAFA] p-6 border-b border-[#E4E4E7]">
                              <div className="max-w-3xl mx-auto space-y-4">
                                <span className="text-xs font-semibold text-[#09090B] block border-b border-zinc-200 pb-2">Read-Only Conversation Thread</span>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 border border-zinc-200 rounded-lg bg-white shadow-inner">
                                  {expandedConvMessages.map((msg: any) => (
                                    <div 
                                      key={msg.id}
                                      className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                    >
                                      <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-[#09090B] text-white rounded-tr-none' : 'bg-[#F4F4F5] text-[#09090B] rounded-tl-none border border-zinc-200'}`}>
                                        {msg.content}
                                      </div>
                                      <span className="text-[9px] text-zinc-400 font-mono mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                    </div>
                                  ))}
                                  {expandedConvMessages.length === 0 && (
                                    <div className="text-center py-6 text-zinc-400 text-xs">No message logs returned for this conversation.</div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {conversations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-400">No conversations logged in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api-keys' && adminProfile.role === 'superadmin' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-[#09090B] mb-1 font-sans">External API Credentials</h2>
                  <p className="text-xs text-[#71717A]">Configure third-party service tokens. Values are encrypted at rest.</p>
                </div>
                <button 
                  onClick={() => setKeyModalOpen(true)}
                  className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md flex items-center gap-2 shadow transition"
                >
                  <Plus size={15} />
                  <span>Configure New Key</span>
                </button>
              </div>

              {/* Grid of keys */}
              <div className="grid grid-cols-2 gap-6">
                {PREDEFINED_KEYS.map((k: any) => {
                  const existing = apiKeys.find(ak => ak.service_name === k.service_name);
                  return (
                    <div key={k.service_name} className="border border-[#E4E4E7] rounded-lg p-6 bg-white shadow-sm flex flex-col justify-between h-[180px]">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-semibold text-[#09090B]">{k.display_name}</h3>
                            <span className="text-[10px] font-mono text-[#71717A] mt-0.5 block">{k.service_name}</span>
                          </div>
                          {existing ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${existing.is_active ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-red-50 text-red-700'}`}>
                              {existing.is_active ? 'Active' : 'Inactive'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-400">Not Configured</span>
                          )}
                        </div>
                        <p className="text-xs text-[#71717A] mt-3 line-clamp-2">{k.notes}</p>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-[#F4F4F5] mt-auto">
                        <span className="font-mono text-xs text-[#52525B]">
                          {existing ? existing.key_preview : '••••••••••••'}
                        </span>
                        
                        <div className="flex gap-2">
                          {existing && (
                            <>
                              <button 
                                onClick={() => testApiKey(existing.id)}
                                className="px-2.5 py-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[10px] font-semibold rounded transition"
                              >
                                Test
                              </button>
                              <button 
                                onClick={() => rotateApiKey(existing)}
                                className="px-2.5 py-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[10px] font-semibold rounded transition"
                              >
                                Rotate
                              </button>
                              {existing.is_active && (
                                <button 
                                  onClick={() => deactivateApiKey(existing)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#B91C1C] text-[10px] font-semibold rounded border border-red-200 transition"
                                >
                                  Deactivate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* API Cost Tracker Tab */}
          {activeTab === 'api-cost' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">API Cost Analytics</h2>
                <p className="text-xs text-[#71717A]">Granular cost auditing per model execution, operation types, and unit economics margins.</p>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Total API Cost</span>
                  <div className="text-2xl font-bold font-mono mt-2">{apiCostData.summary.total_cost}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Anthropic Claude Cost</span>
                  <div className="text-2xl font-bold font-mono mt-2">{apiCostData.summary.anthropic_cost}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Cost / Skill Run</span>
                  <div className="text-2xl font-bold font-mono mt-2">{apiCostData.summary.avg_cost_run}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Cost / Message</span>
                  <div className="text-2xl font-bold font-mono mt-2">{apiCostData.summary.avg_cost_message}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-5">
                  <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">Projected (Month)</span>
                  <div className="text-2xl font-bold font-mono mt-2">{apiCostData.summary.projected_monthly}</div>
                </div>
              </div>

              {/* Economics table */}
              <div>
                <h3 className="text-xs font-semibold text-[#52525B] mb-4 uppercase tracking-wider">Gross Margin by Plan — This Month</h3>
                <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                      <tr>
                        <th className="p-4">Plan</th>
                        <th className="p-4 text-right">Active Users</th>
                        <th className="p-4 text-right">Plan Revenue</th>
                        <th className="p-4 text-right">Total API Cost</th>
                        <th className="p-4 text-right">Gross Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiCostData.plan_economics.map((pe: any, idx: number) => {
                        const marginNum = parseFloat(pe.margin);
                        const isUnderThreshold = !isNaN(marginNum) && marginNum < 65;
                        return (
                          <tr key={idx} className={`border-b border-[#F4F4F5] ${isUnderThreshold ? 'bg-[#FEF2F2]' : ''}`}>
                            <td className="p-4 font-semibold text-[#09090B]">{pe.plan}</td>
                            <td className="p-4 text-right font-mono">{pe.users}</td>
                            <td className="p-4 text-right font-mono font-semibold">${pe.revenue}</td>
                            <td className="p-4 text-right font-mono text-zinc-500">${pe.cost.toFixed(2)}</td>
                            <td className={`p-4 text-right font-mono font-bold ${isUnderThreshold ? 'text-[#B91C1C]' : 'text-green-600'}`}>
                              {pe.margin}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-[#71717A] mt-2 font-mono">Gross margin target is &gt;= 65%. Failures highlighted in red.</div>
              </div>

            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1 font-sans">System Health</h2>
                <p className="text-xs text-[#71717A]">Real-time connectivity monitoring, error logs, and HERMES cron statuses.</p>
              </div>

              {/* Service status list */}
              <div className="grid grid-cols-3 gap-6">
                {healthData.services.map((s: any, idx: number) => (
                  <div key={idx} className="border border-[#E4E4E7] rounded-lg p-5 bg-white shadow-sm flex items-start gap-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 flex-shrink-0 animate-pulse"></span>
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-[#09090B] uppercase tracking-wider">{s.name}</h3>
                      <div className="text-xs text-[#52525B]">{s.check}</div>
                      <div className="text-[10px] text-[#71717A] font-mono">Threshold: {s.threshold}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* HERMES Agent status */}
              <div>
                <h3 className="text-xs font-semibold text-[#52525B] mb-4 uppercase tracking-wider">HERMES Cron Jobs Status</h3>
                <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                      <tr>
                        <th className="p-4">Job Name</th>
                        <th className="p-4">Last Run</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Next Scheduled Run</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthData.hermes.map((h: any, idx: number) => (
                        <tr key={idx} className="border-b border-[#F4F4F5]">
                          <td className="p-4 font-mono font-semibold text-[#09090B]">{h.name}</td>
                          <td className="p-4 text-zinc-500">{h.last_run}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-700 font-medium border border-green-200">
                              {h.status}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-500 font-mono">{h.next_run}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit-log' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div>
                <h2 className="text-lg font-bold text-[#09090B] mb-1">Superadmin Audit Log</h2>
                <p className="text-xs text-[#71717A]">Immutable audit trail of administrator activities inside the superadmin dashboard.</p>
              </div>

              <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                    <tr>
                      <th className="p-4">Done By</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Entity</th>
                      <th className="p-4">Target ID</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-[#F4F4F5]">
                        <td className="p-4 font-semibold text-[#09090B]">{log.superadmin_email}</td>
                        <td className="p-4">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-700 font-mono border border-zinc-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500 capitalize">{log.entity_type}</td>
                        <td className="p-4 font-mono text-zinc-500 text-[10px]">{log.entity_id || '—'}</td>
                        <td className="p-4 font-mono text-[#52525B]">{log.ip_address}</td>
                        <td className="p-4 text-right font-mono text-zinc-400">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-400">No logs returned in search window.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditCount > 20 && (
                <div className="flex justify-between items-center text-xs font-mono text-[#71717A]">
                  <span>Showing {(auditPage - 1) * 20 + 1} to {Math.min(auditPage * 20, auditCount)} of {auditCount} logs</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={auditPage === 1}
                      onClick={() => setAuditPage(p => Math.max(p - 1, 1))}
                      className="px-3 h-8 border border-[#E4E4E7] rounded hover:bg-[#FAFAFA] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button 
                      disabled={auditPage * 20 >= auditCount}
                      onClick={() => setAuditPage(p => p + 1)}
                      className="px-3 h-8 border border-[#E4E4E7] rounded hover:bg-[#FAFAFA] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Admin Users Tab */}
          {activeTab === 'admins' && adminProfile.role === 'superadmin' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-[#09090B] mb-1">Superadmin Administrators</h2>
                  <p className="text-xs text-[#71717A]">Manage team member account access rights and TOTP security.</p>
                </div>
                <button 
                  onClick={() => setAdminModalOpen(true)}
                  className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md flex items-center gap-2 shadow transition"
                >
                  <Plus size={15} />
                  <span>Add Team Member</span>
                </button>
              </div>

              <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#71717A] font-mono uppercase">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4">Last Login IP</th>
                      <th className="p-4">Status</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((adm: any) => (
                      <tr key={adm.id} className="border-b border-[#F4F4F5] hover:bg-[#FAFAFA]">
                        <td className="p-4 font-semibold text-[#09090B]">{adm.name}</td>
                        <td className="p-4 text-zinc-500 font-mono">{adm.email}</td>
                        <td className="p-4">
                          <select 
                            value={adm.role}
                            onChange={(e) => handleAdminRoleChange(adm, e.target.value)}
                            className="bg-white border border-zinc-200 rounded px-2 py-1 focus:outline-none"
                          >
                            <option value="superadmin">Superadmin</option>
                            <option value="admin">Admin</option>
                            <option value="support">Support</option>
                          </select>
                        </td>
                        <td className="p-4 font-mono text-zinc-400">
                          {adm.last_login_at ? new Date(adm.last_login_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="p-4 font-mono text-zinc-400">{adm.last_login_ip || '—'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${adm.is_active ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-red-50 text-red-700'}`}>
                            {adm.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => toggleAdminStatus(adm)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold ${adm.is_active ? 'bg-red-50 text-red-700 border border-red-100 hover:bg-red-100' : 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100'}`}
                          >
                            {adm.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ─── TOAST NOTIFICATIONS ─── */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 text-xs font-semibold animate-slideUp text-white ${toast.type === 'success' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ─── CONFIRM ACTION MODAL ─── */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-[#09090b]/40 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="w-full max-w-[400px] bg-white border border-[#E4E4E7] rounded-xl p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-[#09090B] mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-[#52525B] leading-relaxed mb-4">{confirmModal.body}</p>

            {confirmModal.inputVerify && (
              <div className="mb-4">
                <label className="block text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1.5">
                  Confirm verification details
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={confirmModal.verifyPlaceholder || 'Type target here'}
                  className="w-full h-9 bg-[#FAFAFA] border border-[#E4E4E7] rounded px-3 text-xs outline-none focus:border-zinc-400 font-mono"
                />
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button 
                onClick={() => { setConfirmModal(c => ({ ...c, open: false })); setConfirmInput(''); }}
                className="px-3.5 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded text-xs font-semibold text-zinc-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifyAction}
                className={`px-3.5 py-1.5 text-white text-xs font-semibold rounded transition ${confirmModal.type === 'critical' ? 'bg-[#DC2626] hover:bg-[#DC2626]/90 shadow-md shadow-red-500/10' : 'bg-zinc-950 hover:bg-zinc-800'}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIGURE KEY MODAL ─── */}
      {keyModalOpen && (
        <div className="fixed inset-0 bg-[#09090b]/40 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="w-full max-w-[420px] bg-white border border-[#E4E4E7] rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#F4F4F5]">
              <h3 className="text-sm font-bold text-[#09090B]">Configure External API Credential</h3>
              <button onClick={() => setKeyModalOpen(false)} className="p-1 hover:bg-[#F4F4F5] rounded">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddNewKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Service Identifier</label>
                <select 
                  value={newKeyForm.serviceName}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, serviceName: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                >
                  <option value="anthropic">Anthropic Claude API</option>
                  <option value="stripe_secret">Stripe — Secret Key</option>
                  <option value="stripe_webhook">Stripe — Webhook Secret</option>
                  <option value="resend">Resend — Email API</option>
                  <option value="supabase_service_role">Supabase — Service Role Key</option>
                  <option value="twitter">Twitter/X API — Hermes</option>
                  <option value="linkedin">LinkedIn API — Hermes</option>
                  <option value="reddit">Reddit API — Hermes (read-only)</option>
                  <option value="google_search_console">Google Search Console API</option>
                  <option value="browserbase">Browserbase — Browser Automation</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Display Label</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Anthropic Claude Production Key"
                  value={newKeyForm.displayName}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, displayName: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Credential Value</label>
                <input 
                  type="password" 
                  required
                  placeholder="sk-ant-..."
                  value={newKeyForm.keyValue}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, keyValue: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Deployment Environment</label>
                <select 
                  value={newKeyForm.environment}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, environment: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Admin Notes</label>
                <textarea 
                  placeholder="Optional usage notes..."
                  value={newKeyForm.notes}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, notes: e.target.value })}
                  className="w-full border border-[#E4E4E7] bg-white rounded p-3 h-20 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setKeyModalOpen(false)}
                  className="px-4 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded shadow-md"
                >
                  Configure Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD ADMIN MODAL ─── */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-[#09090b]/40 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="w-full max-w-[400px] bg-white border border-[#E4E4E7] rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#F4F4F5]">
              <h3 className="text-sm font-bold text-[#09090B]">Add Team Administrator</h3>
              <button onClick={() => setAdminModalOpen(false)} className="p-1 hover:bg-[#F4F4F5] rounded">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddNewAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. support specialist"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. team@zieads.com"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Role Permission</label>
                <select 
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                >
                  <option value="admin">Administrator (no API Key management)</option>
                  <option value="support">Support (read-only + credit grants)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Temporary Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Temporary login credential"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="h-9 w-full border border-[#E4E4E7] bg-white rounded px-3 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-4 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER DETAIL SLIDE-IN DRAWER ─── */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 bg-[#09090b]/20 backdrop-blur-sm z-[80] flex justify-end">
          <div className="absolute inset-0" onClick={() => setDrawerOpen(false)}></div>
          <div className="w-[480px] bg-white h-full relative z-10 border-l border-[#E4E4E7] shadow-2xl flex flex-col animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E4E4E7] flex justify-between items-start flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#09090B] break-all">{selectedUser.account.email}</h3>
                <span className="text-[10px] font-mono text-[#71717A] mt-0.5 block">{selectedUser.account.id}</span>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:bg-[#F4F4F5] rounded text-zinc-400 hover:text-zinc-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 text-xs">
              
              {/* Plan & Action Badges */}
              <div className="flex gap-2.5 items-center">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getPlanBadgeClass(selectedUser.account.plan_id)}`}>
                  {selectedUser.account.plan_id.toUpperCase()} Package
                </span>
                {selectedUser.account.is_banned && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#FEF2F2] text-[#B91C1C] font-semibold border border-red-200">
                    BANNED
                  </span>
                )}
              </div>

              {/* Account Section */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-150 pb-1.5">Account Info</h4>
                <div className="grid grid-cols-2 gap-y-3 font-mono text-zinc-600">
                  <div>Joined Date:</div>
                  <div className="text-[#09090B]">{new Date(selectedUser.account.created_at).toLocaleDateString()}</div>
                  <div>Plan Started:</div>
                  <div className="text-[#09090B]">{new Date(selectedUser.account.plan_started_at).toLocaleDateString()}</div>
                  <div>Stripe Customer:</div>
                  <div className="text-[#2563EB] truncate hover:underline cursor-pointer">
                    {selectedUser.account.stripe_customer_id || 'None'}
                  </div>
                  <div>Stripe Subscription:</div>
                  <div className="text-[#09090B] truncate">{selectedUser.account.stripe_subscription_id || 'None'}</div>
                </div>
              </div>

              {/* Business Profile Section */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-150 pb-1.5">Business Profile</h4>
                {selectedUser.profile ? (
                  <div className="space-y-2 text-[#52525B]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Business Name:</span>
                      <span className="font-semibold text-[#09090B]">{selectedUser.profile.business_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Website URL:</span>
                      <a href={selectedUser.profile.website_url} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono">
                        {selectedUser.profile.website_url ? 'Link' : '—'} <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Business Type:</span>
                      <span className="text-[#09090B]">{selectedUser.profile.business_type || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Advertising Goal:</span>
                      <span className="text-[#09090B]">{selectedUser.profile.primary_advertising_goal || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Monthly Budget:</span>
                      <span className="text-[#09090B] font-mono">{selectedUser.profile.monthly_ads_budget || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Platforms:</span>
                      <span className="text-[#09090B]">{selectedUser.profile.platforms.join(', ') || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#71717A] italic py-2">User has not completed Onboarding wizard yet.</div>
                )}
              </div>

              {/* Credit Balance Section */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-150 pb-1.5">Credit Balances</h4>
                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded p-3">
                    <span className="text-[9px] text-zinc-500 uppercase block">Daily AI Chat</span>
                    <span className="text-base font-bold text-[#09090B] block mt-1">{selectedUser.credits.ai_chat_daily_remaining} remaining</span>
                  </div>
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded p-3">
                    <span className="text-[9px] text-zinc-500 uppercase block">Monthly Skill Runs</span>
                    <span className="text-base font-bold text-[#09090B] block mt-1">
                      {selectedUser.credits.skill_run_monthly_remaining === -1 ? 'Unlimited' : `${selectedUser.credits.skill_run_monthly_remaining} remaining`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost & Volume Section */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-150 pb-1.5">Usage This Month</h4>
                <div className="space-y-2 text-[#52525B]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Skill runs completed:</span>
                    <span className="font-mono text-[#09090B]">{selectedUser.usage.skill_runs_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">AI chat messages sent:</span>
                    <span className="font-mono text-[#09090B]">{selectedUser.usage.ai_messages_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Estimated API costs:</span>
                    <span className="font-mono text-[#09090B] font-semibold">${selectedUser.usage.api_cost_est}</span>
                  </div>
                </div>
              </div>

              {/* Internal Notes Section */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-150 pb-1.5">Internal Support Notes</h4>
                
                <div className="space-y-2">
                  <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type internal note about this user (never visible to users)..."
                    className="w-full h-20 p-3 bg-[#FAFAFA] border border-[#E4E4E7] rounded-md outline-none focus:border-zinc-400 resize-none"
                  />
                  <button 
                    onClick={handleSaveNote}
                    className="w-full py-2 bg-zinc-950 text-white font-semibold rounded hover:bg-zinc-800 transition"
                  >
                    Save Internal Note
                  </button>
                </div>

                <div className="space-y-3 pt-3">
                  {selectedUser.notes.map((note: any) => (
                    <div key={note.id} className="p-3 border border-zinc-200 rounded bg-zinc-50 space-y-1">
                      <p className="text-[#09090B] leading-relaxed break-words">{note.note}</p>
                      <div className="text-[9px] text-zinc-400 font-mono">
                        Written at: {new Date(note.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-4 pt-4 border-t border-[#E4E4E7]">
                <h4 className="font-mono text-[10px] font-bold text-[#DC2626] uppercase tracking-widest">Administrator Quick Actions</h4>
                
                {/* Impersonation & Suspension Actions */}
                <div className="grid grid-cols-2 gap-3">
                  {adminProfile.role !== 'support' && (
                    <button 
                      onClick={triggerImpersonation}
                      className="h-10 border border-zinc-300 hover:bg-zinc-50 rounded font-semibold text-zinc-700 flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={13} />
                      <span>Impersonate User</span>
                    </button>
                  )}

                  {adminProfile.role === 'superadmin' && (
                    <button 
                      onClick={() => triggerSuspendAccount(!selectedUser.account.is_banned)}
                      className={`h-10 border rounded font-semibold flex items-center justify-center gap-1.5 ${selectedUser.account.is_banned ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-[#B91C1C] hover:bg-red-50'}`}
                    >
                      {selectedUser.account.is_banned ? <UserCheck size={13} /> : <UserX size={13} />}
                      <span>{selectedUser.account.is_banned ? 'Activate User' : 'Suspend User'}</span>
                    </button>
                  )}
                </div>

                {selectedUser.account.is_banned && adminProfile.role === 'superadmin' && (
                  <div className="space-y-2">
                    <label className="block text-zinc-500">Reason for Suspension</label>
                    <input 
                      type="text" 
                      placeholder="Specify ban reason..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="h-9 w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded px-3 outline-none focus:border-zinc-400"
                    />
                  </div>
                )}

                {/* Change Plan */}
                {adminProfile.role !== 'support' && (
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-4 space-y-3">
                    <span className="text-[10px] font-mono tracking-wider font-semibold text-zinc-500 uppercase block">Modify Plan Level</span>
                    <div className="flex gap-2">
                      <select 
                        value={editingPlan}
                        onChange={(e) => setEditingPlan(e.target.value)}
                        className="h-9 px-3 bg-white border border-[#E4E4E7] rounded flex-1 focus:outline-none"
                      >
                        <option value="free">Free Package</option>
                        <option value="starter">Starter Package</option>
                        <option value="pro">Pro Package</option>
                        <option value="agency">Agency Package</option>
                      </select>
                      <button 
                        onClick={triggerPlanChange}
                        className="px-4 h-9 bg-zinc-950 text-white font-semibold rounded hover:bg-zinc-800 transition"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Credit Grants Form */}
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-4 space-y-3">
                  <span className="text-[10px] font-mono tracking-wider font-semibold text-zinc-500 uppercase block">Grant Additional Credits</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={grantPool}
                      onChange={(e) => setGrantPool(e.target.value)}
                      className="h-9 px-3 bg-white border border-[#E4E4E7] rounded focus:outline-none"
                    >
                      <option value="ai_chat_daily">Daily AI Chat</option>
                      <option value="skill_run_monthly">Monthly Skill Runs</option>
                    </select>
                    <input 
                      type="number" 
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(parseInt(e.target.value) || 0)}
                      className="h-9 px-3 bg-white border border-[#E4E4E7] rounded focus:outline-none font-mono"
                    />
                  </div>
                  <button 
                    onClick={triggerCreditGrant}
                    className="w-full h-9 bg-zinc-950 text-white font-semibold rounded hover:bg-zinc-800 transition"
                  >
                    Grant Credits
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Embedded visual animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
        .animate-slideLeft { animation: slideLeft 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.2s ease-out forwards; }
        .animate-scaleUp { animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

    </div>
  );
}

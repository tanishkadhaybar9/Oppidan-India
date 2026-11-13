import React, { useState, useEffect } from "react";
import {
  Building2,
  Clock,
  Calendar,
  CalendarCheck,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { PageContainer, PageHeader } from "../components/common";
import {
  getSettings,
  updateOrganizationProfile,
  updateWorkingHours,
  updateAttendanceSettings,
  updateLeaveSettings,
  updateSystemPreferences,
} from "../services/settingsService";
import type {
  OrganizationProfile,
  WorkingHoursSettings,
  AttendanceSettings,
  LeaveSettings,
  SystemPreferences,
} from "../types/settings";

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const OrganizationSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === "OWNER" || user?.role === "HR";

  const [activeTab, setActiveTab] = useState<
    "profile" | "hours" | "attendance" | "leave" | "preferences"
  >("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [profile, setProfile] = useState<OrganizationProfile>({
    id: "",
    name: "",
    logoUrl: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const [workingHours, setWorkingHours] = useState<WorkingHoursSettings>({
    workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    workStartTime: "09:00",
    workEndTime: "18:00",
  });

  const [attendance, setAttendance] = useState<AttendanceSettings>({
    timezone: "Asia/Kolkata",
    gracePeriodMinutes: 15,
    defaultBreakMinutes: 60,
    isBreakPaid: false,
    workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    weeklyOvertimeThresholdHours: 40,
    halfDayThresholdMinutes: 240,
    fullDayThresholdMinutes: 480,
    allowRemoteClockIn: true,
    requireLocation: false,
  });

  const [leave, setLeave] = useState<LeaveSettings>({
    leaveYearStart: "JANUARY",
    allowCarryForward: true,
    maxCarryForwardDays: 15,
    requireDocumentProofDays: 3,
    maxConsecutiveDays: 14,
  });

  const [preferences, setPreferences] = useState<SystemPreferences>({
    timezone: "Asia/Kolkata",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    currency: "INR",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await getSettings();
      if (res.data) {
        setProfile(res.data.organization);
        setWorkingHours(res.data.workingHours);
        setAttendance(res.data.attendance);
        setLeave(res.data.leave);
        setPreferences(res.data.preferences);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load organization settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      await updateOrganizationProfile(profile);
      showSuccess("Organization profile saved successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkingHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      await updateWorkingHours(workingHours);
      showSuccess("Working hours configured successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update working hours.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      await updateAttendanceSettings(attendance);
      showSuccess("Attendance settings updated successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update attendance settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      await updateLeaveSettings(leave);
      showSuccess("Leave policy settings saved successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update leave settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      await updateSystemPreferences(preferences);
      showSuccess("System preferences updated successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setWorkingHours((prev) => {
      const exists = prev.workingDays.includes(day);
      const updated = exists
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: updated };
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-[#77716e]">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-3" />
          <p className="text-sm">Loading organization settings...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Organization Settings"
        subtitle="Manage company profile, standard working hours, attendance policies, and system preferences."
        icon={<Building2 className="w-5 h-5 text-[#f47b5b]" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Settings", to: "/settings" },
          { label: "Organization" },
        ]}
      />

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#eadbd2] pb-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-[#f47b5b] text-white shadow-xs"
              : "text-[#77716e] hover:bg-[#fff0e8] hover:text-[#252525]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab("hours")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "hours"
              ? "bg-[#f47b5b] text-white shadow-xs"
              : "text-[#77716e] hover:bg-[#fff0e8] hover:text-[#252525]"
          }`}
        >
          <Clock className="w-4 h-4" />
          Working Hours
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "attendance"
              ? "bg-[#f47b5b] text-white shadow-xs"
              : "text-[#77716e] hover:bg-[#fff0e8] hover:text-[#252525]"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Attendance Policy
        </button>
        <button
          onClick={() => setActiveTab("leave")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "leave"
              ? "bg-[#f47b5b] text-white shadow-xs"
              : "text-[#77716e] hover:bg-[#fff0e8] hover:text-[#252525]"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Leave Policy
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "preferences"
              ? "bg-[#f47b5b] text-white shadow-xs"
              : "text-[#77716e] hover:bg-[#fff0e8] hover:text-[#252525]"
          }`}
        >
          <Sliders className="w-4 h-4" />
          System Preferences
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#f47b5b]" />
              Company Details
            </h3>
            <p className="text-xs text-[#77716e] mt-1">Official corporate identification and contact information.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Company Legal Name *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Logo URL</label>
              <input
                type="url"
                disabled={!canEdit}
                placeholder="https://example.com/logo.png"
                value={profile.logoUrl || ""}
                onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                <Mail className="w-3 h-3 inline mr-1 text-[#77716e]" /> Official Email
              </label>
              <input
                type="email"
                disabled={!canEdit}
                placeholder="contact@oppidan.in"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                <Phone className="w-3 h-3 inline mr-1 text-[#77716e]" /> Official Phone
              </label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="+91 98765 43210"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                <Globe className="w-3 h-3 inline mr-1 text-[#77716e]" /> Website
              </label>
              <input
                type="url"
                disabled={!canEdit}
                placeholder="https://oppidan.in"
                value={profile.website || ""}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">
              <MapPin className="w-3 h-3 inline mr-1 text-[#77716e]" /> Street Address
            </label>
            <input
              type="text"
              disabled={!canEdit}
              placeholder="Suite 400, Innovation Tower, Tech Park"
              value={profile.address || ""}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">City</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="Bengaluru"
                value={profile.city || ""}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">State</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="Karnataka"
                value={profile.state || ""}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Country</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="India"
                value={profile.country || ""}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Postal Code</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="560100"
                value={profile.postalCode || ""}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-[#eadbd2]">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f47b5b] text-white text-sm font-semibold hover:bg-[#d95d3d] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Company Profile
              </button>
            </div>
          )}
        </form>
      )}

      {/* Working Hours Tab */}
      {activeTab === "hours" && (
        <form onSubmit={handleSaveWorkingHours} className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#f47b5b]" />
              Working Days & Standard Shift Hours
            </h3>
            <p className="text-xs text-[#77716e] mt-1">Configure official operating days and standard start/end timings.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-2">Standard Working Days</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {DAYS_OF_WEEK.map((day) => {
                const active = workingHours.workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    disabled={!canEdit}
                    onClick={() => toggleWorkingDay(day)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      active
                        ? "bg-[#fff0e8] border-[#f47b5b] text-[#f47b5b]"
                        : "bg-white border-[#eadbd2] text-[#77716e] hover:border-[#f47b5b]/50"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Standard Shift Start Time</label>
              <input
                type="time"
                disabled={!canEdit}
                value={workingHours.workStartTime}
                onChange={(e) => setWorkingHours({ ...workingHours, workStartTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Standard Shift End Time</label>
              <input
                type="time"
                disabled={!canEdit}
                value={workingHours.workEndTime}
                onChange={(e) => setWorkingHours({ ...workingHours, workEndTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-[#eadbd2]">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f47b5b] text-white text-sm font-semibold hover:bg-[#d95d3d] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Working Hours
              </button>
            </div>
          )}
        </form>
      )}

      {/* Attendance Policy Tab */}
      {activeTab === "attendance" && (
        <form onSubmit={handleSaveAttendance} className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#f47b5b]" />
              Attendance Rules & Thresholds
            </h3>
            <p className="text-xs text-[#77716e] mt-1">Clock-in tolerance, break management, overtime, and remote punch enforcement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                min="0"
                max="120"
                disabled={!canEdit}
                value={attendance.gracePeriodMinutes}
                onChange={(e) => setAttendance({ ...attendance, gracePeriodMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Lateness tolerance before marked late</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Default Break Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                max="180"
                disabled={!canEdit}
                value={attendance.defaultBreakMinutes}
                onChange={(e) => setAttendance({ ...attendance, defaultBreakMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Standard lunch/tea break allocated</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Weekly Overtime Threshold (Hours)</label>
              <input
                type="number"
                min="1"
                max="80"
                disabled={!canEdit}
                value={attendance.weeklyOvertimeThresholdHours}
                onChange={(e) => setAttendance({ ...attendance, weeklyOvertimeThresholdHours: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Hours beyond which overtime accrues</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Half-Day Threshold (Minutes)</label>
              <input
                type="number"
                min="60"
                max="480"
                disabled={!canEdit}
                value={attendance.halfDayThresholdMinutes}
                onChange={(e) => setAttendance({ ...attendance, halfDayThresholdMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Min minutes required for half-day credit (e.g. 240m = 4h)</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Full-Day Threshold (Minutes)</label>
              <input
                type="number"
                min="120"
                max="720"
                disabled={!canEdit}
                value={attendance.fullDayThresholdMinutes}
                onChange={(e) => setAttendance({ ...attendance, fullDayThresholdMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Min minutes required for full-day credit (e.g. 480m = 8h)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-[#eadbd2] bg-[#fffcfb] cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={attendance.isBreakPaid}
                onChange={(e) => setAttendance({ ...attendance, isBreakPaid: e.target.checked })}
                className="w-4 h-4 text-[#f47b5b] rounded accent-[#f47b5b]"
              />
              <div>
                <div className="text-xs font-semibold text-[#252525]">Paid Break</div>
                <div className="text-[10px] text-[#77716e]">Count break duration in total hours</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-[#eadbd2] bg-[#fffcfb] cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={attendance.allowRemoteClockIn}
                onChange={(e) => setAttendance({ ...attendance, allowRemoteClockIn: e.target.checked })}
                className="w-4 h-4 text-[#f47b5b] rounded accent-[#f47b5b]"
              />
              <div>
                <div className="text-xs font-semibold text-[#252525]">Remote Clock-In</div>
                <div className="text-[10px] text-[#77716e]">Allow WFH and remote punch entries</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-[#eadbd2] bg-[#fffcfb] cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={attendance.requireLocation}
                onChange={(e) => setAttendance({ ...attendance, requireLocation: e.target.checked })}
                className="w-4 h-4 text-[#f47b5b] rounded accent-[#f47b5b]"
              />
              <div>
                <div className="text-xs font-semibold text-[#252525]">Require GPS Location</div>
                <div className="text-[10px] text-[#77716e]">Capture coordinates during punch</div>
              </div>
            </label>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-[#eadbd2]">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f47b5b] text-white text-sm font-semibold hover:bg-[#d95d3d] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Attendance Policy
              </button>
            </div>
          )}
        </form>
      )}

      {/* Leave Policy Tab */}
      {activeTab === "leave" && (
        <form onSubmit={handleSaveLeave} className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#f47b5b]" />
              Leave Policy Rules
            </h3>
            <p className="text-xs text-[#77716e] mt-1">Year cycle, rollover allowances, documentation requirements, and streak caps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Leave Fiscal Cycle Start Month</label>
              <select
                disabled={!canEdit}
                value={leave.leaveYearStart}
                onChange={(e) => setLeave({ ...leave, leaveYearStart: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              >
                <option value="JANUARY">January (Calendar Year)</option>
                <option value="APRIL">April (Indian Fiscal Year)</option>
                <option value="JULY">July</option>
                <option value="OCTOBER">October</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Max Consecutive Leave Days</label>
              <input
                type="number"
                min="1"
                max="60"
                disabled={!canEdit}
                value={leave.maxConsecutiveDays}
                onChange={(e) => setLeave({ ...leave, maxConsecutiveDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Maximum continuous days without special approval</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Max Carry Forward Days</label>
              <input
                type="number"
                min="0"
                max="90"
                disabled={!canEdit}
                value={leave.maxCarryForwardDays}
                onChange={(e) => setLeave({ ...leave, maxCarryForwardDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Unused leave days rolled into next year</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Medical Certificate Required After (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                disabled={!canEdit}
                value={leave.requireDocumentProofDays}
                onChange={(e) => setLeave({ ...leave, requireDocumentProofDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              />
              <span className="text-[11px] text-[#77716e]">Number of sick days triggering document proof</span>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#eadbd2] bg-[#fffcfb] cursor-pointer max-w-sm">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={leave.allowCarryForward}
              onChange={(e) => setLeave({ ...leave, allowCarryForward: e.target.checked })}
              className="w-4 h-4 text-[#f47b5b] rounded accent-[#f47b5b]"
            />
            <div>
              <div className="text-xs font-semibold text-[#252525]">Allow Leave Rollover</div>
              <div className="text-[10px] text-[#77716e]">Enable carry forward of unused balances</div>
            </div>
          </label>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-[#eadbd2]">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f47b5b] text-white text-sm font-semibold hover:bg-[#d95d3d] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Leave Policy
              </button>
            </div>
          )}
        </form>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#f47b5b]" />
              System Formatting & Currency
            </h3>
            <p className="text-xs text-[#77716e] mt-1">Locale, timezone, and display preferences across the system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Company Timezone</label>
              <select
                disabled={!canEdit}
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="UTC">UTC (+00:00)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Default Currency</label>
              <select
                disabled={!canEdit}
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="AED">AED (د.إ - UAE Dirham)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Date Format</label>
              <select
                disabled={!canEdit}
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-13)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (13/11/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (11/13/2026)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (13 Nov 2026)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Time Format</label>
              <select
                disabled={!canEdit}
                value={preferences.timeFormat}
                onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#eadbd2] text-sm text-[#252525] focus:outline-none focus:border-[#f47b5b] bg-[#fffcfb] disabled:bg-[#f9f5f3]"
              >
                <option value="24h">24-hour (18:30)</option>
                <option value="12h">12-hour AM/PM (06:30 PM)</option>
              </select>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-[#eadbd2]">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f47b5b] text-white text-sm font-semibold hover:bg-[#d95d3d] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Preferences
              </button>
            </div>
          )}
        </form>
      )}
    </PageContainer>
  );
};

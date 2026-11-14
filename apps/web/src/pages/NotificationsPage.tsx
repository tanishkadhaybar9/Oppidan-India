import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Filter,
  Loader2,
  AlertCircle,
  Inbox,
  Clock,
} from "lucide-react";
import { PageContainer, PageHeader, ConfirmModal } from "../components/common";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notificationService";
import type { NotificationItem } from "../types/notifications";

const NOTIF_TYPES = [
  "ALL",
  "EMPLOYEE",
  "LEAVE",
  "ATTENDANCE",
  "TASK",
  "PAYROLL",
  "ASSET",
  "SYSTEM",
];

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listNotifications({
        page,
        limit: 15,
        unreadOnly: unreadOnly ? true : undefined,
        type: selectedType !== "ALL" ? selectedType : undefined,
      });
      if (res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly, selectedType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setDeleteLoading(true);
      await deleteNotification(deleteConfirmId);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteConfirmId));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteConfirmId(null);
    } catch {
      // ignore
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "LEAVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ATTENDANCE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "TASK":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PAYROLL":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ASSET":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "EMPLOYEE":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Notifications Center"
        subtitle="Stay updated with organizational activity, requests, task assignments, and system events."
        icon={<Bell className="w-5 h-5 text-[#f47b5b]" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Notifications" },
        ]}
        badges={
          unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#fff0e8] text-[#f47b5b] border border-[#eadbd2]">
              {unreadCount} Unread
            </span>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#77716e] flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Filter Type:
          </span>
          {NOTIF_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === type
                  ? "bg-[#f47b5b] text-white shadow-xs"
                  : "bg-[#fff7f2] border border-[#eadbd2] text-[#77716e] hover:text-[#252525] hover:border-[#f47b5b]/50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#252525] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 text-[#f47b5b] rounded accent-[#f47b5b]"
            />
            Unread only
          </label>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#fff0e8] border border-[#eadbd2] text-xs font-semibold text-[#f47b5b] hover:bg-[#ffe3d6] transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#77716e]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mx-auto mb-3" />
            <p className="text-xs font-medium">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-[#77716e]">
            <Inbox className="w-12 h-12 text-[#eadbd2] mx-auto mb-3" />
            <h4 className="text-sm font-bold text-[#252525] mb-1">No notifications found</h4>
            <p className="text-xs">
              {unreadOnly
                ? "You have zero unread notifications. Great job keeping up!"
                : "No activity notifications recorded for your account."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eadbd2]/70">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-4 transition-all cursor-pointer hover:bg-[#fff7f2]/80 flex items-start gap-4 ${
                  !notif.isRead ? "bg-[#fff7f2]/40" : ""
                }`}
              >
                {/* Dot */}
                <div className="mt-1">
                  {!notif.isRead ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f47b5b] block ring-4 ring-[#fff0e8]" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eadbd2] block" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTypeBadgeColor(
                        notif.type
                      )}`}
                    >
                      {notif.type}
                    </span>
                    <h4 className="text-sm font-bold text-[#252525] truncate">{notif.title}</h4>
                  </div>
                  <p className="text-xs text-[#77716e] leading-relaxed mb-2">{notif.message}</p>
                  <div className="flex items-center gap-4 text-[11px] text-[#77716e]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {notif.link && (
                      <span className="text-[#f47b5b] font-semibold flex items-center gap-1 hover:underline">
                        Navigate to Record <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg hover:bg-[#fff0e8] text-[#77716e] hover:text-[#f47b5b] transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    title="Delete notification"
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-[#77716e] hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#eadbd2] flex items-center justify-between text-xs text-[#77716e]">
            <span>
              Showing {notifications.length} of {total} notifications
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-semibold text-[#252525]">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Notification?"
        message="This notification will be permanently removed from your activity feed."
        confirmLabel="Delete Notification"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </PageContainer>
  );
};

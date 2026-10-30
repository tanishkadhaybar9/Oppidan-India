import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/leaveService";
import type { Notification } from "../types/leave";

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res.data?.count !== undefined) {
        setUnreadCount(res.data.count);
      }
    } catch {
      // silently fail if unauthenticated or network issue
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await listNotifications();
      if (res.data) {
        setNotifications(res.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchUnreadCount();
      }
    }, 60000); // Poll every 60s when active
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // continue navigation anyway
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-[#77716e] hover:text-[#252525] hover:bg-[#fff7f2] border border-transparent hover:border-[#eadbd2] transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#f47b5b] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#eadbd2] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 bg-[#fff7f2] border-b border-[#eadbd2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#252525]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-[#f47b5b]/10 text-[#f47b5b] rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#f47b5b] hover:text-[#d95d3d] font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#eadbd2]/60">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#77716e]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#77716e]">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 cursor-pointer hover:bg-[#fff7f2]/70 transition-colors flex items-start gap-3 ${
                    !notif.isRead ? "bg-[#fff7f2]/30" : ""
                  }`}
                >
                  <div className="mt-1">
                    {!notif.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-[#f47b5b] block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#eadbd2] block" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#252525] truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-[#77716e] mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[#77716e]">
                      <span>{new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</span>
                      {notif.link && (
                        <span className="text-[#f47b5b] flex items-center gap-0.5">
                          View <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

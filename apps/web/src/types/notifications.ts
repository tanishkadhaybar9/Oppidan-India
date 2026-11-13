export interface NotificationItem {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  type: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}


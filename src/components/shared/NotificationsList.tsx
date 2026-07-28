'use client';

import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications';

type NotificationType = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: Date;
};

export default function NotificationsList({ initialNotifications }: { initialNotifications: NotificationType[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    const res = await markAsRead(id);
    if (res.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllAsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-green-600" />
            All Notifications
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors"
          >
            <CheckCheck className="w-5 h-5" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
          <Bell className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">No notifications yet</h3>
          <p className="mt-1">When you get notifications, they&apos;ll show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-6 transition-colors hover:bg-slate-50 ${notification.isRead ? 'bg-white' : 'bg-green-50/30'}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      notification.type === 'Alert' ? 'bg-red-100 text-red-700' :
                      notification.type === 'System' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {notification.type}
                    </span>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    )}
                  </div>
                  <h4 className={`text-lg ${notification.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                    {notification.title}
                  </h4>
                  <p className="text-slate-600 mt-2 whitespace-pre-wrap">
                    {notification.message}
                  </p>
                  <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
                    <span>{format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                  </p>
                </div>

                {!notification.isRead && (
                  <button 
                    onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 rounded-md transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

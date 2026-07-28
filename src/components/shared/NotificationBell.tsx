'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/actions/notifications';
import { formatDistanceToNow } from 'date-fns';

type NotificationType = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: Date;
};

interface NotificationBellProps {
  role: 'ADMIN' | 'SENIOR';
  align?: 'left' | 'right';
}

export default function NotificationBell({ role, align = 'right' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const viewAllLink = role === 'ADMIN' ? '/admin/notifications' : '/senior/notifications';

  const fetchNotifications = async () => {
    // Fetch 10 for the pop-up
    const res = await getNotifications(10);
    if (res.success && res.notifications) {
      setNotifications(res.notifications as NotificationType[]);
      setUnreadCount(res.unreadCount || 0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string, isRead: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRead) return;

    const res = await markAsRead(id);
    if (res.success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllAsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-600 hover:text-green-700"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50`}>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs flex items-center text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 transition-colors ${notification.isRead ? 'bg-white' : 'bg-green-50/50'}`}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <h4 className={`text-sm ${notification.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button 
                          onClick={(e) => handleMarkAsRead(e, notification.id, notification.isRead)}
                          className="flex-shrink-0 text-green-600 hover:bg-green-100 p-1.5 rounded-full self-start transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-100 bg-slate-50">
            <Link 
              href={viewAllLink} 
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center text-sm font-semibold text-green-700 hover:text-green-800 hover:bg-slate-100 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

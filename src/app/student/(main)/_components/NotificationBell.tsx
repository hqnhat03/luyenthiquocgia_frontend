'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    body?: string;
    class_id?: string;
    class_code?: string;
    sender_name?: string;
    sender_image?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const fetchNotifications = async () => {
    setNotifications([]);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    }

    // Navigation logic
    const data = notification.data;
    if (data.class_id) {
      router.push(`/classes/${data.class_id}`);
    } else if (data.class_code) {
      router.push(`/classes/${data.class_code}`);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-10 w-10">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 border-2 border-white"></span>
            </span>
          )}
        </Button>
      }>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-2xl border-slate-100 rounded-xl overflow-hidden" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm">
          <h3 className="font-bold text-slate-900">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold h-7 px-2 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              Đọc tất cả
            </Button>
          )}
        </div>
        <Separator className="opacity-50" />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 rotate-3 shadow-inner">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trống</p>
              <p className="text-xs text-slate-400 mt-1">Bạn chưa có thông báo nào mới</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3.5 text-left transition-all border-b border-slate-50/50 last:border-0 w-full relative group",
                    !notification.read_at ? "bg-blue-50/30 hover:bg-blue-50/60" : "hover:bg-slate-50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.read_at && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600" />
                  )}

                  <Avatar className="h-10 w-10 rounded-xl shrink-0">
                    <AvatarImage src={notification.data.sender_image} alt={notification.data.sender_name} />
                    <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-400">
                      {notification.data.sender_name?.charAt(0) || 'G'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex w-full justify-between items-center gap-2">
                      <span className={cn(
                        "text-[11px] leading-none uppercase tracking-widest font-black truncate",
                        !notification.read_at ? "text-blue-600" : "text-slate-400"
                      )}>
                        {notification.data.sender_name || 'Hệ thống'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                        </span>
                        {!notification.read_at && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </div>

                    <span className={cn(
                      "text-[13px] leading-snug line-clamp-1",
                      !notification.read_at ? "font-bold text-slate-900" : "font-medium text-slate-600"
                    )}>
                      {notification.data.message || notification.data.title || 'Thông báo mới'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator className="opacity-50" />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full text-xs font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-10 rounded-lg transition-colors"
            onClick={() => router.push('/student/notifications')}
          >
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

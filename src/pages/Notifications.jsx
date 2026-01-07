import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Wand2, MessageSquare, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

const notificationIcons = {
  copy: { icon: Copy, color: 'text-blue-600', bg: 'bg-blue-100' },
  share: { icon: Share2, color: 'text-green-600', bg: 'bg-green-100' },
  ai_inspire: { icon: Wand2, color: 'text-purple-600', bg: 'bg-purple-100' },
  comment: { icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-100' }
};

const notificationTexts = {
  copy: (username) => `${username} copied your workout`,
  share: (username) => `${username} shared your workout`,
  ai_inspire: (username) => `${username} used your workout as AI inspiration`,
  comment: (username) => `${username} commented on your workout`
};

export default function Notifications() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => base44.entities.Notification.filter(
      { recipient_email: currentUser?.email },
      '-created_date'
    ),
    enabled: !!currentUser?.email
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifs = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifs.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No notifications yet</h2>
            <p className="text-slate-500">
              You'll see notifications when others interact with your workouts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const config = notificationIcons[notification.type];
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={createPageUrl(`WorkoutDetail?id=${notification.workout_id}`)}>
                    <Card 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !notification.is_read ? 'border-indigo-200 bg-indigo-50/50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsReadMutation.mutate(notification.id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900">
                              <span className="font-medium">
                                {notification.actor_username || notification.actor_email.split('@')[0]}
                              </span>
                              {' '}
                              {notificationTexts[notification.type](notification.actor_username || notification.actor_email.split('@')[0]).replace(notification.actor_username || notification.actor_email.split('@')[0], '')}
                            </p>
                            <p className="text-sm font-medium text-slate-700 mt-1 truncate">
                              {notification.workout_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {moment(notification.created_date).fromNow()}
                            </p>
                          </div>

                          {!notification.is_read && (
                            <Badge className="bg-indigo-600 flex-shrink-0">New</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
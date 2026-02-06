/**
 * Real-time Collaboration Panel Component
 * لوحة التعاون الفوري - تعرض المستخدمين والنشاط الحي
 */

'use client';

import React, { useState } from 'react';
import useCollaboration from '@/hooks/useCollaboration';
import { Users, Zap, ShieldCheck, Bell, MessageSquare } from 'lucide-react';

const CollaborationPanel = ({ brdId, userId, userName }) => {
  const {
    isConnected,
    activeUsers,
    mentions,
    threads,
    activity,
    getSectionLockStatus,
    lockSection,
    unlockSection,
    mentionUser,
    markMentionAsRead,
    getUserName
  } = useCollaboration(brdId, userId, userName);

  const [selectedUser, setSelectedUser] = useState(null);
  const unreadMentions = Array.isArray(mentions) ? mentions.filter(m => !m.read).length : 0;

  return (
    <div className="collaboration-panel bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-full shadow-sm">
      {/* Header Status */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Users size={16} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Collaboration Hub</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Real-time sync</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 space-y-6 scrollbar-hide">
        {/* Live Activity Feed */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-amber-500" />
              Live activity
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">NEW</span>
          </div>
          <div className="space-y-2">
            {activity.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-400 italic">No activity yet. Documentation is silent.</p>
              </div>
            ) : (
              activity.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-xl border text-xs flex gap-3 transition-all animate-in slide-in-from-right-2 duration-300 ${event.type === 'lock'
                      ? 'bg-amber-50/50 border-amber-100'
                      : event.type === 'presence'
                        ? 'bg-indigo-50/50 border-indigo-100'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                >
                  <div className="mt-0.5">
                    {event.type === 'lock'
                      ? <ShieldCheck size={14} className="text-amber-500" />
                      : <Users size={14} className="text-indigo-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 leading-tight">{event.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Active Members */}
        <section>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            Active team members ({activeUsers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeUsers.map((uId, idx) => (
              <div
                key={uId}
                className="group flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-full pr-3 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer"
                onClick={() => setSelectedUser(selectedUser === uId ? null : uId)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-amber-500'][idx % 5]
                  }`}>
                  {getUserName(uId).substring(0, 1).toUpperCase()}
                </div>
                <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[80px]">
                  {getUserName(uId)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        {unreadMentions > 0 && Array.isArray(mentions) && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Notifications
            </h4>
            <div
              onClick={() => {
                const unread = mentions.find(m => !m.read);
                if (unread?.id) markMentionAsRead(unread.id);
              }}
              className="p-3 bg-rose-50 border border-rose-100 rounded-xl cursor-pointer hover:bg-rose-100 transition flex items-center gap-3"
            >
              <div className="p-2 bg-rose-500 rounded-lg text-white shadow-sm">
                <Bell size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-700">{unreadMentions} New @Mentions</p>
                <p className="text-[10px] text-rose-500 font-medium">Click to mark as read</p>
              </div>
            </div>
          </section>
        )}

        {/* Threads Summary */}
        {threads && typeof threads.size === 'number' && threads.size > 0 && (
          <section>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Active discussions
            </h4>
            <div className="space-y-2">
              {Array.from(threads.values()).slice(0, 3).map((thread) => (
                <div key={thread.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{thread.type}</span>
                    <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${thread.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                      {thread.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium truncate">
                    {thread.comments && thread.comments.length > 0 ? thread.comments[thread.comments.length - 1]?.content : 'No comments'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <Zap size={10} className="text-indigo-400" />
          Real-time Engine v2
        </div>
        <div className="text-[10px] text-slate-300 font-medium">
          {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;

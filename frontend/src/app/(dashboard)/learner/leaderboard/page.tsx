'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, Medal, Star, Crown, Flame, Award, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useRealtimeTable } from '@/hooks/use-realtime';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  level: string;
}

interface MyStats {
  points: number;
  level: string;
  streak_days: number;
  rank: number | null;
  badges_earned: number;
  badges_total: number;
  recent_points: Array<{ id: string; points: number; reason: string; created_at: string }>;
}

interface BadgeWithStatus {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  earned: boolean;
  earned_at: string | null;
}

const LEVEL_COLORS: Record<string, string> = {
  Novice: 'bg-slate-100 text-slate-600',
  Explorer: 'bg-blue-100 text-blue-700',
  Scholar: 'bg-purple-100 text-purple-700',
  Expert: 'bg-amber-100 text-amber-700',
  Master: 'bg-emerald-100 text-emerald-700',
};

const BADGE_ICONS: Record<string, typeof Trophy> = {
  'First Steps': Star,
  'Quiz Whiz': Zap,
  'Course Champion': Trophy,
  'Bundle Master': Crown,
  'Social Learner': Award,
  'Streak Star': Flame,
  'Top Scorer': Medal,
  'Knowledge Seeker': Star,
};

type Tab = 'global' | 'monthly' | 'badges';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('global');

  // Realtime: points_ledger INSERT → re-fetch leaderboard
  useRealtimeTable<{ user_id: string }>({
    table: 'points_ledger',
    event: 'INSERT',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-gamification-stats'] });
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['my-gamification-stats'],
    queryFn: async () => {
      const res = await api.get('/gamification/my-stats');
      return res.data as MyStats;
    },
  });

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard', tab],
    queryFn: async () => {
      const params: Record<string, string> = { scope: tab === 'badges' ? 'global' : tab, limit: '50' };
      const res = await api.get('/leaderboard', { params });
      return res.data as { leaderboard: LeaderboardEntry[] };
    },
    enabled: tab !== 'badges',
  });

  const { data: badgesData } = useQuery({
    queryKey: ['my-badges'],
    queryFn: async () => {
      const res = await api.get('/gamification/badges');
      return res.data as { badges: BadgeWithStatus[] };
    },
    enabled: tab === 'badges',
  });

  const leaderboard = leaderboardData?.leaderboard || [];
  const badges = badgesData?.badges || [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'global', label: 'All Time' },
    { key: 'monthly', label: 'This Month' },
    { key: 'badges', label: 'Badges' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-2">
              <Star className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{statsData.points.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Total Points</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2">
              <Crown className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{statsData.level}</p>
            <p className="text-xs text-slate-500">Level</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <Flame className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{statsData.streak_days}</p>
            <p className="text-xs text-slate-500">Day Streak</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Trophy className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">#{statsData.rank || '—'}</p>
            <p className="text-xs text-slate-500">Global Rank</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Leaderboard</h1>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard table */}
      {tab !== 'badges' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-600 mb-1">No entries yet</h3>
              <p className="text-sm text-slate-400">Complete lessons and assessments to earn points!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-16">Rank</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Learner</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-28">Level</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 w-28">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((entry) => {
                    const isMe = entry.user_id === user?.id;
                    return (
                      <tr
                        key={entry.user_id}
                        className={isMe ? 'bg-teal-50' : 'hover:bg-slate-50'}
                      >
                        <td className="px-4 py-3 text-center">
                          {entry.rank <= 3 ? (
                            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
                              entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                              entry.rank === 2 ? 'bg-slate-200 text-slate-600' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {entry.rank}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">{entry.rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">
                                {entry.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                            <span className={`font-medium ${isMe ? 'text-teal-700' : 'text-slate-800'}`}>
                              {entry.name} {isMe && <span className="text-xs text-teal-500">(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[entry.level] || ''}`}>
                            {entry.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-slate-800">{entry.points.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Badges grid */}
      {tab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const IconComponent = BADGE_ICONS[badge.name] || Award;
            return (
              <div
                key={badge.id}
                className={`relative bg-white rounded-xl border p-5 text-center transition-all ${
                  badge.earned
                    ? 'border-teal-200 shadow-sm'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                  badge.earned
                    ? 'bg-teal-100 text-teal-600'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  <IconComponent className="h-7 w-7" />
                </div>
                <h3 className={`font-semibold text-sm ${badge.earned ? 'text-slate-800' : 'text-slate-500'}`}>
                  {badge.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                {badge.earned && badge.earned_at && (
                  <p className="text-xs text-teal-600 mt-2 font-medium">
                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                )}
                {!badge.earned && (
                  <p className="text-xs text-slate-400 mt-2">Not yet earned</p>
                )}
              </div>
            );
          })}
          {badges.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
              <Award className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">Loading badges...</p>
            </div>
          )}
        </div>
      )}

      {/* Recent activity */}
      {statsData && statsData.recent_points.length > 0 && tab !== 'badges' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Recent Points</h3>
          <div className="space-y-2">
            {statsData.recent_points.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-700">{entry.reason}</span>
                <span className="text-sm font-semibold text-teal-600">+{entry.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

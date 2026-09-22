import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('useStats error:', error);
          setLoading(false);
          return;
        }
        if (data && data.length) {
          const latest = data[0];
          const totalAnswered = data.reduce((s, a) => s + a.total_questions, 0);
          const totalCorrect = data.reduce((s, a) => s + a.correct_count, 0);

          setStats({
            testsTaken: data.length,
            questionsSolved: totalAnswered,
            accuracy: Math.round((totalCorrect / totalAnswered) * 100),
            latestScore: latest.score_percent,
            weakTopics: latest.weak_topics || [],
            // full history (oldest → newest) for Progress charts
            history: [...data].reverse().map(a => ({
              date: a.created_at,
              score: a.score_percent,
              correct: a.correct_count,
              total: a.total_questions,
            })),
            attempts: data, // raw, newest first
          });
        }
        setLoading(false);
      });
  }, [user]);

  return { stats, loading };
}
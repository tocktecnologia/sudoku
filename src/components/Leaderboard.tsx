import React, { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, limit, getDocs } from '@/src/lib/firebase';
import { Difficulty } from '@/src/lib/sudoku';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Leaderboard: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'leaderboards'),
          where('difficulty', '==', difficulty),
          orderBy('time', 'asc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setScores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, [difficulty]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
      <div className="text-center mb-4">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Ranking Mundial</h2>
      </div>

      <Tabs value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="easy">Fácil</TabsTrigger>
          <TabsTrigger value="medium">Médio</TabsTrigger>
          <TabsTrigger value="moderate">Moderado</TabsTrigger>
          <TabsTrigger value="hard">Difícil</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando rankings...</div>
            ) : scores.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum tempo registrado ainda. Seja o primeiro!</div>
            ) : (
              scores.map((score, index) => (
                <div key={score.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "w-8 text-lg font-bold",
                      index === 0 && "text-yellow-500",
                      index === 1 && "text-gray-400",
                      index === 2 && "text-orange-400",
                      index > 2 && "text-muted-foreground"
                    )}>
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                       </div>
                       <span className="font-medium">{score.userName || 'Jogador Anônimo'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-lg font-bold">
                    <Clock className="w-4 h-4 opacity-50" />
                    {formatTime(score.time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

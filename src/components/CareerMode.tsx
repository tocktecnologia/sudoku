import React, { useState, useEffect } from 'react';
import { UserData, THEMES } from '@/src/types';
import { getSudokuHistory } from '@/src/lib/gemini';
import { SudokuGame } from './SudokuGame';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen, ChevronRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, doc, updateDoc } from '@/src/lib/firebase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CareerModeProps {
  userData: UserData;
  onRefreshUser: () => void;
  onQuit: () => void;
}

const LEVELS = [
  { level: 1, difficulty: 'easy', title: 'O Princípio' },
  { level: 2, difficulty: 'easy', title: 'Lógica Básica' },
  { level: 3, difficulty: 'medium', title: 'Avanço Diagonal' },
  { level: 4, difficulty: 'medium', title: 'O Mestre Moderno' },
  { level: 5, difficulty: 'moderate', title: 'Desafio Arcaico' },
  { level: 6, difficulty: 'moderate', title: 'Sabedoria Samurai' },
  { level: 7, difficulty: 'hard', title: 'Lenda do Leste' },
  { level: 8, difficulty: 'hard', title: 'Perfeição Numérica' },
] as const;

export const CareerMode: React.FC<CareerModeProps> = ({
  userData,
  onRefreshUser,
  onQuit
}) => {
  const [activeGame, setActiveGame] = useState<typeof LEVELS[number] | null>(null);
  const [story, setStory] = useState<string | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);

  useEffect(() => {
    if (userData.careerLevel > 0) {
      loadHistory(userData.careerLevel);
    }
  }, [userData.careerLevel]);

  async function loadHistory(level: number) {
    setLoadingStory(true);
    const text = await getSudokuHistory(level);
    setStory(text);
    setLoadingStory(false);
  }

  const handleLevelFinish = async (time: number) => {
    if (activeGame && activeGame.level === userData.careerLevel + 1) {
      const nextLevel = userData.careerLevel + 1;
      try {
        await updateDoc(doc(db, 'users', userData.uid), {
          careerLevel: nextLevel
        });
        onRefreshUser();
        toast.success(`Nível ${nextLevel} concluído! Nova história desbloqueada.`);
      } catch (err) {
        console.error(err);
      }
    }
    setActiveGame(null);
  };

  if (activeGame) {
    return (
      <SudokuGame
        difficulty={activeGame.difficulty}
        theme={THEMES[0]} // Always classic in career or pick from saved?
        onFinish={handleLevelFinish}
        onQuit={() => setActiveGame(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Modo Carreira</h2>
        <p className="text-muted-foreground italic">Sua jornada através da história dos números</p>
      </div>

      <div className="grid gap-4">
        {LEVELS.map((level) => {
          const isCompleted = userData.careerLevel >= level.level;
          const isNext = userData.careerLevel === level.level - 1;
          const isLocked = !isCompleted && !isNext;

          return (
            <Card key={level.level} className={cn(
              "overflow-hidden transition-all duration-300",
              isNext && "ring-2 ring-indigo-500 shadow-lg scale-105",
              isLocked && "opacity-60"
            )}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl",
                    isCompleted ? "bg-green-100 text-green-700" : 
                    isNext ? "bg-indigo-600 text-white animate-pulse" : "bg-gray-100 text-gray-400"
                  )}>
                    {level.level}
                  </div>
                  <div>
                    <h3 className="font-bold">{level.title}</h3>
                    <p className="text-sm capitalize text-muted-foreground">{level.difficulty}</p>
                  </div>
                </div>
                
                {isLocked ? (
                  <Lock className="w-5 h-5 text-gray-400" />
                ) : (
                  <Button 
                    onClick={() => setActiveGame(level)}
                    className={cn(isCompleted && "bg-green-600 hover:bg-green-700")}
                  >
                    {isCompleted ? "Repetir" : "Iniciar"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {story && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-indigo-50 rounded-2xl p-6 border border-indigo-100 shadow-inner"
          >
            <div className="flex items-center gap-2 mb-4 text-indigo-700">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-bold">O que aprendemos até agora:</h3>
            </div>
            <p className="text-indigo-900 leading-relaxed italic line-clamp-6 hover:line-clamp-none transition-all cursor-pointer">
              {story}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button variant="ghost" onClick={onQuit} className="mt-4 self-center">
        Voltar ao Menu
      </Button>
    </div>
  );
};


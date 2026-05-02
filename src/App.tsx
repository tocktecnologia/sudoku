import React, { useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc, signInWithPopup, signInWithRedirect, googleProvider, collection, addDoc, Timestamp } from './lib/firebase';
import { UserData, THEMES, Theme } from './types';
import { Difficulty, Sudoku } from './lib/sudoku';
import { SudokuGame } from './components/SudokuGame';
import { CareerMode } from './components/CareerMode';
import { Leaderboard } from './components/Leaderboard';
import { OnlineChallenge } from './components/OnlineChallenge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';
import { Trophy, Play, Swords, BookOpen, Star, Calendar, LogIn, LogOut, Settings, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function App() {
  const defaultTheme = THEMES.find((t) => t.name === 'Minimalist') ?? THEMES[0];
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [view, setView] = useState<'home' | 'quick' | 'career' | 'leaderboard' | 'challenge' | 'daily'>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  useEffect(() => {
    // Check for challengeId in URL
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('challengeId');
    if (cid) {
      setChallengeId(cid);
      setView('challenge');
    }

    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        fetchUserData(u.uid);
      } else {
        setUserData(null);
      }
    });
    return () => unsub();
  }, []);

  async function fetchUserData(uid: string) {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      setUserData(snapshot.data() as UserData);
    } else {
      const newData: UserData = {
        uid,
        displayName: auth.currentUser?.displayName || 'Jogador',
        photoURL: auth.currentUser?.photoURL || '',
        careerLevel: 0,
        tokens: 0,
        dailyStreak: 0,
        bestTimes: {}
      };
      await setDoc(docRef, newData);
      setUserData(newData);
    }
  }

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Login realizado com sucesso!");
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const shouldFallbackToRedirect = code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request';

      if (shouldFallbackToRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      toast.error("Erro ao fazer login com Google.");
    }
  };

  const createOnlineChallenge = async () => {
    if (!user) {
      toast.error("Faça login para criar um desafio!");
      return;
    }
    const { board, solution } = Sudoku.generate(difficulty);
    const docRef = await addDoc(collection(db, 'challenges'), {
      board: Sudoku.serialize(board),
      solution: Sudoku.serialize(solution),
      difficulty,
      status: 'waiting',
      players: {
        [user.uid]: {
          uid: user.uid,
          name: user.displayName || 'Jogador',
          photoURL: user.photoURL || '',
          time: 0,
          finished: false,
          mistakes: 0,
          joinedAt: Timestamp.now()
        }
      },
      createdAt: Timestamp.now()
    });
    setChallengeId(docRef.id);
    setView('challenge');
  };

  const submitScore = async (time: number) => {
    if (user) {
      await addDoc(collection(db, 'leaderboards'), {
        userId: user.uid,
        userName: user.displayName,
        time,
        difficulty,
        timestamp: Timestamp.now()
      });
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500 font-sans", theme.bg, theme.text)}>
      <Toaster position="top-center" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 p-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Trophy className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Elegant Sudoku</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1 overflow-x-auto p-1 bg-black/5 rounded-full">
            {THEMES.map(t => (
              <button
                key={t.name}
                onClick={() => setTheme(t)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  theme.name === t.name ? "bg-white text-black shadow-sm" : "hover:bg-white/50"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{userData?.careerLevel ? `Carreira Nível ${userData.careerLevel}` : 'Iniciante'}</p>
                <p className="font-bold">{user.displayName}</p>
              </div>
              <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-500" />
              <Button size="icon" variant="ghost" onClick={() => auth.signOut()}><LogOut className="w-4 h-4" /></Button>
            </div>
          ) : (
            <Button onClick={handleLogin} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <LogIn className="w-4 h-4" /> Entrar
            </Button>
          )}
        </div>
      </header>

      <main className="pt-20 md:pt-24 pb-4 md:pb-12 px-1 md:px-4 container mx-auto flex flex-col items-center min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-8 w-full max-w-4xl"
            >
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <h2 className="text-5xl font-black leading-none">DOMINE <br />A LÓGICA.</h2>
                  <p className="text-xl opacity-80">Um jogo milenar, reimaginado para a era digital. Elegante, funcional e competitivo.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-50">Dificuldade</p>
                  <div className="grid grid-cols-4 gap-2 bg-white/5 p-1 rounded-xl">
                    {(['easy', 'medium', 'moderate', 'hard'] as Difficulty[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold uppercase transition-all",
                          difficulty === d ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-white/10"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => setView('quick')} size="lg" className="h-16 text-lg font-bold gap-2">
                    <Play className="w-5 h-5" /> Jogo Rápido
                  </Button>
                  <Button onClick={() => setView('career')} size="lg" variant="secondary" className="h-16 text-lg font-bold gap-2">
                    <BookOpen className="w-5 h-5" /> Carreira
                  </Button>
                  <Button onClick={createOnlineChallenge} size="lg" variant="outline" className="h-16 text-lg font-bold gap-2">
                    <Swords className="w-5 h-5" /> Desafio
                  </Button>
                  <Button onClick={() => setView('leaderboard')} size="lg" variant="ghost" className="h-16 text-lg font-bold gap-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Rankings
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm self-center">
                <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-2xl skew-x-3 -rotate-3 transition-transform hover:rotate-0 hover:skew-x-0 cursor-pointer" onClick={() => setView('daily')}>
                  <Calendar className="w-8 h-8 mb-4" />
                  <h3 className="text-2xl font-bold mb-1">Desafio Diário</h3>
                  <p className="text-indigo-100 text-sm">Complete o desafio de hoje e ganhe recompensas exclusivas!</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-white/30 rounded-full">
                      <div className="h-full w-2/3 bg-white rounded-full shadow-lg" />
                    </div>
                    <span className="text-xs font-bold">128/200 XP</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 opacity-50 select-none pointer-events-none">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/10 rounded-lg flex items-center justify-center font-bold text-2xl">
                      {Math.floor(Math.random() * 9) + 1}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'quick' && (
            <motion.div key="game" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <SudokuGame
                difficulty={difficulty}
                theme={theme}
                onFinish={submitScore}
                onQuit={() => setView('home')}
              />
            </motion.div>
          )}

          {view === 'career' && userData && (
            <CareerMode userData={userData} onRefreshUser={() => fetchUserData(user.uid)} onQuit={() => setView('home')} />
          )}

          {view === 'leaderboard' && (
            <div className="w-full">
              <Leaderboard />
              <div className="flex justify-center mt-8">
                <Button variant="ghost" onClick={() => setView('home')}>Voltar ao Menu</Button>
              </div>
            </div>
          )}

          {view === 'challenge' && (
            <OnlineChallenge
              challengeId={challengeId || undefined}
              currentUser={user}
              onRequestLogin={handleLogin}
              onQuit={() => setView('home')}
            />
          )}

          {view === 'daily' && (
            <div className="text-center p-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
              <h2 className="text-3xl font-bold mb-4">Desafio Diário em breve!</h2>
              <p className="mb-8">Estamos preparando um quebra-cabeça especial para cada dia do ano.</p>
              <Button onClick={() => setView('home')}>Voltar</Button>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

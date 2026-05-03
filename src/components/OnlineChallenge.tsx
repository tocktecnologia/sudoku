import React, { useState, useEffect } from 'react';
import { db, doc, onSnapshot, updateDoc, setDoc, auth, Timestamp } from '@/src/lib/firebase';
import { Sudoku, Difficulty } from '@/src/lib/sudoku';
import { SudokuGrid } from './SudokuGrid';
import { THEMES, ChallengeData, PlayerInfo } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Users, Send, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

interface OnlineChallengeProps {
  challengeId?: string;
  onQuit: () => void;
}

export const OnlineChallenge: React.FC<OnlineChallengeProps> = ({
  challengeId,
  onQuit
}) => {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [localBoard, setLocalBoard] = useState<number[][] | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [myRole, setMyRole] = useState<'p1' | 'p2' | null>(null);

  useEffect(() => {
    if (!challengeId) return;

    const unsub = onSnapshot(doc(db, 'challenges', challengeId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ChallengeData;
        setChallenge(data);

        // Determine my role
        const uid = auth.currentUser?.uid;
        if (data.players.p1.uid === uid) setMyRole('p1');
        else if (data.players.p2?.uid === uid) setMyRole('p2');
        else if (!data.players.p2 && data.status === 'waiting') {
           // Join as P2 if room is open
           joinChallenge(challengeId);
        }

        if (!localBoard) {
          setLocalBoard(Sudoku.deserialize(data.board));
        }
      }
    });

    return () => unsub();
  }, [challengeId]);

  async function joinChallenge(id: string) {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'challenges', id), {
        'players.p2': {
           uid: auth.currentUser.uid,
           name: auth.currentUser.displayName || 'Jogador 2',
           time: 0,
           finished: false,
           mistakes: 0
        },
        status: 'playing'
      });
      setMyRole('p2');
    } catch (err) {
      console.error(err);
    }
  }

  const handleCellClick = async (num: number) => {
    if (!challenge || !localBoard || !selectedCell || !myRole || challenge.status === 'finished') return;
    const [r, c] = selectedCell;
    const solution = Sudoku.deserialize(challenge.solution);
    const initialBoard = Sudoku.deserialize(challenge.board);

    if (initialBoard[r][c] !== 0) return;

    if (solution[r][c] === num) {
      const newBoard = localBoard.map(row => [...row]);
      newBoard[r][c] = num;
      setLocalBoard(newBoard);

      // Check if finished
      const won = newBoard.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
      if (won) {
        confetti();
        await updateDoc(doc(db, 'challenges', challengeId!), {
          [`players.${myRole}.finished`]: true,
          [`players.${myRole}.time`]: 0, // Simplified: first to finish wins
          status: 'finished',
          winner: myRole
        });
        toast.success("Você Venceu o Desafio!");
      }
    } else {
      toast.error("Número Incorreto!");
      await updateDoc(doc(db, 'challenges', challengeId!), {
        [`players.${myRole}.mistakes`]: (challenge.players[myRole]?.mistakes || 0) + 1
      });
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?challengeId=${challengeId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado! Envie para seu amigo.");
  };

  if (!challenge || !localBoard) return <div className="p-8 text-center">Criando desafio...</div>;

  const opponentRole = myRole === 'p1' ? 'p2' : 'p1';
  const opponent = challenge.players[opponentRole];

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-muted">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
               <Users className="w-5 h-5" />
            </div>
            <div>
               <h2 className="font-bold">Duelo Online</h2>
               <p className="text-xs text-muted-foreground">O primeiro a completar o Sudoku vence!</p>
            </div>
         </div>
         {challenge.status === 'waiting' && (
           <Button onClick={copyLink} variant="outline" size="sm" className="gap-2">
             <Send className="w-4 h-4" /> Convidar Amigo
           </Button>
         )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
         <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <span className="font-bold flex items-center gap-2">Você ({challenge.players[myRole!]?.name})</span>
               <span className="p-1 px-3 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                 Erros: {challenge.players[myRole!]?.mistakes}
               </span>
            </div>
            <SudokuGrid
              board={localBoard}
              initialBoard={Sudoku.deserialize(challenge.board)}
              selectedCell={selectedCell}
              onCellClick={(r, c) => setSelectedCell([r, c])}
              errorCells={[]}
              theme={THEMES[0]}
            />
            <div className="grid grid-cols-9 gap-1">
               {[1,2,3,4,5,6,7,8,9].map(num => (
                 <Button key={num} onClick={() => handleCellClick(num)} variant="outline" className="h-10 text-lg font-bold">
                   {num}
                 </Button>
               ))}
            </div>
         </div>

         <div className="flex flex-col gap-4 opacity-75">
            <div className="flex items-center justify-between">
               <span className="font-bold">Oponente ({opponent?.name || 'Aguardando...'})</span>
               {opponent && (
                 <span className="p-1 px-3 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                    Erros: {opponent.mistakes}
                 </span>
               )}
            </div>
            {opponent ? (
              <div className="bg-muted p-8 rounded-xl flex flex-col items-center justify-center aspect-square border-2 border-dashed border-muted-foreground/30">
                 <Users className="w-12 h-12 text-muted-foreground mb-4 animate-bounce" />
                 <p className="font-medium text-muted-foreground">Oponente Jogando...</p>
                 {opponent.finished && (
                    <div className="mt-4 p-2 px-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 font-bold animate-pulse">
                       <CheckCircle2 className="w-5 h-5" /> TERMINOU!
                    </div>
                 )}
              </div>
            ) : (
              <div className="bg-muted p-8 rounded-xl flex flex-col items-center justify-center aspect-square border-2 border-dashed border-muted-foreground/30">
                 <CardHeader className="text-center">
                    <CardTitle className="text-muted-foreground">Aguardando Amigo</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <Button onClick={copyLink} variant="outline" className="gap-2">
                       <Send className="w-4 h-4" /> Link de Convite
                    </Button>
                 </CardContent>
              </div>
            )}
         </div>
      </div>
      
      {challenge.status === 'finished' && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale: 0.8}} animate={{scale: 1}} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
               <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
               <h2 className="text-3xl font-bold mb-2">Fim de Jogo!</h2>
               <p className="text-xl mb-6">
                 {challenge.winner === myRole ? "Você Ganhou! 🎉" : "Você Perdeu! 😢"}
               </p>
               <Button onClick={onQuit} className="w-full h-12 text-lg">Voltar ao Menu</Button>
            </motion.div>
         </div>
      )}

      <Button variant="ghost" onClick={onQuit} className="mt-8 self-center">
        Desistir
      </Button>
    </div>
  );
};

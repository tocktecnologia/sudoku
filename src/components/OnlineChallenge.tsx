import React, { useEffect, useMemo, useState } from 'react';
import { db, doc, onSnapshot, updateDoc, auth, Timestamp, runTransaction, increment } from '@/src/lib/firebase';
import { Sudoku } from '@/src/lib/sudoku';
import { SudokuGrid } from './SudokuGrid';
import { THEMES, ChallengeData, PlayerInfo } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Send, CheckCircle2, Clock, Share2, QrCode, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

interface OnlineChallengeProps {
  challengeId?: string;
  currentUser?: any;
  onRequestLogin: () => Promise<void> | void;
  onQuit: () => void;
}

export const OnlineChallenge: React.FC<OnlineChallengeProps> = ({
  challengeId,
  currentUser,
  onRequestLogin,
  onQuit,
}) => {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [localBoard, setLocalBoard] = useState<number[][] | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const me = currentUser ? challenge?.players?.[currentUser.uid] : undefined;
  const players = useMemo(() => Object.values(challenge?.players || {}), [challenge]);
  const inviteUrl = useMemo(() => {
    if (!challengeId) return '';
    return `${window.location.origin}${window.location.pathname}?challengeId=${challengeId}`;
  }, [challengeId]);
  const qrCodeUrl = useMemo(() => {
    if (!inviteUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inviteUrl)}`;
  }, [inviteUrl]);

  useEffect(() => {
    if (!challengeId) return;

    const unsub = onSnapshot(doc(db, 'challenges', challengeId), (snapshot) => {
      if (!snapshot.exists()) {
        setChallenge(null);
        return;
      }

      const data = snapshot.data() as ChallengeData;
      setChallenge({ ...data, id: snapshot.id });
      setLocalBoard((prev) => prev ?? Sudoku.deserialize(data.board));
    });

    return () => unsub();
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId || !currentUser) return;

    const joinChallenge = async () => {
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'challenges', challengeId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;

          const data = snap.data() as ChallengeData;
          if (data.status === 'finished') return;

          const existingPlayers = data.players || {};
          if (existingPlayers[currentUser.uid]) return;

          const nextCount = Object.keys(existingPlayers).length + 1;
          const updates: Record<string, any> = {
            [`players.${currentUser.uid}`]: {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Jogador',
              photoURL: currentUser.photoURL || '',
              time: 0,
              finished: false,
              mistakes: 0,
              joinedAt: Timestamp.now(),
            } as PlayerInfo,
          };

          if (!data.startedAt && nextCount >= 2) {
            updates.status = 'playing';
            updates.startedAt = Timestamp.now();
          }

          tx.update(ref, updates);
        });
      } catch (error) {
        console.error(error);
        toast.error('Não foi possível entrar na sala agora.');
      }
    };

    void joinChallenge();
  }, [challengeId, currentUser]);

  useEffect(() => {
    if (!challenge?.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startedAtMs = challenge.startedAt.toDate().getTime();
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [challenge?.startedAt]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success('Link copiado!');
  };

  const shareInvite = async () => {
    if (!inviteUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Desafio Sudoku Online',
          text: 'Entre na minha sala e jogue agora!',
          url: inviteUrl,
        });
        return;
      } catch {
        // usuario cancelou ou share indisponivel
      }
    }

    await copyLink();
  };

  const handleNumberSelect = async (num: number) => {
    if (!challenge || !localBoard || !selectedCell || !currentUser || !me || challenge.status === 'finished') return;

    const [r, c] = selectedCell;
    const solution = Sudoku.deserialize(challenge.solution);
    const initialBoard = Sudoku.deserialize(challenge.board);

    if (initialBoard[r][c] !== 0) return;

    if (solution[r][c] === num) {
      const newBoard = localBoard.map((row) => [...row]);
      newBoard[r][c] = num;
      setLocalBoard(newBoard);

      const won = newBoard.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
      if (!won) return;

      confetti();

      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'challenges', challengeId!);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;

        const data = snap.data() as ChallengeData;
        const updates: Record<string, any> = {
          [`players.${currentUser.uid}.finished`]: true,
          [`players.${currentUser.uid}.time`]: elapsedSeconds,
        };

        if (!data.winner) {
          updates.winner = currentUser.uid;
          updates.status = 'finished';
        }

        tx.update(ref, updates);
      });

      toast.success('Você concluiu seu tabuleiro!');
      return;
    }

    toast.error('Número incorreto!');
    await updateDoc(doc(db, 'challenges', challengeId!), {
      [`players.${currentUser.uid}.mistakes`]: increment(1),
    });
  };

  if (!challengeId) return <div className="p-8 text-center">Desafio inválido.</div>;
  if (!challenge) return <div className="p-8 text-center">Carregando desafio...</div>;

  const gameStarted = Boolean(challenge.startedAt);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-muted/30 p-4 rounded-xl border border-muted">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold">Partida Online</h2>
            <p className="text-xs text-muted-foreground">
              {gameStarted
                ? `Partida em andamento (${players.length} jogadores)`
                : 'Aguardando jogadores para iniciar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-gray-200">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {!currentUser && (
        <Card>
          <CardHeader>
            <CardTitle>Entre com Google para participar</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={onRequestLogin} className="gap-2">
              <LogIn className="w-4 h-4" /> Entrar agora
            </Button>
          </CardContent>
        </Card>
      )}

      {currentUser && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <SudokuGrid
              board={localBoard || Sudoku.deserialize(challenge.board)}
              initialBoard={Sudoku.deserialize(challenge.board)}
              selectedCell={selectedCell}
              onCellClick={(r, c) => setSelectedCell([r, c])}
              errorCells={[]}
              theme={THEMES[0]}
            />

            <div className="grid grid-cols-9 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button key={num} onClick={() => handleNumberSelect(num)} variant="outline" className="h-10 text-lg font-bold">
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Jogadores na sala</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {players.map((player) => (
                  <div key={player.uid} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {player.photoURL ? (
                        <img src={player.photoURL} alt={player.name} className="w-9 h-9 rounded-full border" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground">Erros: {player.mistakes}</p>
                      </div>
                    </div>

                    <div className="text-xs font-bold">
                      {player.finished ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" /> pronto
                        </span>
                      ) : (
                        <span className="text-muted-foreground">jogando</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Convide por link ou QR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code do convite" className="w-full max-w-[220px] mx-auto rounded-md border" />}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={copyLink} variant="outline" className="gap-2">
                    <Send className="w-4 h-4" /> Copiar
                  </Button>
                  <Button onClick={shareInvite} className="gap-2">
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {!gameStarted && (
              <p className="text-xs text-muted-foreground text-center">
                A partida inicia automaticamente quando pelo menos 2 jogadores entrarem.
              </p>
            )}
          </div>
        </div>
      )}

      {challenge.status === 'finished' && currentUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Fim de jogo!</h2>
            <p className="text-xl mb-6">
              {challenge.winner === currentUser.uid ? 'Você venceu! 🎉' : 'Partida encerrada.'}
            </p>
            <Button onClick={onQuit} className="w-full h-12 text-lg">Voltar ao menu</Button>
          </motion.div>
        </div>
      )}

      <Button variant="ghost" onClick={onQuit} className="mt-4 self-center">
        Sair da partida
      </Button>
    </div>
  );
};

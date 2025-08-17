import { create } from 'zustand';
import { BattleConfig, BattlePlayer, Nation, DiscordUser } from '../types';

interface AuthState {
  user: DiscordUser | null;
  isAuthenticated: boolean;
  pwNation: Nation | null;
  isVerified: boolean;
  login: (user: DiscordUser) => void;
  logout: () => void;
  setPWNation: (nation: Nation | null) => void;
  setVerified: (verified: boolean) => void;
}

interface BattleState {
  currentBattle: BattleConfig | null;
  players: BattlePlayer[];
  isHost: boolean;
  actionPoints: number;
  lastAction: string | null;
  setBattle: (battle: BattleConfig | null) => void;
  addPlayer: (player: BattlePlayer) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<BattlePlayer>) => void;
  setActionPoints: (points: number) => void;
  setLastAction: (action: string) => void;
  setIsHost: (isHost: boolean) => void;
  reset: () => void;
}

interface UIState {
  sidebarOpen: boolean;
  currentPage: string;
  loading: boolean;
  error: string | null;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  pwNation: null,
  isVerified: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    pwNation: null, 
    isVerified: false 
  }),
  setPWNation: (nation) => {
    set({ pwNation: nation });
    // Auto-verify if nation is set
    if (nation) {
      set({ isVerified: true });
    }
  },
  setVerified: (verified) => set({ isVerified: verified }),
}));

export const useBattleStore = create<BattleState>((set, get) => ({
  currentBattle: null,
  players: [],
  isHost: false,
  actionPoints: 12, // Default starting action points
  lastAction: null,
  setBattle: (battle) => set({ currentBattle: battle }),
  addPlayer: (player) => set((state) => ({ 
    players: [...(state.players || []), player] 
  })),
  removePlayer: (playerId) => set((state) => ({
    players: (state.players || []).filter(p => p.id !== playerId)
  })),
  updatePlayer: (playerId, updates) => set((state) => ({
    players: (state.players || []).map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    )
  })),
  setActionPoints: (points) => set({ actionPoints: points }),
  setLastAction: (action) => set({ lastAction: action }),
  setIsHost: (isHost) => set({ isHost }),
  reset: () => set({
    currentBattle: null,
    players: [],
    isHost: false,
    actionPoints: 12,
    lastAction: null,
  }),
}));

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  currentPage: 'home',
  loading: false,
  error: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// Selectors
export const useAuth = () => {
  const { user, isAuthenticated, pwNation, isVerified } = useAuthStore();
  return { user, isAuthenticated, pwNation, isVerified };
};

export const useBattle = () => {
  const { currentBattle, players, isHost, actionPoints } = useBattleStore();
  return { currentBattle, players, isHost, actionPoints };
};

export const useUI = () => {
  const { loading, error, currentPage } = useUIStore();
  return { loading, error, currentPage };
};

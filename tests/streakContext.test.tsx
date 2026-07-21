import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StreakProvider, useStreak } from '../src/context/StreakContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

// Mock Firebase
vi.mock('../src/lib/firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}));

describe('StreakContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide streak context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StreakProvider>{children}</StreakProvider>
    );

    const { result } = renderHook(() => useStreak(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.streakInfo).toBeNull();
    expect(result.current.showStreakPopUp).toBe(false);
  });

  it('should update streak info', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    } as any;

    const mockUserData = {
      streak: 5,
      lastStreakUpdate: new Date(Date.now() - 86400000), // Yesterday
      needsHelp: false,
      streakProtections: 1
    };

    (updateDoc as any).mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StreakProvider>{children}</StreakProvider>
    );

    const { result } = renderHook(() => useStreak(), { wrapper });

    await act(async () => {
      await result.current.updateStreak(mockUserData, mockUser);
    });

    expect(result.current.streakInfo).not.toBeNull();
    expect(result.current.streakInfo?.count).toBe(6);
    expect(result.current.showStreakPopUp).toBe(true);
  });

  it('should use streak protection when available', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    } as any;

    const mockUserData = {
      streak: 10,
      lastStreakUpdate: new Date(Date.now() - 172800000), // 2 days ago
      needsHelp: false,
      streakProtections: 2
    };

    (updateDoc as any).mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StreakProvider>{children}</StreakProvider>
    );

    const { result } = renderHook(() => useStreak(), { wrapper });

    await act(async () => {
      await result.current.updateStreak(mockUserData, mockUser);
    });

    expect(result.current.streakInfo?.needsHelp).toBe(false);
    expect(result.current.streakInfo?.count).toBe(10); // Streak not incremented when using protection
  });

  it('should set needsHelp when streak breaks without protection', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    } as any;

    const mockUserData = {
      streak: 10,
      lastStreakUpdate: new Date(Date.now() - 172800000), // 2 days ago
      needsHelp: false,
      streakProtections: 0
    };

    (updateDoc as any).mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StreakProvider>{children}</StreakProvider>
    );

    const { result } = renderHook(() => useStreak(), { wrapper });

    await act(async () => {
      await result.current.updateStreak(mockUserData, mockUser);
    });

    expect(result.current.streakInfo?.needsHelp).toBe(true);
    expect(result.current.streakInfo?.helpExpireAt).not.toBeNull();
  });

  it('should calculate correct phase and multiplier', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    } as any;

    const mockUserData = {
      streak: 20,
      lastStreakUpdate: new Date(Date.now() - 86400000),
      needsHelp: false,
      streakProtections: 0
    };

    (updateDoc as any).mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StreakProvider>{children}</StreakProvider>
    );

    const { result } = renderHook(() => useStreak(), { wrapper });

    await act(async () => {
      await result.current.updateStreak(mockUserData, mockUser);
    });

    expect(result.current.streakInfo?.phase).toBe(3); // 15+ streak
    expect(result.current.streakInfo?.multiplier).toBe(1.5);
  });
});

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutStore {
  /** Desktop (xl+): sidebar inline. true = chỉ icon w-16, false = full w-60 */
  desktopCollapsed: boolean;
  /** Tablet (md to xl-1): overlay drawer */
  tabletDrawerOpen: boolean;

  setDesktopCollapsed: (v: boolean) => void;
  toggleDesktopCollapsed: () => void;
  setTabletDrawerOpen: (v: boolean) => void;
  toggleTabletDrawer: () => void;
  closeAllOverlays: () => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      desktopCollapsed: false,
      tabletDrawerOpen: false,

      setDesktopCollapsed: (v) => set({ desktopCollapsed: v }),
      toggleDesktopCollapsed: () => set((s) => ({ desktopCollapsed: !s.desktopCollapsed })),
      setTabletDrawerOpen: (v) => set({ tabletDrawerOpen: v }),
      toggleTabletDrawer: () => set((s) => ({ tabletDrawerOpen: !s.tabletDrawerOpen })),
      closeAllOverlays: () => set({ tabletDrawerOpen: false }),
    }),
    {
      name: "ordergo.layout",
      version: 1,
      // Chỉ persist desktopCollapsed; drawer transient
      partialize: (s) => ({ desktopCollapsed: s.desktopCollapsed }),
    },
  ),
);

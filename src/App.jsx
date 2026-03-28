import { useState, useRef, useEffect, useCallback } from 'react'
import {
  supabase, getFingerprint,
  fetchStores, fetchSightings, fetchEvents,
  postSighting, confirmSighting, toggleEventRsvp,
  subscribeToSightings,
  signInWithGoogle, signOut, getSession, onAuthStateChange,
  fetchUserSightings, fetchUserFavorites, toggleStoreFavorite, deleteSighting,
} from './supabase'

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

:root {
  --ink: #0E0B08;
  --page: #161008;
  --card: #1E1509;
  --card-2: #251C0C;
  --rule: #3A2910;
  --worn: #4F3B1A;
  --gold: #C17D0E;
  --gold-light: #DCA030;
  --gold-pale: #EFC050;
  --gold-glow: rgba(193,125,14,0.15);
  --paper: #F0E2C8;
  --parchment: #D4C4A0;
  --ghost: #7A6845;
  --fresh: #3D7A3A;
  --stale: #8B7355;
  --urgent: #7A2E2E;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; }

body {
  background: var(--ink);
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
}

/* Grain overlay */
.app-root {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--page);
  overflow-x: hidden;
}

.app-root::before {
  content: '';
  position: fixed;
  inset: 0;
  max-width: 480px;
  left: 50%;
  transform: translateX(-50%);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.035;
  pointer-events: none;
  z-index: 999;
}

/* ─── HEADER ─────────────────────────────────────────────────────────────── */
.header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: calc(52px + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--ink);
  border-bottom: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-emoji {
  font-size: 20px;
  line-height: 1;
}

.header-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--gold-light);
  letter-spacing: 0.05em;
}

.header-user {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 20px;
  cursor: pointer;
  padding: 5px 10px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  transition: border-color 0.15s, color 0.15s;
  white-space: nowrap;
}

.header-user:hover {
  border-color: var(--gold);
  color: var(--gold-light);
}

.header-user.signed-in {
  border: none;
  padding: 0;
}

.header-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--worn);
  display: block;
}

.header-avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--worn);
  color: var(--gold-light);
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 15px;
  display: none;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--rule);
}

/* ─── TAB BAR ────────────────────────────────────────────────────────────── */
.tab-bar {
  position: fixed;
  top: calc(52px + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 40px;
  background: var(--ink);
  border-bottom: 1px solid var(--rule);
  display: flex;
  z-index: 95;
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-bottom: 2px;
}

.tab-btn:hover { color: var(--parchment); }

.tab-btn.active {
  color: var(--gold-light);
  border-bottom-color: var(--gold);
}

.tab-btn-icon { font-size: 13px; }

/* ─── MAP SECTION ─────────────────────────────────────────────────────────── */
.map-section {
  position: relative;
  width: 100%;
  height: 50vh;
  margin-top: calc(92px + env(safe-area-inset-top, 0px));
  background: repeating-linear-gradient(
    45deg,
    rgba(193,125,14,0.03) 0px,
    rgba(193,125,14,0.03) 1px,
    transparent 1px,
    transparent 12px
  ),
  repeating-linear-gradient(
    -45deg,
    rgba(193,125,14,0.03) 0px,
    rgba(193,125,14,0.03) 1px,
    transparent 1px,
    transparent 12px
  );
}

#map-container {
  width: 100%;
  height: 50vh;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  cursor: grab;
}

/* Map overlays */
.map-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 50;
  background: rgba(14,11,8,0.85);
  border: 1px solid var(--gold);
  border-radius: 20px;
  padding: 5px 10px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.map-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
  display: inline-block;
}

.map-near-me {
  position: absolute;
  bottom: 48px;
  left: 12px;
  z-index: 50;
  background: rgba(14,11,8,0.85);
  border: 1px solid var(--worn);
  border-radius: 20px;
  padding: 8px 14px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--parchment);
  letter-spacing: 0.08em;
  cursor: pointer;
  backdrop-filter: blur(4px);
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.2s, color 0.2s;
}

.map-near-me:hover {
  border-color: var(--gold);
  color: var(--gold-light);
}

.map-near-me:active {
  background: var(--gold-glow);
}

.map-legend {
  position: absolute;
  bottom: 48px;
  right: 12px;
  z-index: 50;
  background: rgba(14,11,8,0.88);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 8px 10px;
  backdrop-filter: blur(4px);
}

.map-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.06em;
  line-height: 1.8;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── FILTER STRIP ────────────────────────────────────────────────────────── */
.filter-strip {
  position: sticky;
  top: calc(92px + env(safe-area-inset-top, 0px));
  z-index: 80;
  background: var(--page);
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  padding: 10px 12px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  white-space: nowrap;
}

.filter-strip::-webkit-scrollbar { display: none; }

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  margin-right: 6px;
  border-radius: 20px;
  border: 1px solid var(--rule);
  background: transparent;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  min-height: 32px;
}

.filter-chip:hover {
  border-color: var(--worn);
  color: var(--parchment);
}

.filter-chip.active {
  background: var(--gold-glow);
  border-color: var(--gold);
  color: var(--gold-light);
}

/* ─── SIGHTINGS FEED ─────────────────────────────────────────────────────── */
.feed-section {
  padding: 0 0 120px;
}

.feed-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
}

.feed-header-label {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  white-space: nowrap;
}

.feed-header-meta {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  white-space: nowrap;
}

.feed-header-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--rule), transparent);
}

.sighting-card {
  margin: 0 12px 10px;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  transition: border-color 0.15s, background 0.15s;
}

.sighting-card:hover {
  border-color: var(--worn);
  background: var(--card-2);
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.freshness-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 12px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.freshness-badge.tier-fresh {
  background: rgba(61,122,58,0.2);
  color: #5DB85A;
}

.freshness-badge.tier-recent {
  background: rgba(193,125,14,0.15);
  color: var(--gold-light);
}

.freshness-badge.tier-today {
  background: rgba(193,125,14,0.08);
  color: var(--gold);
}

.freshness-badge.tier-aging {
  background: rgba(122,104,69,0.15);
  color: var(--ghost);
}

.freshness-badge.tier-stale {
  background: transparent;
  color: var(--ghost);
  opacity: 0.7;
}

.freshness-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tier-fresh .freshness-dot { background: #5DB85A; }
.tier-recent .freshness-dot { background: var(--gold-light); }
.tier-today .freshness-dot { background: var(--gold); }
.tier-aging .freshness-dot { background: var(--ghost); }
.tier-stale .freshness-dot { background: var(--ghost); opacity: 0.5; }

.card-distance {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  letter-spacing: 0.05em;
}

.card-store-name {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 18px;
  color: var(--paper);
  line-height: 1.2;
  margin-bottom: 2px;
}

.card-city {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  margin-bottom: 10px;
}

.card-bottles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.bottle-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 12px;
  border: 1px solid var(--gold);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--gold-light);
  font-style: italic;
  background: var(--gold-glow);
}

.card-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-meta {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
}

.card-confirmed {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-saw-it {
  flex: 1;
  padding: 9px 12px;
  border-radius: 6px;
  border: 1px solid var(--worn);
  background: transparent;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
}

.btn-saw-it:hover {
  border-color: var(--gold);
  color: var(--gold-light);
  background: var(--gold-glow);
}

.btn-saw-it.confirmed {
  border-color: var(--fresh);
  color: #5DB85A;
  background: rgba(61,122,58,0.1);
}

.btn-view-map {
  flex: 1;
  padding: 9px 12px;
  border-radius: 6px;
  border: 1px solid var(--rule);
  background: transparent;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
}

.btn-view-map:hover {
  border-color: var(--worn);
  color: var(--parchment);
}

.load-more-btn {
  display: block;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ghost);
  cursor: pointer;
  text-align: center;
  transition: color 0.15s;
  min-height: 44px;
}

.load-more-btn:hover { color: var(--parchment); }

/* ─── EVENTS VIEW ─────────────────────────────────────────────────────────── */
.events-section {
  padding: 0 0 120px;
  margin-top: calc(92px + env(safe-area-inset-top, 0px));
}

.events-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
}

.event-card {
  margin: 0 12px 12px;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  transition: border-color 0.15s;
}

.event-card:hover { border-color: var(--worn); }

.event-card-top {
  border-top: 2px solid var(--gold);
  padding: 12px 14px 10px;
}

.event-card-top.status-today { border-top-color: #5DB85A; }
.event-card-top.status-past  { border-top-color: var(--worn); }

.event-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 12px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-status-badge.upcoming {
  background: var(--gold-glow);
  color: var(--gold-light);
}

.event-status-badge.today {
  background: rgba(61,122,58,0.2);
  color: #5DB85A;
}

.event-status-badge.past {
  background: rgba(79,59,26,0.3);
  color: var(--ghost);
}

.event-countdown {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.04em;
}

.event-name {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--paper);
  line-height: 1.15;
  margin-bottom: 3px;
}

.event-store {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 15px;
  color: var(--parchment);
  margin-bottom: 2px;
}

.event-city {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  margin-bottom: 10px;
}

.event-datetime {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--gold-light);
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.event-bottles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 2px;
}

.event-divider {
  height: 1px;
  background: var(--rule);
  margin: 0 14px;
}

.event-rules {
  padding: 12px 14px;
}

.event-rules-title {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 10px;
}

.event-rule-row {
  display: flex;
  gap: 10px;
  margin-bottom: 9px;
  align-items: flex-start;
}

.event-rule-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
  margin-top: 1px;
}

.event-rule-content {}

.event-rule-label {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--parchment);
  display: block;
  margin-bottom: 1px;
}

.event-rule-text {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  line-height: 1.4;
}

.event-card-footer {
  padding: 10px 14px 13px;
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--rule);
}

.btn-rsvp {
  flex: 1;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--gold);
  background: var(--gold-glow);
  color: var(--gold-light);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
}

.btn-rsvp:hover { background: rgba(193,125,14,0.25); }

.btn-rsvp.going {
  background: rgba(61,122,58,0.15);
  border-color: var(--fresh);
  color: #5DB85A;
}

.btn-share {
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid var(--rule);
  background: transparent;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
}

.btn-share:hover {
  border-color: var(--worn);
  color: var(--parchment);
}

.event-attendees {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  text-align: center;
  padding: 0 14px 12px;
  letter-spacing: 0.04em;
}

/* ─── FAB ─────────────────────────────────────────────────────────────────── */
.fab {
  position: fixed;
  bottom: 24px;
  right: calc(50% - 228px);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(193,125,14,0.4), 0 2px 8px rgba(0,0,0,0.4);
  z-index: 200;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.fab:hover {
  transform: scale(1.06);
  box-shadow: 0 6px 28px rgba(193,125,14,0.5), 0 2px 10px rgba(0,0,0,0.5);
}

.fab:active { transform: scale(0.96); }

@media (max-width: 480px) {
  .fab { right: 20px; }
}

/* ─── BOTTOM SHEET ────────────────────────────────────────────────────────── */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 300;
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.sheet-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.sheet {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  width: 100%;
  max-width: 480px;
  height: 72dvh;
  max-height: 90dvh;
  background: var(--card);
  border-radius: 20px 20px 0 0;
  z-index: 310;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sheet.open {
  transform: translateX(-50%) translateY(0);
}

.sheet-handle-wrap {
  display: flex;
  justify-content: center;
  padding: 12px 0 6px;
  background: var(--card);
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.sheet-handle-wrap:active {
  cursor: grabbing;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--worn);
  transition: background 0.15s;
}

.sheet-handle-wrap:hover .sheet-handle {
  background: var(--gold);
}

.sheet-header {
  padding: 4px 20px 16px;
  border-bottom: 1px solid var(--rule);
  flex-shrink: 0;
}

.sheet-title {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}

.sheet-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: thin;
  scrollbar-color: var(--worn) transparent;
}

.sheet-body::-webkit-scrollbar {
  width: 4px;
}

.sheet-body::-webkit-scrollbar-track {
  background: transparent;
}

.sheet-body::-webkit-scrollbar-thumb {
  background: var(--worn);
  border-radius: 2px;
}

.field-label {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 10px;
  display: block;
}

.bottle-select-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 20px;
}

.bottle-select-chip {
  padding: 7px 12px;
  border-radius: 16px;
  border: 1px solid var(--rule);
  background: transparent;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 36px;
}

.bottle-select-chip:hover {
  border-color: var(--worn);
  color: var(--parchment);
}

.bottle-select-chip.selected {
  background: var(--gold-glow);
  border-color: var(--gold);
  color: var(--gold-light);
}

.field-group {
  margin-bottom: 16px;
}

.text-input {
  width: 100%;
  background: var(--card-2);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  -webkit-appearance: none;
  min-height: 44px;
}

.text-input:focus {
  border-color: var(--gold);
}

.text-input::placeholder {
  color: var(--ghost);
}

.textarea-input {
  width: 100%;
  background: var(--card-2);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  outline: none;
  resize: none;
  transition: border-color 0.15s;
  min-height: 80px;
  -webkit-appearance: none;
}

.textarea-input:focus { border-color: var(--gold); }
.textarea-input::placeholder { color: var(--ghost); }

.char-count {
  display: block;
  text-align: right;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  margin-top: 4px;
}

.location-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--card-2);
  border: 1px solid var(--rule);
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 20px;
  min-height: 44px;
  transition: border-color 0.15s;
}

.location-toggle.on {
  border-color: var(--gold);
}

.toggle-switch {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--rule);
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.toggle-switch.on {
  background: var(--gold);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--paper);
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.toggle-switch.on .toggle-knob {
  transform: translateX(16px);
}

.toggle-label {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
}

.toggle-label.on { color: var(--parchment); }

.btn-post {
  width: 100%;
  padding: 15px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  color: var(--ink);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  min-height: 52px;
  margin-bottom: 12px;
}

.btn-post:hover { opacity: 0.92; }
.btn-post:active { transform: scale(0.99); }

.btn-cancel {
  width: 100%;
  padding: 12px;
  border: none;
  background: none;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  min-height: 44px;
  transition: color 0.15s;
}

.btn-cancel:hover { color: var(--parchment); }

/* ─── TOAST ──────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  top: calc(92px + env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(-12px);
  z-index: 500;
  background: var(--card-2);
  border: 1px solid var(--gold);
  border-radius: 8px;
  padding: 12px 20px;
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--gold-light);
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.toast.show {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

/* ─── LEAFLET OVERRIDES ───────────────────────────────────────────────────── */
.leaflet-container {
  background: #0E0B08 !important;
  font-family: 'Courier Prime', monospace !important;
}

.leaflet-popup-content-wrapper {
  background: var(--card-2) !important;
  border: 1px solid var(--gold) !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 24px rgba(0,0,0,0.6) !important;
  color: var(--paper) !important;
}

.leaflet-popup-tip-container {
  display: none !important;
}

.leaflet-popup-content {
  margin: 0 !important;
  color: var(--paper) !important;
}

.leaflet-popup-close-button {
  color: var(--ghost) !important;
  font-size: 18px !important;
  padding: 6px 8px !important;
  top: 4px !important;
  right: 4px !important;
}

.leaflet-popup-close-button:hover {
  color: var(--paper) !important;
  background: none !important;
}

.leaflet-control-zoom {
  border: 1px solid var(--rule) !important;
  border-radius: 6px !important;
  overflow: hidden;
}

.leaflet-control-zoom a {
  background: rgba(14,11,8,0.85) !important;
  color: var(--ghost) !important;
  border-color: var(--rule) !important;
  width: 30px !important;
  height: 30px !important;
  line-height: 30px !important;
  font-size: 14px !important;
}

.leaflet-control-zoom a:hover {
  background: var(--card-2) !important;
  color: var(--paper) !important;
}

.leaflet-attribution-flag { display: none !important; }
.leaflet-control-attribution {
  background: rgba(14,11,8,0.7) !important;
  color: var(--ghost) !important;
  font-family: 'Courier Prime', monospace !important;
  font-size: 9px !important;
}

.leaflet-control-attribution a {
  color: var(--ghost) !important;
}

/* Popup content styles */
.popup-inner {
  padding: 14px 16px 12px;
  min-width: 220px;
  max-width: 280px;
}

.popup-store {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 16px;
  color: var(--paper);
  margin-bottom: 3px;
  line-height: 1.2;
}

.popup-bottles {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 13px;
  color: var(--parchment);
  margin-bottom: 8px;
  line-height: 1.5;
}

.popup-meta {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}

.popup-confirm-count {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  margin-bottom: 12px;
}

.popup-actions {
  display: flex;
  gap: 6px;
}

.popup-btn {
  flex: 1;
  padding: 8px 10px;
  border-radius: 5px;
  border: 1px solid var(--worn);
  background: transparent;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 36px;
}

.popup-btn:hover {
  border-color: var(--gold);
  color: var(--gold-light);
  background: var(--gold-glow);
}

.popup-btn.confirmed-state {
  border-color: var(--fresh);
  color: #5DB85A;
  background: rgba(61,122,58,0.1);
}

/* ─── PIN ANIMATIONS ─────────────────────────────────────────────────────── */
@keyframes sonar {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.8); opacity: 0; }
}

.pin-fresh .sonar-ring {
  animation: sonar 2s ease-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

/* Other option input */
.other-input {
  margin-top: 8px;
}

/* ─── STORE PICKER ────────────────────────────────────────────────────── */
.store-picker-wrap {
  position: relative;
  margin-bottom: 16px;
}

.store-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-2);
  border: 1px solid var(--gold);
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 10;
  scrollbar-width: none;
}

.store-picker-dropdown::-webkit-scrollbar { display: none; }

.store-picker-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--rule);
  transition: background 0.1s;
}

.store-picker-item:hover { background: rgba(193,125,14,0.08); }
.store-picker-item:last-child { border-bottom: none; }

.store-picker-name {
  display: block;
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--paper);
}

.store-picker-addr {
  display: block;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  margin-top: 2px;
  letter-spacing: 0.03em;
}

.store-picker-empty {
  padding: 12px 14px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
}

.store-picker-hint {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  padding: 4px 2px 0;
  display: block;
}

.store-picker-selected-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: #5DB85A;
  letter-spacing: 0.04em;
}

/* ─── LOADING / STATUS ────────────────────────────────────────────────── */
.feed-loading {
  padding: 32px 20px;
  text-align: center;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  letter-spacing: 0.1em;
}

.db-status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--rule);
}

.db-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Map store dot marker */
.store-dot { background: none; border: none; }

/* ─── PROFILE VIEW ─────────────────────────────────────────────────────────── */
.profile-view {
  padding: 0 0 100px;
}

.profile-user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--rule);
}

.profile-big-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--worn);
  flex-shrink: 0;
}

.profile-big-avatar-fallback {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--worn);
  color: var(--gold-light);
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-user-info { flex: 1; min-width: 0; }

.profile-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--paper);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-email {
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.04em;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-signout-btn {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 4px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 6px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s;
  flex-shrink: 0;
}

.profile-signout-btn:hover { border-color: var(--urgent); color: var(--urgent); }

.profile-section-header {
  padding: 16px 16px 10px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--gold);
  border-bottom: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-section-count {
  color: var(--ghost);
  font-weight: 400;
}

.profile-empty {
  padding: 24px 16px;
  font-size: 11px;
  color: var(--ghost);
  letter-spacing: 0.06em;
  text-align: center;
}

.profile-signin-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 60px 24px;
  text-align: center;
}

.profile-signin-prompt p {
  font-size: 13px;
  color: var(--ghost);
  letter-spacing: 0.06em;
  line-height: 1.6;
}

.profile-signin-google-btn {
  background: var(--card-2);
  border: 1px solid var(--gold);
  border-radius: 8px;
  color: var(--gold-light);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 14px 28px;
  cursor: pointer;
  transition: background 0.15s;
}

.profile-signin-google-btn:hover { background: var(--card); }

.profile-fav-store-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--rule);
}

.profile-fav-store-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--paper);
  flex: 1;
}

.profile-fav-store-city {
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.06em;
}

.profile-fav-remove {
  background: none;
  border: none;
  color: var(--worn);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  line-height: 1;
  transition: color 0.15s;
}

.profile-fav-remove:hover { color: var(--urgent); }

/* Favorite star on sighting cards */
.btn-favorite {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 4px;
  color: var(--worn);
  font-size: 14px;
  padding: 6px 8px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s, border-color 0.15s;
}

.btn-favorite:hover, .btn-favorite.favorited {
  color: var(--gold-light);
  border-color: var(--gold);
}

.btn-delete-sighting {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 4px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 6px 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.btn-delete-sighting:hover {
  border-color: var(--urgent);
  color: var(--urgent);
}

/* ─── CONFIRM MODAL ────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 600;
  backdrop-filter: blur(2px);
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 610;
  background: var(--card-2);
  border: 1px solid var(--rule);
  border-radius: 12px;
  padding: 28px 24px 20px;
  width: min(340px, calc(100vw - 40px));
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
}

.modal-title {
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--urgent);
  margin-bottom: 12px;
}

.modal-body {
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  color: var(--ghost);
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-btn-cancel {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 10px 18px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.modal-btn-cancel:hover { border-color: var(--parchment); color: var(--parchment); }

.modal-btn-confirm {
  background: var(--urgent);
  border: 1px solid var(--urgent);
  border-radius: 6px;
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 10px 18px;
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.15s;
}

.modal-btn-confirm:hover { opacity: 1; }

/* ─── DESKTOP LAYOUT (two-column) ─────────────────────────────────────────── */
@media (min-width: 768px) {
  /* Unlock full-width */
  .app-root {
    max-width: 100%;
  }
  .app-root::before {
    max-width: 100%;
    left: 0;
    transform: none;
  }

  /* Header and tab bar span full width */
  .header {
    max-width: 100%;
    left: 0;
    transform: none;
  }
  .tab-bar {
    max-width: 100%;
    left: 0;
    transform: none;
  }

  /* Left panel: fixed, scrollable sidebar */
  .left-panel {
    position: fixed;
    left: 0;
    top: calc(92px + env(safe-area-inset-top, 0px));
    bottom: 0;
    width: 420px;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid var(--rule);
    background: var(--page);
    scrollbar-width: thin;
    scrollbar-color: var(--worn) transparent;
  }
  .left-panel::-webkit-scrollbar { width: 4px; }
  .left-panel::-webkit-scrollbar-track { background: transparent; }
  .left-panel::-webkit-scrollbar-thumb { background: var(--worn); border-radius: 2px; }

  /* Filter strip sticks to top of left panel */
  .filter-strip {
    position: sticky;
    top: 0;
    z-index: 20;
  }

  /* Events section inside left panel */
  .events-section {
    margin-top: 0;
    padding-bottom: 80px;
  }

  /* Map fills the right side */
  .map-section {
    position: fixed;
    left: 420px;
    right: 0;
    top: calc(92px + env(safe-area-inset-top, 0px));
    bottom: 0;
    height: auto;
    margin-top: 0;
    background: none;
  }
  #map-container {
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
    pointer-events: auto;
  }

  /* Map overlay elements stay anchored inside map-section */
  .map-badge  { top: 16px; left: 16px; }
  .map-near-me { top: 16px; right: 16px; }
  .map-legend { bottom: 32px; left: 16px; }

  /* FAB sits at bottom-left of left panel */
  .fab {
    left: 210px;
    right: auto;
    bottom: 28px;
    transform: translateX(-50%);
  }

  /* Post sighting sheet anchored to left panel */
  .sheet {
    left: 0;
    width: 420px;
    max-width: 420px;
    transform: translateX(0) translateY(100%);
  }
  .sheet.open {
    transform: translateX(0) translateY(0);
  }
}
`

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const NOW = Date.now()

function makeCreatedAt(hoursAgo) {
  return NOW - hoursAgo * 60 * 60 * 1000
}

const INITIAL_SIGHTINGS = [
  { id: '1', store: 'Sandy Forks ABC #01', city: 'Raleigh', state: 'NC', lat: 35.8691, lng: -78.6282, bottles: ["Blanton's Original", "Eagle Rare 10yr"], reporter: 'bourbonhunter_nc', hoursAgo: 0.03, confirmations: 4, notes: 'Both on the shelf, no limit signs posted', dist: '0.3' },
  { id: '2', store: 'Village District ABC #08', city: 'Raleigh', state: 'NC', lat: 35.8050, lng: -78.6621, bottles: ["Weller Special Reserve"], reporter: 'tarheel_pour', hoursAgo: 2.5, confirmations: 7, notes: '3 bottles left when I was there', dist: '1.1' },
  { id: '3', store: 'North Hills ABC #12', city: 'Raleigh', state: 'NC', lat: 35.8509, lng: -78.6438, bottles: ["E.H. Taylor Small Batch"], reporter: 'ncwhiskey_dad', hoursAgo: 5, confirmations: 2, notes: null, dist: '0.7' },
  { id: '4', store: 'Cary Crossroads ABC', city: 'Cary', state: 'NC', lat: 35.7915, lng: -78.7811, bottles: ["Four Roses Limited Edition", "Blanton's Straight from the Barrel"], reporter: 'cary_sipper', hoursAgo: 11, confirmations: 9, notes: 'Manager said more coming Thursday', dist: '3.2' },
  { id: '5', store: 'Morrisville Parkway ABC', city: 'Morrisville', state: 'NC', lat: 35.8326, lng: -78.8255, bottles: ["Weller 12yr", "Weller Full Proof"], reporter: 'triangle_hunter', hoursAgo: 18, confirmations: 12, notes: 'Limit 1 per customer on both', dist: '5.8' },
  { id: '6', store: 'Apex ABC', city: 'Apex', state: 'NC', lat: 35.7321, lng: -78.8503, bottles: ["Eagle Rare 10yr"], reporter: 'apexbourbon', hoursAgo: 28, confirmations: 3, notes: null, dist: '8.4' },
  { id: '7', store: 'Holly Springs ABC', city: 'Holly Springs', state: 'NC', lat: 35.6513, lng: -78.8340, bottles: ["Four Roses Single Barrel"], reporter: 'hs_pours', hoursAgo: 36, confirmations: 5, notes: null, dist: '12.1' },
  { id: '8', store: 'Durham Central ABC', city: 'Durham', state: 'NC', lat: 35.9940, lng: -78.8986, bottles: ["Blanton's Original"], reporter: 'bullcity_wax', hoursAgo: 52, confirmations: 6, notes: 'Gone by noon, got there at 9am', dist: '14.6' },
  { id: '9', store: 'Wake Forest ABC #3', city: 'Wake Forest', state: 'NC', lat: 35.9799, lng: -78.5096, bottles: ["Buffalo Trace", "E.H. Taylor Warehouse C"], reporter: 'wf_barrels', hoursAgo: 72, confirmations: 8, notes: null, dist: '18.3' },
  { id: '10', store: 'Garner ABC #2', city: 'Garner', state: 'NC', lat: 35.7113, lng: -78.6141, bottles: ["Weller Special Reserve"], reporter: 'garner_gold', hoursAgo: 96, confirmations: 1, notes: null, dist: '6.7' },
  { id: '11', store: 'Fuquay-Varina ABC', city: 'Fuquay-Varina', state: 'NC', lat: 35.5832, lng: -78.7997, bottles: ["Blanton's Gold Edition"], reporter: 'fv_find', hoursAgo: 130, confirmations: 4, notes: null, dist: '15.2' },
  { id: '12', store: 'Clayton ABC', city: 'Clayton', state: 'NC', lat: 35.6493, lng: -78.4569, bottles: ["Four Roses Small Batch Select"], reporter: 'johnston_co_pours', hoursAgo: 160, confirmations: 2, notes: null, dist: '21.4' },
].map(s => ({ ...s, createdAt: makeCreatedAt(s.hoursAgo) }))

// ─── EVENTS DATA ──────────────────────────────────────────────────────────
// Dates relative to a fixed reference so demo always looks realistic
const BASE = new Date('2026-03-18T00:00:00')
function eventDate(daysOffset, hour, min = 0) {
  const d = new Date(BASE)
  d.setDate(d.getDate() + daysOffset)
  d.setHours(hour, min, 0, 0)
  return d
}

const EVENTS = [
  {
    id: 'e1',
    name: "Blanton's Allocation Drop",
    store: 'Sandy Forks ABC #01',
    city: 'Raleigh', state: 'NC',
    date: eventDate(1, 9, 0),   // tomorrow 9 AM
    bottles: ["Blanton's Original", "Blanton's Gold"],
    expectedUnits: '~24 bottles total',
    attendees: 31,
    rules: {
      parking: 'Street parking on Sandy Forks Rd. Store lot is first-come, do not block fire lane.',
      overnight: 'No overnight. Line forms at 7:00 AM day-of. Wristbands distributed at 8:45 AM.',
      limit: '1 bottle per customer. ABC policy enforced — no exceptions.',
      id: 'Valid government-issued ID required. Must be 21+.',
      notes: "Manager confirmed shipment arriving Tuesday evening. Drop expected to proceed as scheduled. No rainchecks if sold out.",
    },
  },
  {
    id: 'e2',
    name: "Weller Wednesday Drop",
    store: 'Village District ABC #08',
    city: 'Raleigh', state: 'NC',
    date: eventDate(0, 10, 0),  // today 10 AM
    bottles: ["Weller Special Reserve", "Weller 12yr", "Weller Full Proof"],
    expectedUnits: '~36 bottles across all three expressions',
    attendees: 58,
    rules: {
      parking: 'Garage parking available at Village District — first 2 hrs free.',
      overnight: 'No camping. Line begins at 8:30 AM. Staff will not acknowledge a line before that time.',
      limit: '1 bottle per person per expression. Max 2 Weller labels per customer.',
      id: 'Valid ID required. One ID = one person = one purchase slot.',
      notes: "High demand expected. Lottery system may be used at manager discretion if line exceeds 40 people at open.",
    },
  },
  {
    id: 'e3',
    name: "Eagle Rare Saturday Release",
    store: 'North Hills ABC #12',
    city: 'Raleigh', state: 'NC',
    date: eventDate(3, 8, 30),
    bottles: ["Eagle Rare 10yr"],
    expectedUnits: '~18 bottles',
    attendees: 22,
    rules: {
      parking: 'North Hills mall lot. Do not park in handicap spaces. Overflow on Lassiter Mill Rd.',
      overnight: 'No overnight queuing permitted by mall security. Line begins at 7:00 AM.',
      limit: '1 bottle per customer. Photo ID matched to purchase.',
      id: 'Must present ID at time of purchase. Proxy buying not permitted.',
      notes: "Community tip: The store opens the side entrance on weekends — line up at the right side door, not the main entrance.",
    },
  },
  {
    id: 'e4',
    name: "Four Roses LE & SiB Release",
    store: 'Cary Crossroads ABC',
    city: 'Cary', state: 'NC',
    date: eventDate(8, 9, 0),
    bottles: ["Four Roses Limited Edition", "Four Roses Single Barrel"],
    expectedUnits: '~12 LE + ~20 SiB',
    attendees: 44,
    rules: {
      parking: 'Cary Crossroads shopping center lot. Ample parking, no issues typically.',
      overnight: 'No overnight. Manager starts list at 8:00 AM — must be present to add name. List closes at 8:55 AM.',
      limit: '1 LE per customer, 1 SiB per customer. Separate transactions required.',
      id: 'Government-issued ID. Name on list must match ID exactly.',
      notes: "This store uses a written name list rather than a physical line — highly recommended to arrive early to sign it. Releases tend to go smoothly here.",
    },
  },
  {
    id: 'e5',
    name: "E.H. Taylor Barrel Proof Drop",
    store: 'Morrisville Parkway ABC',
    city: 'Morrisville', state: 'NC',
    date: eventDate(14, 9, 0),
    bottles: ["E.H. Taylor Barrel Proof", "E.H. Taylor Small Batch"],
    expectedUnits: 'Unknown — single case confirmed',
    attendees: 17,
    rules: {
      parking: 'Store strip mall lot. Shared with nail salon — be courteous.',
      overnight: 'No overnight. Line at 7:30 AM. Manager will not open early.',
      limit: '1 bottle total per customer across both expressions.',
      id: 'ID required. Under no circumstances will staff hold bottles.',
      notes: "Small allocation — likely 6-12 bottles combined. Expect a short but serious line. Store has been known to call the police if disputes arise.",
    },
  },
  {
    id: 'e6',
    name: "Buffalo Trace Friday Restock",
    store: 'Durham Central ABC',
    city: 'Durham', state: 'NC',
    date: eventDate(-2, 9, 0),  // 2 days ago — PAST
    bottles: ["Buffalo Trace"],
    expectedUnits: '~48 bottles',
    attendees: 19,
    rules: {
      parking: 'Street parking on Foster St. Metered — bring quarters or use ParkMobile.',
      overnight: 'N/A — this was a standard shelf restock, no formal event.',
      limit: '2 bottles per customer.',
      id: 'ID required at checkout.',
      notes: "PAST EVENT — sold out by 9:45 AM. Line formed organically starting around 8:15 AM.",
    },
  },
]

function getEventStatus(date) {
  const now = new Date()
  const diffMs = date - now
  const diffHrs = diffMs / (1000 * 60 * 60)
  if (diffHrs < -24) return 'past'
  if (diffHrs < 2) return 'today'
  return 'upcoming'
}

function formatEventDate(date) {
  const opts = { weekday: 'short', month: 'short', day: 'numeric' }
  const dateStr = date.toLocaleDateString('en-US', opts).toUpperCase()
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dateStr} · ${timeStr}`
}

function getCountdown(date) {
  const now = new Date()
  const diffMs = date - now
  if (diffMs < 0) {
    const agoHrs = Math.abs(diffMs) / (1000 * 60 * 60)
    if (agoHrs < 24) return `${Math.round(agoHrs)}h ago`
    return `${Math.round(agoHrs / 24)}d ago`
  }
  const hrs = diffMs / (1000 * 60 * 60)
  if (hrs < 24) return `in ${Math.round(hrs)}h`
  return `in ${Math.round(hrs / 24)}d`
}

const FILTERS = ['ALL', "BLANTON'S", 'WELLER', 'EAGLE RARE', 'E.H. TAYLOR', 'FOUR ROSES', 'BUFFALO TRACE']

const BOTTLE_OPTIONS = [
  "Blanton's Original", "Blanton's Gold", "Blanton's Straight",
  "Eagle Rare 10yr", "Weller SR", "Weller 12", "Weller Full Proof",
  "E.H. Taylor SB", "E.H. Taylor Warehouse C",
  "Four Roses LE", "Four Roses SiB", "Buffalo Trace", "Other"
]

// ─── HELPERS ──────────────────────────────────────────────────────────────
function getFreshnessTier(hoursOld) {
  if (hoursOld <= 3) return 'fresh'
  if (hoursOld <= 12) return 'recent'
  if (hoursOld <= 24) return 'today'
  if (hoursOld <= 72) return 'aging'
  if (hoursOld <= 168) return 'stale'
  return 'hidden'
}

function getTierColors() {
  return {
    fresh:  { fill: '#C17D0E', ring: '#DCA030', opacity: 1 },
    recent: { fill: '#C17D0E', ring: '#C17D0E', opacity: 0.85 },
    today:  { fill: '#A06010', ring: '#A06010', opacity: 0.65 },
    aging:  { fill: '#7A6845', ring: '#7A6845', opacity: 0.45 },
    stale:  { fill: '#4F3B1A', ring: '#4F3B1A', opacity: 0.25 },
  }
}

function formatAge(hoursOld) {
  if (hoursOld < 1/60) return 'JUST NOW'
  if (hoursOld < 1) return `${Math.round(hoursOld * 60)} MIN AGO`
  if (hoursOld < 24) return `${Math.round(hoursOld)} HRS AGO`
  return `${Math.round(hoursOld / 24)} DAYS AGO`
}

function formatAgeShort(hoursOld) {
  if (hoursOld < 1/60) return 'just now'
  if (hoursOld < 1) return `${Math.round(hoursOld * 60)}m ago`
  if (hoursOld < 24) return `${Math.round(hoursOld)}h ago`
  return `${Math.round(hoursOld / 24)}d ago`
}

function getTierLabel(tier, hoursOld) {
  if (tier === 'fresh') return 'FRESH'
  if (tier === 'recent') return formatAge(hoursOld)
  if (tier === 'today') return 'TODAY'
  if (tier === 'aging') return formatAge(hoursOld)
  return formatAge(hoursOld)
}

function filterMatches(sighting, filter) {
  if (filter === 'ALL') return true
  const f = filter.toLowerCase()
  return sighting.bottles.some(b => {
    const bl = b.toLowerCase()
    if (f === "blanton's") return bl.includes("blanton")
    if (f === 'weller') return bl.includes("weller")
    if (f === 'eagle rare') return bl.includes("eagle rare")
    if (f === 'e.h. taylor') return bl.includes("e.h. taylor") || bl.includes("eh taylor")
    if (f === 'four roses') return bl.includes("four roses")
    if (f === 'buffalo trace') return bl.includes("buffalo trace")
    return false
  })
}

function makePinSVG(tier, isFresh) {
  const colors = getTierColors()
  const c = colors[tier] || colors.stale
  const size = 36
  const svg = `
    <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      ${isFresh ? `
        <circle cx="${size/2}" cy="${size/2 - 2}" r="16" fill="none" stroke="${c.ring}" stroke-width="1.5" class="sonar-ring" opacity="0.7" />
      ` : ''}
      <filter id="pin-shadow-${tier}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${c.fill}" flood-opacity="${isFresh ? 0.5 : 0.2}" />
      </filter>
      <path
        d="M${size/2} 2 C${size/2-9} 2, ${size/2-15} 8, ${size/2-15} 16 C${size/2-15} 24, ${size/2} ${size+6}, ${size/2} ${size+6} C${size/2} ${size+6}, ${size/2+15} 24, ${size/2+15} 16 C${size/2+15} 8, ${size/2+9} 2, ${size/2} 2 Z"
        fill="${c.fill}"
        opacity="${c.opacity}"
        filter="url(#pin-shadow-${tier})"
      />
      <circle cx="${size/2}" cy="16" r="7" fill="rgba(0,0,0,0.3)" />
      <text x="${size/2}" y="20" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.9)" style="font-family:serif">🍾</text>
    </svg>
  `
  return svg
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('scout')
  const [rsvpd, setRsvpd] = useState(new Set())

  // ── Supabase data (null = not loaded yet / not configured) ─────────────
  const [stores, setStores] = useState([])
  const [dbSightings, setDbSightings] = useState(null)
  const [dbEvents, setDbEvents] = useState(null)
  const [dbReady, setDbReady] = useState(false)

  // ── Local/mock fallback sightings ──────────────────────────────────────
  const [sightings, setSightings] = useState(INITIAL_SIGHTINGS)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [confirmed, setConfirmed] = useState(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [locating, setLocating] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [prefillStore, setPrefillStore] = useState('')
  const [prefillCoords, setPrefillCoords] = useState(null)

  // Post form state
  const [selectedBottles, setSelectedBottles] = useState([])
  const [storeName, setStoreName] = useState('')
  const [cityName, setCityName] = useState('')
  const [notes, setNotes] = useState('')
  const [useLocation, setUseLocation] = useState(true)
  const [otherBottle, setOtherBottle] = useState('')
  const [reporterHandle, setReporterHandle] = useState('')
  const [session, setSession] = useState(null)
  const [favorites, setFavorites] = useState(new Set())
  const [userSightings, setUserSightings] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null) // sighting id pending delete
  // Store picker
  const [storeSearch, setStoreSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)
  const [showStorePicker, setShowStorePicker] = useState(false)

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const storeMarkersRef = useRef([])
  const leafletLoadedRef = useRef(false)
  const toastTimerRef = useRef(null)
  const realtimeChannelRef = useRef(null)
  const sheetRef = useRef(null)
  const sheetBodyRef = useRef(null)
  const dragStartY = useRef(null)
  const dragStartH = useRef(null)

  // ── Supabase bootstrap ─────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return  // demo mode — use mock data

    // Load stores, sightings, and events in parallel
    Promise.all([fetchStores(), fetchSightings(), fetchEvents()]).then(
      ([storeData, sightingData, eventData]) => {
        if (storeData.length)  setStores(storeData)
        if (sightingData)      setDbSightings(sightingData)
        if (eventData)         setDbEvents(eventData)
        setDbReady(true)
      }
    )

    // Real-time subscription — new sightings pushed from other users
    realtimeChannelRef.current = subscribeToSightings(newRow => {
      setDbSightings(prev => [newRow, ...(prev || [])])
    })

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
      }
    }
  }, [])

  // ── Auth session ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return
    getSession().then(setSession)
    return onAuthStateChange((_event, sess) => setSession(sess))
  }, [])

  // ── Pre-fill reporter handle from Google profile ───────────────────────
  useEffect(() => {
    if (session?.user?.user_metadata?.full_name && !reporterHandle) {
      const name = session.user.user_metadata.full_name
        .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 30)
      setReporterHandle(name)
    }
  }, [session])

  // ── Load per-user profile data when session is available ───────────────
  useEffect(() => {
    if (!session?.user?.id) {
      setFavorites(new Set())
      setUserSightings([])
      return
    }
    fetchUserFavorites(session.user.id).then(ids => setFavorites(new Set(ids)))
    fetchUserSightings(session.user.id).then(setUserSightings)
  }, [session?.user?.id])

  // ── Re-validate map when scout tab becomes visible ────────────────────
  useEffect(() => {
    if (activeTab === 'scout' && mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize()
      mapInstanceRef.current.dragging.enable()
    }
  }, [activeTab])

  // ── Draw store dots when stores + map are both ready ───────────────────
  useEffect(() => {
    if (stores.length && mapInstanceRef.current && leafletLoadedRef.current) {
      drawStoreDots(stores, mapInstanceRef.current)
    }
  }, [stores, leafletLoadedRef.current])

  // ── Inject styles + remove loading splash ─────────────────────────────
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = STYLES
    document.head.appendChild(el)
    // Hide the static loading splash once React has mounted
    const splash = document.getElementById('app-loading')
    if (splash) splash.style.display = 'none'
    return () => el.remove()
  }, [])

  // ── Load Leaflet ───────────────────────────────────────────────────────
  useEffect(() => {
    function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return
      const L = window.L
      const map = L.map(mapContainerRef.current, {
        center: [35.7796, -78.6382],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: true,
      })
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)
      mapInstanceRef.current = map
      leafletLoadedRef.current = true
      drawMarkers(INITIAL_SIGHTINGS, 'ALL', map, new Set())

      // Use ResizeObserver so invalidateSize fires exactly when the container
      // gets its real CSS dimensions (fixed-layout, tab show/hide, window resize).
      // This is more reliable than a one-shot setTimeout race.
      const ro = new ResizeObserver(() => {
        map.invalidateSize()
        map.dragging.enable()
      })
      ro.observe(mapContainerRef.current)
      mapContainerRef._resizeCleanup = () => ro.disconnect()
    }

    if (window.L) {
      initMap()
      return
    }

    // Inject Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // Inject Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initMap()
    document.head.appendChild(script)

    return () => {
      if (mapContainerRef._resizeCleanup) {
        mapContainerRef._resizeCleanup()
        delete mapContainerRef._resizeCleanup
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // ── Draw store location dots (all NC ABC stores, muted) ────────────────
  const drawStoreDots = useCallback((storeList, mapInst) => {
    const L = window.L
    if (!L || !mapInst) return

    storeMarkersRef.current.forEach(m => m.remove())
    storeMarkersRef.current = []

    storeList.forEach(store => {
      const icon = L.divIcon({
        html: `<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
          <circle cx="5" cy="5" r="3.5" fill="#3A2910" stroke="#4F3B1A" stroke-width="1" opacity="0.75"/>
        </svg>`,
        className: 'store-dot',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        popupAnchor: [0, -8],
      })

      const popupHTML = `
        <div class="popup-inner">
          <div class="popup-store">${store.name}</div>
          <div class="popup-meta">${store.address} · ${store.city}, ${store.state}</div>
          <div class="popup-actions" style="margin-top:12px">
            <button class="popup-btn" onclick="window.__dsOpenSheetAtStore('${store.id}','${store.name.replace(/'/g, "\\'")}','${store.city}',${store.lat},${store.lng})">
              POST SIGHTING HERE
            </button>
          </div>
        </div>
      `
      const marker = L.marker([store.lat, store.lng], { icon, zIndexOffset: -100 })
      marker.bindPopup(popupHTML, { maxWidth: 280, className: 'ds-popup' })
      marker.addTo(mapInst)
      storeMarkersRef.current.push(marker)
    })
  }, [])

  // ── Draw markers ───────────────────────────────────────────────────────
  const drawMarkers = useCallback((sightingList, filter, mapInst, confirmedSet) => {
    const L = window.L
    if (!L || !mapInst) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const now = Date.now()
    const visible = sightingList.filter(s => {
      const hoursOld = (now - s.createdAt) / (1000 * 60 * 60)
      if (hoursOld > 336) return false // 14 days
      return filterMatches(s, filter)
    })

    visible.forEach(s => {
      const hoursOld = (now - s.createdAt) / (1000 * 60 * 60)
      const tier = getFreshnessTier(hoursOld)
      if (tier === 'hidden') return

      const isFresh = tier === 'fresh'
      const svgContent = makePinSVG(tier, isFresh)
      const iconSize = [36, 44]
      const iconAnchor = [18, 44]

      const icon = L.divIcon({
        html: svgContent,
        className: `map-pin ${isFresh ? 'pin-fresh' : ''}`,
        iconSize,
        iconAnchor,
        popupAnchor: [0, -44],
      })

      const isConfirmed = confirmedSet.has(s.id)
      const confirmCount = isConfirmed ? s.confirmations + 1 : s.confirmations
      const popupHTML = `
        <div class="popup-inner">
          <div class="popup-store">${s.store}</div>
          <div class="popup-bottles">${s.bottles.map(b => `🍾 ${b}`).join('<br/>')}</div>
          <div class="popup-meta">${formatAgeShort(hoursOld)} · @${s.reporter}</div>
          <div class="popup-confirm-count">✓ ${confirmCount} confirmed</div>
          <div class="popup-actions">
            <button class="popup-btn ${isConfirmed ? 'confirmed-state' : ''}"
              onclick="window.__dsConfirm('${s.id}')"
              id="popup-saw-${s.id}">
              ${isConfirmed ? '✓ CONFIRMED' : 'I SAW THIS'}
            </button>
            <button class="popup-btn" onclick="window.__dsOpenSheet('${s.id}','${s.store.replace(/'/g, "\\'")}',${s.lat},${s.lng})">
              POST UPDATE
            </button>
          </div>
        </div>
      `

      const marker = L.marker([s.lat, s.lng], { icon })
      marker.bindPopup(popupHTML, { maxWidth: 300, className: 'ds-popup' })
      marker.addTo(mapInst)
      markersRef.current.push(marker)
    })
  }, [])

  // ── Wire popup callbacks ────────────────────────────────────────────────
  useEffect(() => {
    window.__dsConfirm = (id) => {
      setConfirmed(prev => {
        const next = new Set(prev)
        if (!next.has(id)) next.add(id)
        return next
      })
      // Update button in popup
      const btn = document.getElementById(`popup-saw-${id}`)
      if (btn) {
        btn.textContent = '✓ CONFIRMED'
        btn.classList.add('confirmed-state')
      }
    }
    window.__dsOpenSheet = (id, store, lat, lng) => {
      setPrefillStore(store)
      setStoreName(store)
      setStoreSearch(store)
      setPrefillCoords(lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null)
      setSheetOpen(true)
      requestAnimationFrame(() => { if (sheetBodyRef.current) sheetBodyRef.current.scrollTop = 0 })
    }
    // Opened from a store dot — pre-fill with known store data
    window.__dsOpenSheetAtStore = (storeId, storeName, city, lat, lng) => {
      const storeObj = { id: storeId, name: storeName, city, lat: parseFloat(lat), lng: parseFloat(lng) }
      setSelectedStore(storeObj)
      setStoreSearch(storeName)
      setStoreName(storeName)
      setCityName(city)
      setSheetOpen(true)
      requestAnimationFrame(() => { if (sheetBodyRef.current) sheetBodyRef.current.scrollTop = 0 })
    }
    return () => {
      delete window.__dsConfirm
      delete window.__dsOpenSheet
      delete window.__dsOpenSheetAtStore
    }
  }, [])

  // ── Redraw markers when sightings, filter, or db state changes ─────────
  useEffect(() => {
    if (mapInstanceRef.current && leafletLoadedRef.current) {
      const list = (dbSightings !== null ? dbSightings : sightings).map(s => ({
        ...s,
        store: s.store || s.store_name,
        createdAt: s.createdAt ?? new Date(s.created_at ?? Date.now()).getTime(),
        confirmations: s.confirmations ?? s.confirmation_count ?? 0,
        dist: s.dist || '?',
      }))
      drawMarkers(list, activeFilter, mapInstanceRef.current, confirmed)
    }
  }, [activeFilter, sightings, dbSightings, confirmed, drawMarkers])

  // ── Merge DB or mock sightings into a normalised shape ─────────────────
  const now = Date.now()

  // Normalise a DB row to the same shape as mock sightings
  function normaliseRow(s) {
    const createdAt = s.createdAt ?? new Date(s.created_at).getTime()
    return {
      ...s,
      store: s.store || s.store_name,
      storeId: s.storeId ?? s.store_id ?? null,
      createdAt,
      hoursAgo: (now - createdAt) / (1000 * 60 * 60),
      confirmations: s.confirmations ?? s.confirmation_count ?? 0,
      dist: s.dist || '?',
    }
  }

  const allSightings = (dbSightings !== null ? dbSightings : sightings).map(normaliseRow)

  const filteredSightings = allSightings.filter(s => {
    if (s.hoursAgo > 336) return false
    return filterMatches(s, activeFilter)
  })

  // Events: prefer DB data, fall back to hard-coded EVENTS array
  const activeEvents = dbEvents !== null ? dbEvents.map(e => ({
    ...e,
    date: new Date(e.event_date),
    bottles: e.bottles || [],
    rules: e.rules || {},
    attendees: e.attendee_count || 0,
  })) : EVENTS

  // ── Near Me ────────────────────────────────────────────────────────────
  function handleNearMe() {
    if (!navigator.geolocation || !mapInstanceRef.current) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 13)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  // ── View on map ────────────────────────────────────────────────────────
  function handleViewOnMap(sighting) {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([sighting.lat, sighting.lng], 15)
    // Find and open marker popup
    setTimeout(() => {
      markersRef.current.forEach(m => {
        const ll = m.getLatLng()
        if (Math.abs(ll.lat - sighting.lat) < 0.0001 && Math.abs(ll.lng - sighting.lng) < 0.0001) {
          m.openPopup()
        }
      })
    }, 600)
    // Scroll to top of page to show map
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Confirm sighting ───────────────────────────────────────────────────
  async function handleDeleteSighting(id) {
    if (!session?.user?.id) return
    setDeleteConfirm(null)
    const { ok, error } = await deleteSighting(id, session.user.id)
    if (ok) {
      setUserSightings(prev => prev.filter(s => s.id !== id))
      setDbSightings(prev => prev ? prev.filter(s => s.id !== id) : prev)
    } else {
      alert(`Could not delete sighting: ${error}`)
    }
  }

  async function handleToggleFavorite(storeId) {
    if (!session?.user?.id || !storeId) return
    const isFav = favorites.has(storeId)
    setFavorites(prev => {
      const next = new Set(prev)
      isFav ? next.delete(storeId) : next.add(storeId)
      return next
    })
    await toggleStoreFavorite(storeId, session.user.id, isFav)
  }

  async function handleConfirm(id) {
    // Optimistic update first
    setConfirmed(prev => { const n = new Set(prev); n.add(id); return n })
    // Increment local counter
    const updateCount = list => list.map(s =>
      s.id === id ? { ...s, confirmations: (s.confirmations || 0) + 1 } : s
    )
    if (dbSightings) setDbSightings(prev => updateCount(prev || []))
    else setSightings(prev => updateCount(prev))
    // Persist to DB if available
    if (supabase) await confirmSighting(id, getFingerprint())
  }

  // ── Show toast ─────────────────────────────────────────────────────────
  function showToast() {
    setToastVisible(true)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  // ── Toggle bottle selection ────────────────────────────────────────────
  function toggleBottle(bottle) {
    setSelectedBottles(prev =>
      prev.includes(bottle) ? prev.filter(b => b !== bottle) : [...prev, bottle]
    )
  }

  // ── Submit new sighting ────────────────────────────────────────────────
  async function handlePost() {
    const bottleList = selectedBottles.includes('Other') && otherBottle.trim()
      ? [...selectedBottles.filter(b => b !== 'Other'), otherBottle.trim()]
      : selectedBottles

    if (!bottleList.length || !storeName.trim()) return

    const fp = getFingerprint()
    const handle = reporterHandle.trim() || ('scout_' + fp.slice(-4))

    // Always pin to store location — never user GPS
    const lat = selectedStore?.lat ?? prefillCoords?.lat ?? 35.7796
    const lng = selectedStore?.lng ?? prefillCoords?.lng ?? -78.6382

    const localSighting = {
      id: `local-${Date.now()}`,
      store_name: storeName.trim(),
      store: storeName.trim(),        // compat with mock data path
      city: cityName.trim() || selectedStore?.city || 'Unknown',
      state: 'NC',
      lat, lng,
      bottles: bottleList,
      reporter: handle,
      store_id: selectedStore?.id || null,
      hoursAgo: 0,
      createdAt: Date.now(),
      created_at: new Date().toISOString(),
      confirmations: 0,
      confirmation_count: 0,
      notes: notes.trim() || null,
      dist: '0.1',
    }

    // Close sheet and reset form immediately for fast feel
    setSheetOpen(false)
    setSelectedBottles([])
    setStoreName('')
    setCityName('')
    setNotes('')
    setOtherBottle('')
    setReporterHandle('')
    setStoreSearch('')
    setSelectedStore(null)
    setPrefillStore('')

    // Fly to new pin
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 15)
      }
    }, 300)

    if (supabase) {
      // Post to DB — realtime subscription will push it back, but also add locally
      const saved = await postSighting({
        store_id: selectedStore?.id || null,
        store_name: storeName.trim(),
        city: localSighting.city,
        state: 'NC',
        lat, lng,
        bottles: bottleList,
        reporter: handle,
        notes: localSighting.notes,
        user_id: session?.user?.id || null,
      })
      // Add the DB row (with real UUID) or fall back to local object
      const row = saved ? { ...saved, store: saved.store_name, confirmations: 0 } : localSighting
      setDbSightings(prev => [row, ...(prev || [])])
    } else {
      setSightings(prev => [localSighting, ...prev])
    }

    showToast()
  }

  // ── Open sheet ─────────────────────────────────────────────────────────
  function openSheet() {
    setSheetOpen(true)
    // Always start sheet scrolled to top so bottles section is visible first
    requestAnimationFrame(() => {
      if (sheetBodyRef.current) sheetBodyRef.current.scrollTop = 0
    })
  }

  function onHandlePointerDown(e) {
    e.preventDefault()
    dragStartY.current = e.clientY
    dragStartH.current = sheetRef.current?.offsetHeight ?? 0

    function onMove(ev) {
      if (dragStartY.current === null) return
      const dy = dragStartY.current - ev.clientY
      const maxH = window.innerHeight * 0.9
      const newH = Math.max(220, Math.min(maxH, dragStartH.current + dy))
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none'
        sheetRef.current.style.height = newH + 'px'
      }
    }

    function onUp() {
      const h = sheetRef.current?.offsetHeight ?? 0
      if (sheetRef.current) sheetRef.current.style.transition = ''
      if (h < 260) {
        if (sheetRef.current) sheetRef.current.style.height = ''
        closeSheet()
      }
      dragStartY.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  function closeSheet() {
    if (sheetRef.current) sheetRef.current.style.height = ''
    setSheetOpen(false)
    setPrefillStore('')
    setPrefillCoords(null)
    setStoreSearch('')
    setSelectedStore(null)
    if (!prefillStore) setStoreName('')
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-emoji">🥃</span>
          <span className="header-title">DRAM SCOUT</span>
        </div>
        {session ? (
          <button
            className="header-user signed-in"
            onClick={() => signOut()}
            title={`Signed in as ${session.user.user_metadata?.full_name || session.user.email} · Click to sign out`}
          >
            <img
              src={session.user.user_metadata?.avatar_url}
              alt=""
              className="header-avatar"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
            />
            <span className="header-avatar-fallback">
              {(session.user.user_metadata?.full_name || session.user.email || '?')[0].toUpperCase()}
            </span>
          </button>
        ) : (
          <button className="header-user" onClick={() => signInWithGoogle()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="8" r="4"/>
              <path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
            SIGN IN
          </button>
        )}
      </header>

      {/* ── TAB BAR ─────────────────────────────────────────────────── */}
      <nav className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'scout' ? ' active' : ''}`}
          onClick={() => setActiveTab('scout')}
        >
          <span className="tab-btn-icon">🗺</span> SCOUT
        </button>
        <button
          className={`tab-btn${activeTab === 'events' ? ' active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <span className="tab-btn-icon">📅</span> EVENTS
        </button>
        <button
          className={`tab-btn${activeTab === 'profile' ? ' active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-btn-icon">👤</span> PROFILE
        </button>
      </nav>

      {/* ── MAP SECTION ─────────────────────────────────────────────── */}
      <section className="map-section" style={{ display: activeTab === 'scout' ? undefined : 'none' }} aria-hidden={activeTab !== 'scout'}>
        <div id="map-container" ref={mapContainerRef} />

        {/* Badge */}
        <div className="map-badge">
          <span className="map-badge-dot" />
          {filteredSightings.length} SIGHTINGS
        </div>

        {/* Near Me */}
        <button className="map-near-me" onClick={handleNearMe}>
          {locating ? '⏳ LOCATING...' : '◎ NEAR ME'}
        </button>

        {/* Legend */}
        <div className="map-legend">
          {[
            { tier: 'fresh', color: '#C17D0E', label: 'FRESH' },
            { tier: 'recent', color: '#C17D0E', label: 'RECENT' },
            { tier: 'today', color: '#A06010', label: 'TODAY' },
            { tier: 'aging', color: '#7A6845', label: 'AGING' },
          ].map(({ tier, color, label }) => (
            <div key={tier} className="map-legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── LEFT PANEL (desktop: fixed scrollable sidebar; mobile: flow) ── */}
      <div className="left-panel">

      {/* ── DB STATUS BAR ───────────────────────────────────────────── */}
      {activeTab === 'scout' && (
        <div className="db-status-bar">
          <span className="db-status-dot" style={{ background: supabase ? (dbReady ? '#5DB85A' : '#C17D0E') : '#4F3B1A' }} />
          {supabase
            ? (dbReady ? `LIVE · ${filteredSightings.length} SIGHTINGS · ${stores.length} STORES MAPPED` : 'CONNECTING...')
            : `DEMO MODE · ${filteredSightings.length} MOCK SIGHTINGS`}
        </div>
      )}

      {/* ── FILTER STRIP ────────────────────────────────────────────── */}
      <div className="filter-strip" style={{ display: activeTab === 'scout' ? undefined : 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── SIGHTINGS FEED ──────────────────────────────────────────── */}
      <section className="feed-section" style={{ display: activeTab === 'scout' ? undefined : 'none' }}>
        <div className="feed-header">
          <span className="feed-header-label">RECENT SIGHTINGS</span>
          <span className="feed-header-meta">{filteredSightings.length} REPORTS · LAST 7 DAYS</span>
          <div className="feed-header-rule" />
        </div>

        {filteredSightings.slice(0, visibleCount).map(s => {
          const hoursOld = (now - s.createdAt) / (1000 * 60 * 60)
          const tier = getFreshnessTier(hoursOld)
          const isConfirmed = confirmed.has(s.id)
          const confirmCount = isConfirmed ? s.confirmations + 1 : s.confirmations

          return (
            <div key={s.id} className="sighting-card">
              <div className="card-top-row">
                <span className={`freshness-badge tier-${tier}`}>
                  <span className="freshness-dot" />
                  {getTierLabel(tier, hoursOld)}
                </span>
                <span className="card-distance">{s.dist || '?'} MI →</span>
              </div>

              <div className="card-store-name">{s.store}</div>
              <div className="card-city">{s.city}, {s.state}</div>

              <div className="card-bottles">
                {s.bottles.map(b => (
                  <span key={b} className="bottle-chip">🍾 {b}</span>
                ))}
              </div>

              <div className="card-meta-row">
                <span className="card-meta">@{s.reporter}</span>
                <span className="card-confirmed">✓ {confirmCount} confirmed</span>
              </div>

              {s.notes && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: '11px', color: 'var(--ghost)', marginBottom: '10px', fontStyle: 'italic' }}>
                  "{s.notes}"
                </div>
              )}

              <div className="card-actions">
                <button
                  className={`btn-saw-it${isConfirmed ? ' confirmed' : ''}`}
                  onClick={() => !isConfirmed && handleConfirm(s.id)}
                >
                  {isConfirmed ? '✓ CONFIRMED' : 'I SAW THIS'}
                </button>
                <button className="btn-view-map" onClick={() => handleViewOnMap(s)}>
                  VIEW ON MAP
                </button>
                {session && s.storeId && (
                  <button
                    className={`btn-favorite${favorites.has(s.storeId) ? ' favorited' : ''}`}
                    onClick={() => handleToggleFavorite(s.storeId)}
                    title={favorites.has(s.storeId) ? 'Remove favorite' : 'Save store'}
                  >
                    {favorites.has(s.storeId) ? '★' : '☆'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {visibleCount < filteredSightings.length && (
          <button className="load-more-btn" onClick={() => setVisibleCount(v => v + 10)}>
            LOAD {Math.min(10, filteredSightings.length - visibleCount)} MORE SIGHTINGS
          </button>
        )}

        {filteredSightings.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'Courier Prime', monospace", color: 'var(--ghost)', fontSize: '12px', letterSpacing: '0.08em' }}>
            NO SIGHTINGS FOUND<br />
            <span style={{ fontSize: '10px', marginTop: '8px', display: 'block', opacity: 0.6 }}>BE THE FIRST TO POST ONE</span>
          </div>
        )}
      </section>

      {/* ── EVENTS VIEW ─────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <section className="events-section">
          <div className="events-header">
            <span className="feed-header-label">UPCOMING DROPS</span>
            <span className="feed-header-meta">{EVENTS.filter(e => getEventStatus(e.date) !== 'past').length} SCHEDULED</span>
            <div className="feed-header-rule" />
          </div>

          {activeEvents.map(event => {
            const status = getEventStatus(event.date)
            const isGoing = rsvpd.has(event.id)
            return (
              <div key={event.id} className="event-card">
                <div className={`event-card-top status-${status}`}>
                  <div className="event-status-row">
                    <span className={`event-status-badge ${status}`}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                        background: status === 'upcoming' ? 'var(--gold-light)' : status === 'today' ? '#5DB85A' : 'var(--ghost)',
                        flexShrink: 0,
                      }} />
                      {status === 'upcoming' ? 'UPCOMING' : status === 'today' ? 'TODAY' : 'PAST'}
                    </span>
                    <span className="event-countdown">{getCountdown(event.date)}</span>
                  </div>

                  <div className="event-name">{event.name}</div>
                  <div className="event-store">{event.store}</div>
                  <div className="event-city">{event.city}, {event.state}</div>

                  <div className="event-datetime">
                    <span>📅</span>
                    {formatEventDate(event.date)}
                  </div>

                  <div className="event-bottles">
                    {event.bottles.map(b => (
                      <span key={b} className="bottle-chip">🍾 {b}</span>
                    ))}
                  </div>
                  {event.expectedUnits && (
                    <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: '10px', color: 'var(--ghost)', marginTop: 8, letterSpacing: '0.04em' }}>
                      EST. STOCK · {event.expectedUnits}
                    </div>
                  )}
                </div>

                <div className="event-divider" />

                <div className="event-rules">
                  <div className="event-rules-title">Drop Rules & Info</div>
                  <div className="event-rule-row">
                    <span className="event-rule-icon">🅿️</span>
                    <div className="event-rule-content">
                      <span className="event-rule-label">Parking</span>
                      <span className="event-rule-text">{event.rules.parking}</span>
                    </div>
                  </div>
                  <div className="event-rule-row">
                    <span className="event-rule-icon">🌙</span>
                    <div className="event-rule-content">
                      <span className="event-rule-label">Overnight / Line Policy</span>
                      <span className="event-rule-text">{event.rules.overnight}</span>
                    </div>
                  </div>
                  <div className="event-rule-row">
                    <span className="event-rule-icon">🪪</span>
                    <div className="event-rule-content">
                      <span className="event-rule-label">ID Requirements</span>
                      <span className="event-rule-text">{event.rules.id}</span>
                    </div>
                  </div>
                  <div className="event-rule-row">
                    <span className="event-rule-icon">📋</span>
                    <div className="event-rule-content">
                      <span className="event-rule-label">Bottle Limit</span>
                      <span className="event-rule-text">{event.rules.limit}</span>
                    </div>
                  </div>
                  <div className="event-rule-row">
                    <span className="event-rule-icon">💬</span>
                    <div className="event-rule-content">
                      <span className="event-rule-label">Community Notes</span>
                      <span className="event-rule-text">{event.rules.notes}</span>
                    </div>
                  </div>
                </div>

                <div className="event-card-footer">
                  <button
                    className={`btn-rsvp${isGoing ? ' going' : ''}`}
                    onClick={async () => {
                      const going = rsvpd.has(event.id)
                      setRsvpd(prev => { const n = new Set(prev); going ? n.delete(event.id) : n.add(event.id); return n })
                      if (supabase) await toggleEventRsvp(event.id, getFingerprint(), going)
                    }}
                    disabled={status === 'past'}
                    style={status === 'past' ? { opacity: 0.4, cursor: 'default' } : {}}
                  >
                    {isGoing ? "✓ I'M GOING" : status === 'past' ? 'PAST EVENT' : "I'LL BE THERE"}
                  </button>
                  <button className="btn-share">SHARE</button>
                </div>
                <div className="event-attendees">
                  {isGoing
                    ? `You + ${event.attendees} others going`
                    : `${event.attendees} people going`}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* ── PROFILE VIEW ────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="profile-view">
          {session ? (
            <>
              {/* User card */}
              <div className="profile-user-card">
                {session.user.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} className="profile-big-avatar" alt="" />
                ) : (
                  <div className="profile-big-avatar-fallback">
                    {(session.user.user_metadata?.full_name || session.user.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="profile-user-info">
                  <div className="profile-name">{session.user.user_metadata?.full_name || 'Scout'}</div>
                  <div className="profile-email">{session.user.email}</div>
                </div>
                <button className="profile-signout-btn" onClick={() => signOut()}>SIGN OUT</button>
              </div>

              {/* My Sightings */}
              <div className="profile-section-header">
                MY SIGHTINGS
                <span className="profile-section-count">{userSightings.length}</span>
              </div>
              {userSightings.length === 0 ? (
                <div className="profile-empty">No sightings posted yet — be the first to scout!</div>
              ) : userSightings.map(s => {
                const hoursOld = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60)
                const tier = getFreshnessTier(hoursOld)
                return (
                  <div key={s.id} className="sighting-card">
                    <div className="card-top-row">
                      <span className={`freshness-badge tier-${tier}`}>
                        <span className="freshness-dot" />
                        {getTierLabel(tier, hoursOld)}
                      </span>
                    </div>
                    <div className="card-store-name">{s.store_name}</div>
                    <div className="card-city">{s.city}, {s.state}</div>
                    <div className="card-bottles">
                      {(s.bottles || []).map(b => <span key={b} className="bottle-chip">🍾 {b}</span>)}
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta">@{s.reporter}</span>
                      <span className="card-confirmed">✓ {s.confirmation_count} confirmed</span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-delete-sighting"
                        onClick={() => setDeleteConfirm(s.id)}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Favorite Stores */}
              <div className="profile-section-header" style={{ marginTop: 8 }}>
                FAVORITE STORES
                <span className="profile-section-count">{favorites.size}</span>
              </div>
              {favorites.size === 0 ? (
                <div className="profile-empty">No favorites yet — tap ★ on any sighting card to save a store</div>
              ) : stores.filter(s => favorites.has(s.id)).map(store => (
                <div key={store.id} className="profile-fav-store-row">
                  <div style={{ flex: 1 }}>
                    <div className="profile-fav-store-name">{store.name}</div>
                    <div className="profile-fav-store-city">{store.city}, {store.state}</div>
                  </div>
                  <button
                    className="profile-fav-remove"
                    onClick={() => handleToggleFavorite(store.id)}
                    title="Remove favorite"
                  >★</button>
                </div>
              ))}

              {/* My Events */}
              <div className="profile-section-header" style={{ marginTop: 8 }}>
                MY EVENTS
                <span className="profile-section-count">{rsvpd.size}</span>
              </div>
              {rsvpd.size === 0 ? (
                <div className="profile-empty">No events RSVPd yet — check the Events tab</div>
              ) : activeEvents.filter(e => rsvpd.has(e.id)).map(event => (
                <div key={event.id} className="profile-fav-store-row">
                  <div style={{ flex: 1 }}>
                    <div className="profile-fav-store-name">{event.name}</div>
                    <div className="profile-fav-store-city">{event.store} · {formatEventDate(event.date)}</div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="profile-signin-prompt">
              <p>SIGN IN WITH GOOGLE TO TRACK YOUR SIGHTINGS, SAVE FAVORITE STORES, AND RSVP TO BOURBON DROPS</p>
              <button className="profile-signin-google-btn" onClick={() => signInWithGoogle()}>
                SIGN IN WITH GOOGLE
              </button>
            </div>
          )}
        </div>
      )}

      </div>{/* end .left-panel */}

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <button className="fab" onClick={openSheet} aria-label="Post sighting">
        +
      </button>

      {/* ── BOTTOM SHEET ─────────────────────────────────────────────── */}
      <div className={`sheet-overlay${sheetOpen ? ' open' : ''}`} onClick={closeSheet} />
      <div
        ref={sheetRef}
        className={`sheet${sheetOpen ? ' open' : ''}`}
        onTouchStart={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        <div className="sheet-handle-wrap" onPointerDown={onHandlePointerDown}>
          <div className="sheet-handle" />
        </div>
        <div className="sheet-header">
          <div className="sheet-title">POST A SIGHTING</div>
        </div>
        <div ref={sheetBodyRef} className="sheet-body">
          {/* Bottles */}
          <label className="field-label">BOTTLE(S) SPOTTED</label>
          <div className="bottle-select-grid">
            {BOTTLE_OPTIONS.map(b => (
              <button
                key={b}
                className={`bottle-select-chip${selectedBottles.includes(b) ? ' selected' : ''}`}
                onClick={() => toggleBottle(b)}
              >
                {b}
              </button>
            ))}
          </div>
          {selectedBottles.includes('Other') && (
            <div className="field-group other-input">
              <input
                className="text-input"
                placeholder="Bottle name..."
                value={otherBottle}
                onChange={e => setOtherBottle(e.target.value)}
              />
            </div>
          )}

          {/* Store Picker */}
          <label className="field-label">STORE</label>
          <div className="store-picker-wrap">
            <input
              className="text-input"
              placeholder={stores.length ? 'Search store name or city...' : 'Store name...'}
              value={storeSearch}
              onChange={e => {
                setStoreSearch(e.target.value)
                setStoreName(e.target.value)
                setSelectedStore(null)
                setShowStorePicker(true)
              }}
              onFocus={() => setShowStorePicker(true)}
              onBlur={() => setTimeout(() => setShowStorePicker(false), 180)}
              style={{ borderRadius: showStorePicker && storeSearch.length > 0 ? '8px 8px 0 0' : undefined }}
            />
            {showStorePicker && storeSearch.length > 0 && (() => {
              const matches = stores.filter(s =>
                s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                s.city.toLowerCase().includes(storeSearch.toLowerCase())
              ).slice(0, 8)
              return (
                <div className="store-picker-dropdown">
                  {matches.length > 0 ? matches.map(s => (
                    <div key={s.id} className="store-picker-item"
                      onMouseDown={() => {
                        setSelectedStore(s)
                        setStoreSearch(s.name)
                        setStoreName(s.name)
                        setCityName(s.city)
                        setShowStorePicker(false)
                      }}>
                      <span className="store-picker-name">{s.name}</span>
                      <span className="store-picker-addr">{s.address} · {s.city}, {s.state}</span>
                    </div>
                  )) : (
                    <div className="store-picker-empty">No matches — will post as custom store</div>
                  )}
                </div>
              )
            })()}
            {selectedStore && (
              <div className="store-picker-selected-bar">
                ✓ {selectedStore.address} · {selectedStore.city}, NC
              </div>
            )}
            {!selectedStore && !stores.length && (
              <span className="store-picker-hint">Connect Supabase to search all NC ABC stores</span>
            )}
          </div>

          {/* City — only shown if no store selected from picker */}
          {!selectedStore && (
            <div className="field-group">
              <label className="field-label">CITY</label>
              <input
                className="text-input"
                placeholder="City"
                value={cityName}
                onChange={e => setCityName(e.target.value)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="field-group">
            <label className="field-label">NOTES (OPTIONAL)</label>
            <textarea
              className="textarea-input"
              placeholder="Anything helpful? Limit posted, stock level, etc."
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 140))}
              rows={3}
            />
            <span className="char-count">{140 - notes.length} REMAINING</span>
          </div>

          {/* Handle */}
          <div className="field-group">
            <label className="field-label">YOUR HANDLE (OPTIONAL)</label>
            <input
              className="text-input"
              placeholder="@bourbonhunter_nc"
              value={reporterHandle}
              onChange={e => setReporterHandle(e.target.value.replace(/\s/g, '_').slice(0, 30))}
            />
          </div>

          {/* Submit */}
          <button className="btn-post" onClick={handlePost}>
            POST SIGHTING
          </button>
          <button className="btn-cancel" onClick={closeSheet}>
            CANCEL
          </button>
        </div>
      </div>

      {/* ── TOAST ───────────────────────────────────────────────────── */}
      <div className={`toast${toastVisible ? ' show' : ''}`}>
        ✓ SIGHTING POSTED
      </div>

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────── */}
      {deleteConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} />
          <div className="modal">
            <div className="modal-title">DELETE SIGHTING?</div>
            <div className="modal-body">
              This sighting will be permanently removed from the map and feed. This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setDeleteConfirm(null)}>
                CANCEL
              </button>
              <button className="modal-btn-confirm" onClick={() => handleDeleteSighting(deleteConfirm)}>
                DELETE
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

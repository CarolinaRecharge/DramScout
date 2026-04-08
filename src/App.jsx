import { useState, useRef, useEffect, useCallback } from 'react'
import { Filter } from 'bad-words'
import ScoutTab from './components/ScoutTab.jsx'
import { useProfile } from './hooks/useProfile.js'
import { HomeCountyModal } from './components/HomeCountyModal.jsx'
import { CountyPicker } from './components/CountyPicker.jsx'
import { distanceMiles } from './data/ncCounties.js'
import {
  supabase, getFingerprint,
  fetchStores, fetchSightings, fetchEvents,
  postSighting, confirmSighting, toggleEventRsvp,
  postEvent, updateEvent, deleteEvent,
  fetchEventQueue, joinEventQueue, leaveEventQueue,
  subscribeToSightings,
  signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, signOut, getSession, onAuthStateChange,
  fetchUserSightings, fetchUserFavorites, toggleStoreFavorite, deleteSighting,
  fetchUserRole, upsertUserRole, upsertProfile, searchProfiles, fetchRoleForUser,
  fetchAllProfilesWithRoles,
  deleteSightingAdmin, deleteEventAdmin,
  fetchComments, postComment, deleteComment, deleteCommentAdmin,
  fetchNotificationPrefs, upsertNotificationPrefs, savePushSubscription, deletePushSubscription,
  fetchForumCategories, fetchForumThreads, fetchForumPosts,
  fetchForumReactions, postForumThread, postForumPost,
  deleteForumPost, deleteForumPostAdmin,
  deleteForumThread, deleteForumThreadAdmin,
  toggleForumReaction, subscribeToForumPosts,
  fetchUserPhone,
  fetchUserHandle,
  updateUserHandle,
} from './supabase'

const ADMIN_EMAIL = 'danielk.black95@gmail.com'
const ROLE_ORDER = { admin: 4, store: 3, collector: 2, scout: 1 }
const ROLE_LABELS = {
  admin:     { label: 'ADMIN',     color: '#C17D0E', bg: 'rgba(193,125,14,0.12)',  desc: 'Full access — can manage all content and users' },
  store:     { label: 'STORE',     color: '#4A9ECA', bg: 'rgba(74,158,202,0.12)',  desc: 'Can create Drops, Meet-ups, and Tastings' },
  collector: { label: 'COLLECTOR', color: '#9E5EA8', bg: 'rgba(158,94,168,0.12)',  desc: 'Can create Meet-ups and Tastings' },
  scout:     { label: 'SCOUT',     color: 'var(--ghost)', bg: 'rgba(255,255,255,0.05)', desc: 'Can post sightings and confirm others' },
}

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

.header-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
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

.header-mode-toggle {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold);
  background: none;
  border-radius: 20px;
  padding: 5px 14px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.header-mode-toggle:hover { background: var(--gold-glow); }

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
  pointer-events: none; /* only #map-container and explicit overlays receive events */
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
  pointer-events: auto;
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
  pointer-events: none;
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
  cursor: pointer;
  user-select: none;
}
.feed-header:hover .feed-header-label { opacity: 0.8; }
.feed-header-chevron {
  flex-shrink: 0;
  color: var(--gold);
  opacity: 0.6;
  font-size: 10px;
  transition: transform 0.2s;
}
.feed-header-chevron.open { transform: rotate(180deg); }

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
  padding: 16px 16px 8px;
}

.event-type-filter {
  display: flex;
  gap: 6px;
  padding: 0 16px 12px;
  flex-wrap: wrap;
}

.btn-evt-type-filter {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 16px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-evt-type-filter:hover { border-color: var(--worn); color: var(--parchment); }
.btn-evt-type-filter.active-drop  { border-color: var(--gold); color: var(--gold); background: rgba(193,125,14,0.1); }
.btn-evt-type-filter.active-meetup { border-color: #4A9ECA; color: #4A9ECA; background: rgba(74,158,202,0.1); }
.btn-evt-type-filter.active-tasting { border-color: #9E5EA8; color: #9E5EA8; background: rgba(158,94,168,0.1); }
.btn-evt-type-filter.active-all { border-color: var(--parchment); color: var(--parchment); background: rgba(255,255,255,0.06); }

.event-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid;
  margin-right: 6px;
}
.event-type-badge.drop    { border-color: var(--gold);  color: var(--gold);  background: rgba(193,125,14,0.1); }
.event-type-badge.meetup  { border-color: #4A9ECA; color: #4A9ECA; background: rgba(74,158,202,0.1); }
.event-type-badge.tasting { border-color: #9E5EA8; color: #9E5EA8; background: rgba(158,94,168,0.1); }

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

/* ─── VIRTUAL QUEUE ──────────────────────────────────────────────────────── */
.event-queue-section {
  border-top: 1px solid var(--rule);
  padding: 12px 14px 14px;
}

.event-queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.event-queue-title {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--gold);
  text-transform: uppercase;
}

.btn-queue-toggle {
  background: none;
  border: none;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.btn-queue-toggle:hover { color: var(--parchment); }

.event-queue-radius {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.04em;
  margin-bottom: 10px;
}

.event-queue-signin {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  font-style: italic;
  margin-bottom: 8px;
}

.event-queue-countdown {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.queue-countdown-label {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ghost);
}

.queue-countdown-value {
  font-family: 'Courier Prime', monospace;
  font-size: 18px;
  font-weight: 700;
  color: var(--gold-light);
  letter-spacing: 0.04em;
}

.btn-join-line {
  width: 100%;
  background: var(--gold);
  border: none;
  border-radius: 8px;
  color: var(--ink);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 12px;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-bottom: 10px;
}
.btn-join-line:hover { opacity: 0.85; }

.my-queue-position {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(193,125,14,0.12);
  border: 1px solid rgba(193,125,14,0.4);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 10px;
}
.my-queue-position-label {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gold);
}
.my-queue-position-num {
  font-family: 'Courier Prime', monospace;
  font-size: 20px;
  font-weight: 700;
  color: var(--gold-light);
}

.btn-leave-line {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-leave-line:hover { border-color: var(--urgent); color: var(--urgent); }

.event-queue-closed {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ghost);
  text-align: center;
  padding: 8px 0;
  margin-bottom: 4px;
}

.queue-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
}

.queue-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--card);
  border: 1px solid var(--rule);
}
.queue-entry.mine {
  background: rgba(193,125,14,0.08);
  border-color: rgba(193,125,14,0.3);
}

.queue-pos {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--ghost);
  min-width: 28px;
}
.queue-entry.mine .queue-pos { color: var(--gold); }

.queue-handle {
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  color: var(--parchment);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.queue-entry.mine .queue-handle::after {
  content: ' (you)';
  color: var(--gold);
  font-size: 10px;
}

.evt-hint {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  color: var(--ghost);
  margin-top: 4px;
  letter-spacing: 0.04em;
}

/* ─── EVENT FORM SHEET ───────────────────────────────────────────────────── */
.event-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 305;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.event-form-overlay.open {
  opacity: 1;
  pointer-events: all;
}
.event-form-sheet {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  width: 100%;
  max-width: 480px;
  height: 88dvh;
  background: var(--page);
  border-radius: 16px 16px 0 0;
  border-top: 1px solid var(--rule);
  z-index: 310;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
}
.event-form-sheet.open {
  transform: translateX(-50%) translateY(0);
}
.event-form-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
}
.event-form-section {
  margin-bottom: 20px;
}
.event-form-section-title {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--rule);
}
.evt-field {
  margin-bottom: 12px;
}
.evt-label {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ghost);
  text-transform: uppercase;
  display: block;
  margin-bottom: 5px;
}
.evt-input {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  padding: 9px 12px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}
.evt-input:focus { border-color: var(--gold); }
.evt-select {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  padding: 9px 12px;
  box-sizing: border-box;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.evt-select:focus { border-color: var(--gold); }
.evt-select option { background: var(--card); color: var(--parchment); }
.evt-bottle-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.evt-bottle-row .evt-select { flex: 1; }
.btn-evt-add-bottle {
  background: rgba(193,125,14,0.12);
  border: 1px solid var(--gold);
  border-radius: 6px;
  color: var(--gold);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 9px 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}
.btn-evt-add-bottle:hover { background: rgba(193,125,14,0.22); }
.evt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.evt-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(193,125,14,0.12);
  border: 1px solid rgba(193,125,14,0.35);
  border-radius: 12px;
  padding: 3px 10px 3px 10px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--parchment);
}
.evt-chip-remove {
  background: none;
  border: none;
  color: var(--ghost);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  margin-left: 2px;
}
.evt-chip-remove:hover { color: var(--urgent); }
.event-form-footer {
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--rule);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.evt-type-row {
  display: flex;
  gap: 8px;
}
.evt-type-btn {
  flex: 1;
  background: none;
  border: 1px solid var(--rule);
  border-radius: 8px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  padding: 10px 6px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.evt-type-btn.sel-drop    { border-color: var(--gold);  color: var(--gold);  background: rgba(193,125,14,0.12); }
.evt-type-btn.sel-meetup  { border-color: #4A9ECA; color: #4A9ECA; background: rgba(74,158,202,0.12); }
.evt-type-btn.sel-tasting { border-color: #9E5EA8; color: #9E5EA8; background: rgba(158,94,168,0.12); }

.btn-evt-cancel {
  flex: 1;
  background: none;
  border: 1px solid var(--rule);
  border-radius: 8px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-evt-cancel:hover { border-color: var(--parchment); color: var(--parchment); }
.btn-evt-submit {
  flex: 2;
  background: var(--gold);
  border: 1px solid var(--gold);
  border-radius: 8px;
  color: var(--ink);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 12px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-evt-submit:hover { opacity: 0.85; }
.btn-evt-submit:disabled { opacity: 0.4; cursor: default; }
.btn-post-event {
  background: rgba(193,125,14,0.1);
  border: 1px solid var(--gold);
  border-radius: 6px;
  color: var(--gold);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-post-event:hover { background: rgba(193,125,14,0.22); }
.btn-delete-event {
  background: none;
  border: 1px solid var(--urgent);
  border-radius: 6px;
  color: var(--urgent);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-delete-event:hover { background: rgba(156,28,28,0.1); }
.btn-edit-event {
  background: none;
  border: 1px solid #C17D0E;
  border-radius: 6px;
  color: #C17D0E;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-edit-event:hover { background: rgba(193,125,14,0.12); }

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
  animation: overlayFadeIn 0.25s ease forwards;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
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

/* ─── BOURBON CATALOG FORM ───────────────────────────────────────────────── */
.bottle-select {
  width: 100%;
  background: var(--card-2);
  border: 1px solid var(--rule);
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  appearance: auto;
  margin-bottom: 8px;
}
.bottle-select:focus { outline: none; border-color: var(--gold); }
.bottle-select option { background: var(--card-2); color: var(--paper); }

.bottle-added-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.bottle-added-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--gold-glow);
  border: 1px solid var(--gold);
  border-radius: 20px;
  padding: 4px 10px 4px 12px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--gold-light);
  letter-spacing: 0.04em;
}
.bottle-added-remove {
  background: none;
  border: none;
  color: var(--ghost);
  cursor: pointer;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
}
.bottle-added-remove:hover { color: var(--paper); }

.btn-add-bottle {
  width: 100%;
  background: transparent;
  border: 1px dashed var(--worn);
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: border-color 0.2s, color 0.2s;
}
.btn-add-bottle:hover { border-color: var(--gold); color: var(--gold); }

/* ─── SEARCH BOX ─────────────────────────────────────────────────────────── */
.search-box {
  padding: 8px 16px 4px;
  background: var(--page);
}
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.search-input {
  flex: 1;
  background: var(--card-2);
  border: 1px solid var(--rule);
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  padding: 8px 12px;
  border-radius: 8px;
}
.search-input:focus { outline: none; border-color: var(--gold); }
.search-input::placeholder { color: var(--ghost); }
.search-dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--gold);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  padding: 4px 2px;
}

/* ─── MOBILE SLIDE-UP BEHAVIOURS ─────────────────────────────────────────── */
@media (max-width: 767px) {
  /*
   * Give map-section an explicit z-index so it becomes a BOUNDED stacking
   * context. Leaflet's internal panes (z-index 200–700) are contained inside
   * it and cannot paint over sibling elements that have a higher z-index.
   */
  .map-section {
    z-index: 1;
  }

  /* Post-sighting sheet fills from tab-bar bottom to screen bottom.
     Sheet z-index is already 310, well above the map (1) and tab-bar (95). */
  .sheet.open {
    height: calc(100dvh - 92px - env(safe-area-inset-top, 0px));
    max-height: calc(100dvh - 92px - env(safe-area-inset-top, 0px));
    border-radius: 0;
  }

  /* Search/filter panel slides up to cover the map (z-index 94: above map=1,
     below tab-bar=95 so the tab bar stays accessible) */
  .left-panel.search-expanded {
    position: fixed;
    top: calc(92px + env(safe-area-inset-top, 0px));
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 94;
    overflow-y: auto;
    background: var(--page);
    animation: panel-slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
}

@keyframes panel-slide-up {
  from { transform: translateY(40vh); opacity: 0.6; }
  to   { transform: translateY(0);    opacity: 1; }
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

/* ── Role badge ── */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid;
  border-radius: 12px;
  padding: 3px 10px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-top: 4px;
}

/* ── Admin panel ── */
.admin-panel {
  margin: 0 12px 12px;
  background: rgba(193,125,14,0.06);
  border: 1px solid rgba(193,125,14,0.3);
  border-radius: 10px;
  padding: 14px;
}
.admin-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.admin-panel-title {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--gold);
  text-transform: uppercase;
}
.admin-panel-count {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
}
.admin-search-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  position: relative;
}
.admin-search-input {
  flex: 1;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  padding: 8px 10px;
  outline: none;
}
.admin-search-input:focus { border-color: var(--gold); }
.btn-admin-clear {
  background: none;
  border: none;
  color: var(--ghost);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
  line-height: 1;
}
.btn-admin-clear:hover { color: var(--parchment); }
.admin-user-list {
  max-height: 400px;
  overflow-y: auto;
  border-radius: 6px;
}
.admin-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 4px;
  border-bottom: 1px solid var(--rule);
}
.admin-user-row:last-child { border-bottom: none; }
.admin-user-info { flex: 1; min-width: 0; }
.admin-user-email {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--parchment);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-user-name {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-user-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.admin-role-badge {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}
.admin-role-select {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;
}
.admin-role-select:focus { border-color: var(--gold); }
.admin-loading, .admin-empty {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  text-align: center;
  padding: 14px 0;
}

/* ── Comments ── */
.card-comment-count {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.04em;
}
.comment-row {
  position: relative;
  padding: 10px 14px;
  border-bottom: 1px solid var(--rule);
}
.comment-row:last-child { border-bottom: none; }
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.comment-handle {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.06em;
}
.comment-time {
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  color: var(--ghost);
}
.comment-body {
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  color: var(--parchment);
  line-height: 1.5;
  padding-right: 24px;
}
.comment-delete {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: var(--ghost);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  opacity: 0.5;
}
.comment-delete:hover { opacity: 1; color: var(--urgent); }
.comments-empty {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  text-align: center;
  padding: 30px 20px;
}
.comment-input-row {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg);
  border-top: 1px solid var(--rule);
}
.comment-input {
  flex: 1;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  padding: 8px 10px;
  outline: none;
}
.comment-input:focus { border-color: var(--gold); }
.comment-submit {
  background: rgba(193,125,14,0.12);
  border: 1px solid var(--gold);
  border-radius: 6px;
  color: var(--gold);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 8px 14px;
  cursor: pointer;
  white-space: nowrap;
}
.comment-submit:hover { background: rgba(193,125,14,0.22); }
.comment-submit:disabled { opacity: 0.4; cursor: default; }
.comment-sign-in-prompt {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  text-align: center;
  padding: 14px;
  border-top: 1px solid var(--rule);
}
.comment-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.comment-reply-btn {
  background: none;
  border: none;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  padding: 0;
}
.comment-reply-btn:hover { color: var(--gold); }
.comment-delete-inline {
  background: none;
  border: none;
  color: var(--ghost);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  opacity: 0.5;
  margin-left: auto;
}
.comment-delete-inline:hover { opacity: 1; color: var(--urgent); }
.reply-input-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.replies-section {
  margin-top: 6px;
  padding-left: 14px;
  border-left: 2px solid var(--rule);
}
.replies-toggle {
  background: none;
  border: none;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  padding: 4px 0;
}
.replies-toggle:hover { color: var(--parchment); }
.replies-list { margin-top: 4px; }
.reply-row {
  position: relative;
  padding: 6px 0 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.reply-row:last-child { border-bottom: none; }

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

/* ── Notification Settings ──────────────────────────────────────────────── */
.notif-settings-panel {
  margin: 0 12px 12px;
  background: rgba(74,158,202,0.06);
  border: 1px solid rgba(74,158,202,0.25);
  border-radius: 10px;
  padding: 14px;
}
.notif-settings-header {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #4A9ECA;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.notif-toggle-row { margin-bottom: 12px; }
.notif-toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.notif-toggle-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #4A9ECA;
  cursor: pointer;
}
.notif-toggle-text {
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  color: var(--parchment);
}
.notif-radius-label {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ghost);
  margin-bottom: 8px;
  text-transform: uppercase;
}
.notif-radius-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.notif-radius-btn {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.notif-radius-btn:hover { border-color: #4A9ECA; color: var(--parchment); }
.notif-radius-btn.active {
  background: rgba(74,158,202,0.15);
  border-color: #4A9ECA;
  color: #4A9ECA;
  font-weight: 700;
}
.notif-location-btn {
  background: rgba(74,158,202,0.1);
  border: 1px solid rgba(74,158,202,0.4);
  border-radius: 6px;
  color: #4A9ECA;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  padding: 7px 12px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: background 0.15s;
}
.notif-location-btn:hover { background: rgba(74,158,202,0.2); }
.notif-location-set {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  margin-bottom: 8px;
}
.notif-favorites-note {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  color: var(--ghost);
  font-style: italic;
  margin-top: 4px;
}
.notif-error {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: #E05C5C;
  margin-top: 8px;
  line-height: 1.5;
}
.notif-unsupported {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  line-height: 1.5;
}

/* ── Phone settings panel ── */
.phone-settings-panel {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}
.phone-settings-header {
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--ghost);
  margin-bottom: 12px;
}
.phone-current {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  color: var(--paper);
}
.phone-number { color: var(--paper); }
.phone-empty { color: var(--ghost); font-style: italic; font-size: 12px; }
.phone-verified-badge {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--fresh);
  border: 1px solid var(--fresh);
  border-radius: 3px;
  padding: 1px 5px;
}
.phone-unverified-badge {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--ghost);
  border: 1px solid var(--worn);
  border-radius: 3px;
  padding: 1px 5px;
}
.phone-edit-btn {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 4px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 5px 10px;
  cursor: pointer;
}
.phone-edit-btn:hover { border-color: var(--gold); color: var(--gold); }
.phone-field-row { margin-bottom: 8px; }
.phone-input {
  width: 100%;
  background: var(--card-2);
  border: 1px solid var(--rule);
  border-radius: 4px;
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  padding: 7px 10px;
}
.phone-input:focus { outline: none; border-color: var(--gold); }
.phone-code-hint {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: var(--ghost);
  margin-bottom: 10px;
  line-height: 1.5;
}
.phone-code-hint strong { color: var(--paper); }
.phone-dev-banner {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  background: rgba(193,125,14,0.12);
  border: 1px solid var(--gold);
  border-radius: 4px;
  color: var(--gold-light);
  padding: 6px 10px;
  margin-bottom: 8px;
}
.phone-btn-row { display: flex; gap: 8px; }
.phone-submit-btn {
  background: var(--gold);
  border: none;
  border-radius: 4px;
  color: var(--ink);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 6px 14px;
  cursor: pointer;
}
.phone-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.phone-submit-btn:not(:disabled):hover { background: var(--gold-light); }
.phone-cancel-btn {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 4px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 6px 10px;
  cursor: pointer;
}
.phone-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.phone-cancel-btn:hover:not(:disabled) { border-color: var(--worn); color: var(--parchment); }
.phone-error {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  color: #E05C5C;
  margin-bottom: 8px;
  line-height: 1.5;
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

.profile-signin-email-btn {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 8px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 14px 28px;
  cursor: pointer;
  margin-top: 10px;
  transition: border-color 0.15s, color 0.15s;
}
.profile-signin-email-btn:hover { border-color: var(--gold); color: var(--gold-light); }

/* ─── AUTH MODAL ──────────────────────────────────────────────────────────── */
.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  z-index: 400;
  animation: overlayFadeIn 0.2s ease forwards;
}
.auth-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.96);
  width: calc(100% - 40px);
  max-width: 380px;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 12px;
  z-index: 410;
  padding: 28px 24px 24px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
}
.auth-modal.open {
  opacity: 1;
  pointer-events: all;
  transform: translate(-50%, -50%) scale(1);
}
.auth-modal-brand {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 20px;
}
.auth-modal-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--rule);
}
.auth-modal-tab {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 0 10px;
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--ghost);
  cursor: pointer;
  text-transform: uppercase;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}
.auth-modal-tab.active {
  color: var(--gold-light);
  border-bottom-color: var(--gold);
}
.auth-field-label {
  display: block;
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ghost);
  text-transform: uppercase;
  margin-bottom: 5px;
  margin-top: 12px;
}
.auth-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--page);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.15s;
}
.auth-input:focus { border-color: var(--gold); }
.auth-error {
  background: rgba(122,46,46,0.18);
  border: 1px solid var(--urgent);
  border-radius: 5px;
  color: #e07070;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  padding: 9px 12px;
  margin-top: 12px;
  line-height: 1.5;
}
.auth-success-box {
  background: rgba(46,90,46,0.22);
  border: 1px solid #3a7a3a;
  border-radius: 5px;
  color: #70c870;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 16px 14px;
  margin-top: 8px;
  line-height: 1.7;
  text-align: center;
}
.auth-submit-btn {
  width: 100%;
  background: var(--gold);
  color: var(--ink);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: none;
  border-radius: 6px;
  padding: 13px;
  cursor: pointer;
  margin-top: 18px;
  transition: opacity 0.15s;
}
.auth-submit-btn:hover { opacity: 0.88; }
.auth-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.auth-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
}
.auth-divider::before, .auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--rule);
}
.auth-google-btn {
  width: 100%;
  background: none;
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.auth-google-btn:hover { border-color: var(--gold); color: var(--gold-light); }
.auth-forgot-link {
  display: block;
  text-align: right;
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  color: var(--ghost);
  letter-spacing: 0.06em;
  margin-top: 6px;
  cursor: pointer;
  text-decoration: underline;
  background: none;
  border: none;
  padding: 0;
}
.auth-forgot-link:hover { color: var(--gold-light); }
.auth-modal-close {
  position: absolute;
  top: 14px;
  right: 16px;
  background: none;
  border: none;
  color: var(--ghost);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 4px 6px;
}
.auth-modal-close:hover { color: var(--paper); }

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
.profile-fav-remove.active { color: var(--urgent); }
.profile-fav-remove:hover { color: var(--urgent); }

.fav-store-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 6px;
  position: relative;
}
.fav-store-search-input {
  flex: 1;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--parchment);
  font-family: 'Courier Prime', monospace;
  font-size: 12px;
  padding: 8px 10px;
  outline: none;
}
.fav-store-search-input:focus { border-color: var(--gold); }
.fav-store-search-clear {
  background: none;
  border: none;
  color: var(--ghost);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
  line-height: 1;
}
.fav-store-search-clear:hover { color: var(--parchment); }

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

/* ─── FORUM VIEW ────────────────────────────────────────────────────────────── */
.forum-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  overflow-y: auto;
}

.forum-header {
  display: flex;
  align-items: center;
  padding: 18px 16px 12px;
  border-bottom: 1px solid var(--rule);
}

.forum-header-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gold-light);
}

.forum-subheader {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--rule);
  background: var(--card);
  position: sticky;
  top: 0;
  z-index: 10;
}

.forum-back-btn {
  background: none;
  border: none;
  color: var(--gold);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px 2px 2px;
  flex-shrink: 0;
}

.forum-subheader-title {
  flex: 1;
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--paper);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forum-subheader-thread-title {
  font-size: 14px;
}

.forum-new-btn {
  background: var(--gold);
  color: var(--ink);
  border: none;
  border-radius: 6px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 5px 10px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.forum-new-btn:hover { background: var(--gold-light); }

.forum-category-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid var(--rule);
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.forum-category-card:hover { background: var(--card); }
.forum-category-card:active { background: var(--card-2); }

.forum-category-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gold-glow);
  border: 1px solid var(--worn);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.forum-category-info { flex: 1; min-width: 0; }

.forum-category-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--paper);
  letter-spacing: 0.04em;
}

.forum-category-desc {
  font-size: 11px;
  color: var(--ghost);
  margin-top: 2px;
  letter-spacing: 0.04em;
}

.forum-category-meta {
  font-size: 10px;
  color: var(--worn);
  margin-top: 3px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.forum-category-chevron {
  color: var(--worn);
  font-size: 20px;
  line-height: 1;
}

.forum-thread-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--rule);
  cursor: pointer;
  transition: background 0.15s;
}

.forum-thread-row:hover { background: var(--card); }
.forum-thread-row:active { background: var(--card-2); }

.forum-thread-row.forum-thread-pinned {
  background: rgba(193,125,14,0.06);
  border-left: 2px solid var(--gold);
}

.forum-thread-row-main { flex: 1; min-width: 0; }

.forum-thread-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--paper);
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forum-pin { font-size: 13px; }

.forum-thread-meta {
  font-size: 10px;
  color: var(--ghost);
  margin-top: 3px;
  letter-spacing: 0.05em;
}

.forum-post-card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 8px;
  margin: 10px 12px;
  padding: 12px 14px;
}

.forum-post-op {
  border-left: 3px solid var(--gold);
  background: var(--card-2);
}

.forum-post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.forum-post-handle {
  font-size: 11px;
  font-weight: 700;
  color: var(--gold-light);
  letter-spacing: 0.06em;
}

.forum-post-time {
  font-size: 10px;
  color: var(--ghost);
  letter-spacing: 0.05em;
  flex: 1;
}

.forum-delete-btn {
  background: none;
  border: none;
  color: var(--ghost);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
  flex-shrink: 0;
}

.forum-delete-btn:hover { color: var(--urgent); background: rgba(122,46,46,0.15); }

.forum-post-body {
  font-size: 13px;
  color: var(--parchment);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.forum-reactions-row {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.forum-reaction-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--card-2);
  border: 1px solid var(--rule);
  border-radius: 20px;
  padding: 3px 9px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  color: var(--paper);
}

.forum-reaction-btn:hover:not(:disabled) {
  border-color: var(--worn);
  background: var(--worn);
}

.forum-reaction-btn.mine {
  background: var(--gold-glow);
  border-color: var(--gold);
}

.forum-reaction-btn:disabled { opacity: 0.5; cursor: default; }

.forum-reaction-count {
  font-size: 11px;
  font-family: 'Courier Prime', monospace;
  color: var(--ghost);
}

.forum-reaction-btn.mine .forum-reaction-count { color: var(--gold-light); }

.forum-load-more {
  display: block;
  width: calc(100% - 24px);
  margin: 6px 12px 16px;
  padding: 10px;
  background: none;
  border: 1px solid var(--rule);
  border-radius: 8px;
  color: var(--ghost);
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-align: center;
}

.forum-load-more:hover { border-color: var(--worn); color: var(--parchment); }

.forum-empty {
  padding: 32px 20px;
  text-align: center;
  font-size: 12px;
  color: var(--ghost);
  letter-spacing: 0.08em;
}

.forum-composer-title {
  width: 100%;
}

.forum-composer-body {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--worn);
  border-radius: 8px;
  color: var(--paper);
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  padding: 10px 12px;
  resize: none;
  line-height: 1.5;
}

.forum-composer-body:focus {
  outline: none;
  border-color: var(--gold);
}

.forum-composer-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(122,46,46,0.2);
  border: 1px solid var(--urgent);
  border-radius: 6px;
  font-size: 11px;
  color: #e07070;
  letter-spacing: 0.04em;
}
`

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

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatQueueCountdown(targetMs, nowMs) {
  const diff = targetMs - nowMs
  if (diff <= 0) return null
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins  = Math.floor((diff % 3600000)  / 60000)
  const hh = String(hours).padStart(2, '0')
  const mm = String(mins).padStart(2, '0')
  return days > 0 ? `${days}d ${hh}:${mm}` : `${hh}:${mm}`
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

// ── Profanity filter ──────────────────────────────────────────────────────
const profanityFilter = new Filter()
function getProfaneWords(...fields) {
  const found = new Set()
  fields.forEach(f => {
    if (!f || !profanityFilter.isProfane(f)) return
    const original = f.split(/\s+/)
    const cleaned  = profanityFilter.clean(f).split(/\s+/)
    original.forEach((word, i) => {
      if (cleaned[i] && cleaned[i].includes('*')) {
        found.add(word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      }
    })
  })
  return [...found]
}

const BOURBON_CATALOG = [
  { brand: "Blanton's", bottles: ["Blanton's Original Single Barrel","Blanton's Gold Edition","Blanton's Straight from the Barrel","Blanton's Special Reserve"] },
  { brand: "Weller", bottles: ["Weller Special Reserve","Weller Antique 107","Weller 12 Year","Weller Full Proof","Weller Single Barrel"] },
  { brand: "Colonel E.H. Taylor", bottles: ["E.H. Taylor Small Batch","E.H. Taylor Single Barrel","E.H. Taylor Barrel Proof","E.H. Taylor Four Grain","E.H. Taylor Warehouse C","E.H. Taylor Seasoned Wood","E.H. Taylor Cured Oak","E.H. Taylor Old Fashioned Sour Mash"] },
  { brand: "Eagle Rare", bottles: ["Eagle Rare 10 Year","Eagle Rare 17 Year (BTAC)"] },
  { brand: "Pappy Van Winkle", bottles: ["Old Rip Van Winkle 10 Year","Van Winkle Special Reserve 12 Year","Pappy Van Winkle 15 Year","Pappy Van Winkle 20 Year","Pappy Van Winkle 23 Year","Van Winkle Family Reserve Rye 13 Year"] },
  { brand: "Buffalo Trace Antique Collection", bottles: ["George T. Stagg","William Larue Weller","Thomas H. Handy Sazerac Rye","Sazerac 18 Year Rye"] },
  { brand: "Stagg", bottles: ["Stagg Barrel Proof"] },
  { brand: "Four Roses", bottles: ["Four Roses Limited Edition Small Batch","Four Roses Limited Edition Small Batch Select","Four Roses Limited Edition Single Barrel","Four Roses Elliott's Select","Four Roses Al Young 50th Anniversary"] },
  { brand: "Elijah Craig", bottles: ["Elijah Craig Barrel Proof Batch A","Elijah Craig Barrel Proof Batch B","Elijah Craig Barrel Proof Batch C","Elijah Craig 18 Year","Elijah Craig 23 Year"] },
  { brand: "Old Fitzgerald", bottles: ["Old Fitzgerald BiB Spring Release","Old Fitzgerald BiB Fall Release"] },
  { brand: "Parker's Heritage", bottles: ["Parker's Heritage Collection (Annual Release)"] },
  { brand: "Wild Turkey Master's Keep", bottles: ["Master's Keep Bottled in Bond","Master's Keep Revival","Master's Keep Decades","Master's Keep Unforgiven","Master's Keep One","Master's Keep Cornerstone","Master's Keep Voyage"] },
  { brand: "Russell's Reserve", bottles: ["Russell's Reserve Single Barrel Bourbon","Russell's Reserve Single Barrel Rye"] },
  { brand: "Woodford Reserve", bottles: ["Woodford Reserve Batch Proof","Woodford Reserve Double Double Oaked","Woodford Reserve Master's Collection"] },
  { brand: "Angel's Envy", bottles: ["Angel's Envy Cask Strength","Angel's Envy Port Finish"] },
  { brand: "Michter's", bottles: ["Michter's 10 Year Bourbon","Michter's 20 Year Bourbon","Michter's 25 Year Bourbon","Michter's Toasted Barrel Finish Bourbon","Michter's Toasted Barrel Finish Rye","Michter's Celebration Sour Mash"] },
  { brand: "Booker's", bottles: ["Booker's (Annual Batch Release)"] },
  { brand: "Knob Creek", bottles: ["Knob Creek Single Barrel Reserve","Knob Creek 12 Year","Knob Creek 15 Year","Knob Creek 25th Anniversary"] },
  { brand: "Larceny", bottles: ["Larceny Barrel Proof Batch A","Larceny Barrel Proof Batch B","Larceny Barrel Proof Batch C"] },
  { brand: "1792", bottles: ["1792 Single Barrel","1792 Full Proof","1792 Sweet Wheat","1792 Aged 12 Years","1792 High Rye","1792 Port Finish","1792 Bottled in Bond"] },
  { brand: "Old Forester", bottles: ["Old Forester Birthday Bourbon","Old Forester 150th Anniversary","Old Forester President's Collection"] },
  { brand: "Barrell Craft Spirits", bottles: ["Barrell Bourbon (Batch Release)","Barrell Dovetail","Barrell Seagrass","Barrell Armida"] },
  { brand: "High West", bottles: ["High West Midwinter Night's Dram"] },
  { brand: "Orphan Barrel / Rhetoric", bottles: ["Rhetoric 20 Year","Rhetoric 21 Year","Rhetoric 22 Year","Rhetoric 23 Year","Rhetoric 24 Year"] },
  { brand: "Maker's Mark", bottles: ["Maker's Mark Cask Strength","Maker's Mark Private Select","Maker's Mark Limited Release"] },
  { brand: "New Riff", bottles: ["New Riff Single Barrel Bourbon","New Riff Single Barrel Rye","New Riff Backsetter"] },
  { brand: "Buffalo Trace", bottles: ["Buffalo Trace"] },
]

const FILTERS = ['ALL', "BLANTON'S", 'WELLER', 'PAPPY', 'E.H. TAYLOR', 'FOUR ROSES', 'EAGLE RARE', 'STAGG', 'ELIJAH CRAIG', 'LARCENY']

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

function filterMatches(sighting, filter, search) {
  const q = (search || '').toLowerCase().trim()
  if (q) {
    return sighting.bottles.some(b => b.toLowerCase().includes(q)) ||
           (sighting.store || '').toLowerCase().includes(q) ||
           (sighting.city || '').toLowerCase().includes(q)
  }
  if (filter === 'ALL') return true
  const f = filter.toLowerCase()
  return sighting.bottles.some(b => {
    const bl = b.toLowerCase()
    if (f === "blanton's") return bl.includes('blanton')
    if (f === 'weller') return bl.includes('weller')
    if (f === 'eagle rare') return bl.includes('eagle rare')
    if (f === 'e.h. taylor') return bl.includes('e.h. taylor') || bl.includes('eh taylor')
    if (f === 'four roses') return bl.includes('four roses')
    if (f === 'pappy') return bl.includes('pappy') || bl.includes('van winkle') || bl.includes('old rip')
    if (f === 'stagg') return bl.includes('stagg')
    if (f === 'elijah craig') return bl.includes('elijah craig')
    if (f === 'larceny') return bl.includes('larceny')
    return bl.includes(f)
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

// ─── MY LOTTERY ENTRIES ────────────────────────────────────────────────────
function MyLotteryEntries({ userId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !supabase) { setLoading(false); return }
    supabase
      .from('lottery_tokens')
      .select(`
        ticket_number, claimed_at,
        lottery_programs (
          bottle_name, draw_date, status, draw_winner_count, winner_user_ids,
          store_profiles ( store_name, store_number )
        )
      `)
      .eq('claimed_by_user_id', userId)
      .eq('status', 'claimed')
      .order('claimed_at', { ascending: false })
      .then(({ data }) => {
        setEntries(data || [])
        setLoading(false)
      })
  }, [userId])

  if (loading) return null
  if (entries.length === 0) return (
    <div className="profile-empty" style={{ marginTop: 8 }}>
      No lottery entries yet — scan a QR code at participating stores
    </div>
  )

  function formatDrawDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      {entries.map((entry, i) => {
        const prog = entry.lottery_programs
        if (!prog) return null
        const isDrawn = prog.status === 'drawn'
        const isWinner = isDrawn && Array.isArray(prog.winner_user_ids) && prog.winner_user_ids.includes(userId)
        return (
          <div key={i} className="profile-fav-store-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'var(--paper)', fontWeight: 600 }}>
                {prog.bottle_name}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                {isWinner && (
                  <span style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '2px 8px', borderRadius: 2 }}>
                    Won
                  </span>
                )}
                {isDrawn && !isWinner && (
                  <span style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ghost)', border: '1px solid var(--worn)', padding: '2px 8px', borderRadius: 2 }}>
                    Drawn
                  </span>
                )}
                {!isDrawn && (
                  <span style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-light)', border: '1px solid var(--worn)', padding: '2px 8px', borderRadius: 2 }}>
                    Upcoming
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ghost)' }}>
              {prog.store_profiles?.store_name}{prog.store_profiles?.store_number ? ` · #${prog.store_profiles.store_number}` : ''}
            </div>
            <div style={{ fontSize: 10, color: 'var(--worn)', letterSpacing: '0.5px' }}>
              Ticket #{entry.ticket_number} · Draw {formatDrawDate(prog.draw_date)}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('scout')
  const [sightingsExpanded, setSightingsExpanded] = useState(false)
  const [rsvpd, setRsvpd] = useState(new Set())

  // ── Supabase data (null = not loaded yet / not configured) ─────────────
  const [stores, setStores] = useState([])
  const [dbSightings, setDbSightings] = useState(null)
  const [dbEvents, setDbEvents] = useState(null)
  const [dbReady, setDbReady] = useState(false)
  const [appLoading, setAppLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [bottleSearch, setBottleSearch] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [pendingBrand, setPendingBrand] = useState('')
  const [pendingBottle, setPendingBottle] = useState('')
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
  const [userRole, setUserRole] = useState('scout')

  // ── Home county profile ────────────────────────────────────────────────
  const { profile: countyProfile, homeCoords, hasHomeCounty, isOnboardingNeeded, updateHomeCounty } = useProfile(session?.user?.id)
  const [adminSearch, setAdminSearch] = useState('')
  const [adminSearchResults, setAdminSearchResults] = useState([])
  const [allUsers, setAllUsers] = useState(null)         // null = not loaded yet
  const [allUsersLoading, setAllUsersLoading] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const [favStoreSearch, setFavStoreSearch] = useState('')
  const [userSightings, setUserSightings] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null) // sighting id pending delete
  // Comments
  const [commentSighting, setCommentSighting] = useState(null)  // sighting being viewed
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)       // { id, handle } of comment being replied to
  const [expandedReplies, setExpandedReplies] = useState(new Set())
  // Push notifications
  const [notifPrefs, setNotifPrefs] = useState({ enabled: false, radius_miles: 25, lat: null, lng: null })
  const [notifLoading, setNotifLoading] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [notifError, setNotifError] = useState('')
  // Scout handle
  const [handleInput, setHandleInput] = useState('')
  const [handleSaving, setHandleSaving] = useState(false)
  const [handleError, setHandleError] = useState(null)
  const [handleSaved, setHandleSaved] = useState(false)
  // Phone registration
  const [userPhone, setUserPhone] = useState(null)
  const [phoneStep, setPhoneStep] = useState('idle')   // 'idle' | 'editing' | 'awaiting_code'
  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [phoneDevCode, setPhoneDevCode] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [phoneLoading, setPhoneLoading] = useState(false)
  // Home county picker (profile settings)
  const [countyPickerOpen, setCountyPickerOpen] = useState(false)
  // Event type filter
  const [evtTypeFilter, setEvtTypeFilter] = useState('all')
  // Event creation form
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [evtType, setEvtType] = useState('drop')
  const [evtName, setEvtName] = useState('')
  const [evtStoreName, setEvtStoreName] = useState('')
  const [evtStoreSearch, setEvtStoreSearch] = useState('')
  const [evtSelectedStore, setEvtSelectedStore] = useState(null)
  const [evtShowStorePicker, setEvtShowStorePicker] = useState(false)
  const [evtStoreLat, setEvtStoreLat] = useState(null)
  const [evtStoreLng, setEvtStoreLng] = useState(null)
  const [evtCity, setEvtCity] = useState('')
  const [evtDate, setEvtDate] = useState('')
  const [evtBottles, setEvtBottles] = useState([])
  const [evtPendingBrand, setEvtPendingBrand] = useState('')
  const [evtPendingBottle, setEvtPendingBottle] = useState('')
  const [evtOtherBottle, setEvtOtherBottle] = useState('')
  const [evtParking, setEvtParking] = useState('')
  const [evtOvernight, setEvtOvernight] = useState('')
  const [evtIdReq, setEvtIdReq] = useState('')
  const [evtLimit, setEvtLimit] = useState('')
  const [evtRulesNotes, setEvtRulesNotes] = useState('')
  const [evtQueueOpenAt, setEvtQueueOpenAt] = useState('')
  const [evtQueueRadius, setEvtQueueRadius] = useState('')
  const [deleteEventConfirm, setDeleteEventConfirm] = useState(null) // event id pending delete
  const [editingEventId, setEditingEventId] = useState(null) // non-null = editing mode
  // Queue state
  const [eventQueues, setEventQueues] = useState({})   // eventId → entry[]
  const [openQueues, setOpenQueues] = useState(new Set()) // expanded queue list by eventId
  const [queueNow, setQueueNow] = useState(() => new Date())
  // Store picker
  const [storeSearch, setStoreSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)
  const [showStorePicker, setShowStorePicker] = useState(false)

  // Email auth modal
  const [showAuthModal, setShowAuthModal]     = useState(false)
  const [authMode, setAuthMode]               = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [authEmail, setAuthEmail]             = useState('')
  const [authPassword, setAuthPassword]       = useState('')
  const [authDisplayName, setAuthDisplayName] = useState('')
  const [authLoading, setAuthLoading]         = useState(false)
  const [authError, setAuthError]             = useState(null)
  const [authSuccess, setAuthSuccess]         = useState(null)

  // Forum
  const [forumView, setForumView]                   = useState('categories')
  const [forumCategories, setForumCategories]       = useState([])
  const [forumActiveCategory, setForumActiveCategory] = useState(null)
  const [forumThreads, setForumThreads]             = useState([])
  const [forumThreadsLoading, setForumThreadsLoading] = useState(false)
  const [forumActiveThread, setForumActiveThread]   = useState(null)
  const [forumPosts, setForumPosts]                 = useState([])
  const [forumPostsLoading, setForumPostsLoading]   = useState(false)
  const [forumPage, setForumPage]                   = useState(0)
  const [forumHasMore, setForumHasMore]             = useState(false)
  const [forumReactions, setForumReactions]         = useState([])
  const [forumComposerOpen, setForumComposerOpen]   = useState(false)
  const [forumComposerMode, setForumComposerMode]   = useState('thread')
  const [forumDraftTitle, setForumDraftTitle]       = useState('')
  const [forumDraftBody, setForumDraftBody]         = useState('')
  const [forumSubmitting, setForumSubmitting]       = useState(false)
  const [forumError, setForumError]                 = useState('')

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const storeMarkersRef = useRef([])
  const leafletLoadedRef = useRef(false)
  const homeCoordsRef = useRef({ lat: 35.7796, lng: -78.6382 })
  const toastTimerRef = useRef(null)
  const realtimeChannelRef = useRef(null)
  const forumChannelRef = useRef(null)
  const sheetRef = useRef(null)
  const sheetBodyRef = useRef(null)
  const dragStartY = useRef(null)
  const dragStartH = useRef(null)

  // ── Supabase bootstrap ─────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      // No Supabase configured — skip loading, show empty state
      setDbSightings([])
      setAppLoading(false)
      return
    }

    // Load stores, sightings, and events in parallel
    Promise.all([fetchStores(), fetchSightings(), fetchEvents()]).then(
      ([storeData, sightingData, eventData]) => {
        if (storeData.length) setStores(storeData)
        setDbSightings(sightingData || [])
        if (eventData) setDbEvents(eventData)
        setDbReady(true)
        setAppLoading(false)
      }
    ).catch(err => {
      console.error('DramScout: initial data load failed:', err)
      setDbSightings([])
      setAppLoading(false)
    })

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
    async function initSession(sess) {
      setSession(sess)
      if (!sess?.user) { setUserRole('scout'); return }
      // Persist profile row so admin can look up users by email
      upsertProfile(sess.user.id, sess.user.email, sess.user.user_metadata?.full_name || null)
      // Seed admin role on first login for the designated admin email
      if (sess.user.email === ADMIN_EMAIL) {
        upsertUserRole(sess.user.id, 'admin') // fire-and-forget — role is known from email check
        setUserRole('admin')
        return
      }
      const role = await fetchUserRole(sess.user.id)
      setUserRole(role || 'scout')
    }
    getSession().then(initSession)
    return onAuthStateChange((_event, sess) => initSession(sess))
  }, [])

  // ── Load notification prefs when session is ready ────────────────────
  useEffect(() => {
    // Opera strips Google services so FCM push subscriptions fail — exclude it
    const ua = navigator.userAgent
    const isOpera = /OPR\/|Opera\//.test(ua)
    setPushSupported(!isOpera && 'serviceWorker' in navigator && 'PushManager' in window)
    if (!session?.user) return
    fetchNotificationPrefs(session.user.id).then(p => { if (p) setNotifPrefs(p) }).catch(() => {})
    fetchUserPhone(session.user.id).then(p => { if (p) setUserPhone(p) }).catch(() => {})
    fetchUserHandle(session.user.id).then(h => { if (h) setReporterHandle(h) }).catch(() => {})
  }, [session])

  // ── Load all users when admin session is ready ────────────────────────
  useEffect(() => {
    const isAdminNow = session?.user?.email === ADMIN_EMAIL || userRole === 'admin'
    if (!isAdminNow || allUsers !== null) return
    setAllUsersLoading(true)
    fetchAllProfilesWithRoles().then(data => {
      setAllUsers(data)
      setAllUsersLoading(false)
    })
  }, [session, userRole])

  // ── Keep handleInput in sync with reporterHandle ─────────────────────────
  useEffect(() => { setHandleInput(reporterHandle) }, [reporterHandle])

  // ── Pre-fill reporter handle from Google profile ─────────────────────────
  useEffect(() => {
    if (session?.user?.user_metadata?.full_name && !reporterHandle) {
      const name = session.user.user_metadata.full_name
        .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 30)
      setReporterHandle(name)
      // Do NOT write to DB here — fetchUserHandle (fired in same render cycle) is
      // async and may not have resolved yet, so reporterHandle appears empty and
      // this would overwrite any handle the user explicitly saved. DB writes happen
      // only when the user clicks SAVE HANDLE.
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

  // ── Keep homeCoordsRef in sync for use inside initMap (runs once, [] deps) ──
  useEffect(() => {
    homeCoordsRef.current = homeCoords
  }, [homeCoords])

  // ── Pan map to home county when homeCoords loads (async after map init) ──
  useEffect(() => {
    if (!mapInstanceRef.current || !hasHomeCounty) return
    mapInstanceRef.current.setView([homeCoords.lat, homeCoords.lng], 11)
  }, [homeCoords.lat, homeCoords.lng, hasHomeCounty])

  // ── Re-validate map when scout tab becomes visible ────────────────────
  useEffect(() => {
    if (activeTab === 'scout' && mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize()
      mapInstanceRef.current.dragging.enable()
    }
  }, [activeTab])

  // ── Load forum categories once on mount ───────────────────────────────
  useEffect(() => {
    fetchForumCategories().then(setForumCategories)
  }, [])

  // ── Unsubscribe from forum realtime when leaving forum tab ────────────
  useEffect(() => {
    if (activeTab !== 'forum') {
      forumChannelRef.current?.unsubscribe()
      forumChannelRef.current = null
    }
  }, [activeTab])

  // ── Draw store dots when stores + map are both ready ───────────────────
  useEffect(() => {
    if (stores.length && mapInstanceRef.current && leafletLoadedRef.current) {
      drawStoreDots(stores, mapInstanceRef.current)
    }
  }, [stores, leafletLoadedRef.current])

  // ── Inject styles (splash hidden separately once data is ready) ───────
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = STYLES
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  // ── Hide HTML loading splash once app data is ready ────────────────────
  useEffect(() => {
    if (!appLoading) {
      const splash = document.getElementById('app-loading')
      if (splash) {
        splash.style.transition = 'opacity 0.3s ease'
        splash.style.opacity = '0'
        setTimeout(() => { splash.style.display = 'none' }, 320)
      }
    }
  }, [appLoading])

  // ── Load Leaflet ───────────────────────────────────────────────────────
  useEffect(() => {
    function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return
      const L = window.L
      const { lat: initLat, lng: initLng } = homeCoordsRef.current
      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: true,
        tap: false,          // disable Leaflet's custom tap handler — it can swallow desktop pointer events
        touchZoom: true,
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
      // markers drawn by the sightings effect once DB data arrives

      // After init, attempt GPS — overrides county center when granted
      navigator.geolocation?.getCurrentPosition(
        (pos) => { map.setView([pos.coords.latitude, pos.coords.longitude], 13) },
        () => {},
        { timeout: 5000 }
      )

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

    // Leaflet CSS is already in index.html; just inject the JS
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
      return filterMatches(s, filter, bottleSearch)
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
      const list = (dbSightings || []).map(s => ({
        ...s,
        store: s.store || s.store_name,
        createdAt: s.createdAt ?? new Date(s.created_at ?? Date.now()).getTime(),
        confirmations: s.confirmations ?? s.confirmation_count ?? 0,
        dist: s.dist || '?',
      }))
      drawMarkers(list, activeFilter, mapInstanceRef.current, confirmed)
    }
  }, [activeFilter, dbSightings, confirmed, drawMarkers])

  // ── Tick queueNow every second while on the events tab ────────────────
  useEffect(() => {
    if (activeTab !== 'events') return
    const id = setInterval(() => setQueueNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [activeTab])

  // ── Load queues for all drop events when the events tab opens ──────────
  useEffect(() => {
    if (activeTab !== 'events') return
    const drops = (dbEvents || []).filter(e => (e.event_type || 'drop') === 'drop')
    drops.forEach(e => {
      fetchEventQueue(e.id).then(entries => {
        setEventQueues(prev => ({ ...prev, [e.id]: entries }))
      })
    })
  }, [activeTab, dbEvents])

  // ── Merge DB or mock sightings into a normalised shape ─────────────────
  const now = Date.now()

  // Normalise a DB row to the same shape as mock sightings
  function normaliseRow(s) {
    const createdAt = s.createdAt ?? new Date(s.created_at).getTime()
    const distVal = (s.lat && s.lng && hasHomeCounty)
      ? Math.round(distanceMiles(homeCoords.lat, homeCoords.lng, s.lat, s.lng))
      : (s.dist || '?')
    return {
      ...s,
      store: s.store || s.store_name,
      storeId: s.storeId ?? s.store_id ?? null,
      createdAt,
      hoursAgo: (now - createdAt) / (1000 * 60 * 60),
      confirmations: s.confirmations ?? s.confirmation_count ?? 0,
      dist: distVal,
    }
  }

  const allSightings = (dbSightings || []).map(normaliseRow)

  const filteredSightings = allSightings
    .filter(s => s.hoursAgo <= 336 && filterMatches(s, activeFilter, bottleSearch))
    .sort((a, b) => {
      if (!hasHomeCounty) return 0 // preserve recency order when no county set
      const da = typeof a.dist === 'number' ? a.dist : Infinity
      const db = typeof b.dist === 'number' ? b.dist : Infinity
      return da - db
    })

  const activeEvents = (dbEvents || []).map(e => ({
    ...e,
    date: new Date(e.event_date),
    bottles: e.bottles || [],
    rules: e.rules || {},
    attendees: e.attendee_count || 0,
    type: e.event_type || 'drop',
    queueOpenAt: e.queue_open_at ? new Date(e.queue_open_at) : null,
    queueRadiusMiles: e.queue_radius_miles || null,
    storeLat: e.store_lat || null,
    storeLng: e.store_lng || null,
  }))

  const filteredActiveEvents = evtTypeFilter === 'all'
    ? activeEvents
    : activeEvents.filter(e => e.type === evtTypeFilter)

  // ── Role-based permissions ─────────────────────────────────────────────
  const effectiveRole  = session?.user?.email === ADMIN_EMAIL ? 'admin' : userRole
  const isAdmin        = effectiveRole === 'admin'
  const canPostEvent   = ['admin', 'store', 'collector'].includes(effectiveRole)
  const canCreateDrop  = ['admin', 'store'].includes(effectiveRole)
  const canDeleteAny   = isAdmin

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

  // ── Email auth modal ───────────────────────────────────────────────────
  function openAuthModal(mode = 'signin') {
    setAuthMode(mode)
    setAuthEmail('')
    setAuthPassword('')
    setAuthDisplayName('')
    setAuthError(null)
    setAuthSuccess(null)
    setShowAuthModal(true)
  }

  async function handleEmailAuth(e) {
    e?.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    setAuthSuccess(null)
    if (authMode === 'signup') {
      const { error } = await signUpWithEmail(authEmail, authPassword, authDisplayName)
      if (error) { setAuthError(error.message) }
      else { setAuthSuccess('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT') }
    } else if (authMode === 'signin') {
      const { error } = await signInWithEmail(authEmail, authPassword)
      if (error) { setAuthError(error.message) }
      else { setShowAuthModal(false) }
    } else if (authMode === 'forgot') {
      const { error } = await resetPassword(authEmail)
      if (error) { setAuthError(error.message) }
      else { setAuthSuccess('PASSWORD RESET EMAIL SENT') }
    }
    setAuthLoading(false)
  }

  // ── Confirm sighting ───────────────────────────────────────────────────
  async function handleDeleteSighting(id) {
    if (!session?.user?.id) return
    setDeleteConfirm(null)
    const result = canDeleteAny
      ? await deleteSightingAdmin(id)
      : await deleteSighting(id, session.user.id)
    if (result.ok) {
      setUserSightings(prev => prev.filter(s => s.id !== id))
      setDbSightings(prev => prev ? prev.filter(s => s.id !== id) : prev)
    } else {
      alert(`Could not delete sighting: ${result.error}`)
    }
  }

  // ── Push Notifications ─────────────────────────────────────────────────
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
  }

  async function subscribeToPush() {
    if (!pushSupported || !session?.user) return null
    const vapidKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim()
    if (!vapidKey) {
      throw new Error('Push notifications are not configured yet. VITE_VAPID_PUBLIC_KEY must be set in your environment variables and the app redeployed.')
    }
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission is blocked in your browser. Open your browser site settings and allow notifications for this site, then try again.')
    }

    // Explicitly request permission first so Chrome properly establishes
    // its link to the OS notification channel before contacting FCM
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted. Please allow notifications when prompted.')
    }

    console.log('[Push] Registering service worker…')
    await navigator.serviceWorker.register('/sw.js')
    console.log('[Push] Waiting for service worker to become active…')
    const reg = await navigator.serviceWorker.ready
    console.log('[Push] SW active. Scope:', reg.scope, 'Active:', reg.active?.state)

    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      console.log('[Push] Unsubscribing existing subscription…')
      await existing.unsubscribe()
    }

    console.log('[Push] Subscribing with VAPID key (length:', vapidKey.length, ')…')
    // Pass the VAPID key as a DOMString (base64url). Chrome 65+ accepts this
    // directly; avoids any potential issue with the Uint8Array conversion path.
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    })
    console.log('[Push] Subscribed! Endpoint:', sub.endpoint.slice(0, 60), '…')

    await savePushSubscription(session.user.id, {
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
      auth:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
    })
    return sub
  }

  async function unsubscribeFromPush() {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await deletePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
    } catch (err) {
      console.warn('unsubscribeFromPush:', err)
    }
  }

  // ── Scout handle save ────────────────────────────────────────────────────
  async function handleSaveHandle() {
    const trimmed = handleInput.trim()
    if (!trimmed) { setHandleError('Handle cannot be empty.'); return }
    setHandleSaving(true)
    setHandleError(null)
    try {
      await updateUserHandle(session.user.id, trimmed)
      setReporterHandle(trimmed)
      setHandleSaved(true)
      setTimeout(() => setHandleSaved(false), 2000)
    } catch (e) {
      setHandleError('Failed to save. Please try again.')
    } finally {
      setHandleSaving(false)
    }
  }

  // ── Phone registration handlers ───────────────────────────────────────────
  async function handleRequestPhoneVerification() {
    if (!session) return
    setPhoneLoading(true)
    setPhoneError(null)
    setPhoneDevCode(null)
    try {
      const jwt = (await getSession())?.access_token
      const res = await fetch('/api/phone/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ phone: phoneInput }),
      })
      const data = await res.json()
      if (!res.ok) { setPhoneError(data.error || 'Failed to send code'); return }
      if (data.dev_code) setPhoneDevCode(data.dev_code)
      setPhoneStep('awaiting_code')
      setCodeInput('')
    } catch (err) {
      setPhoneError('Network error — please try again')
    } finally {
      setPhoneLoading(false)
    }
  }

  async function handleConfirmPhoneVerification() {
    if (!session) return
    setPhoneLoading(true)
    setPhoneError(null)
    try {
      const jwt = (await getSession())?.access_token
      const res = await fetch('/api/phone/confirm-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ code: codeInput }),
      })
      const data = await res.json()
      if (!res.ok) { setPhoneError(data.error || 'Invalid code'); return }
      setUserPhone({ phone: data.phone, phone_verified: true })
      setPhoneStep('idle')
      setPhoneInput('')
      setCodeInput('')
      setPhoneDevCode(null)
    } catch (err) {
      setPhoneError('Network error — please try again')
    } finally {
      setPhoneLoading(false)
    }
  }

  async function handleToggleNotifications(enabled) {
    if (!session?.user) return
    setNotifLoading(true)
    setNotifError('')
    if (enabled) {
      try {
        const sub = await subscribeToPush()
        if (!sub) { setNotifLoading(false); return }
      } catch (err) {
        console.error('subscribeToPush failed:', err)
        const isPushServiceError = err.message?.toLowerCase().includes('push service')
        const msg = isPushServiceError
          ? 'Push service error: Chrome could not register with Google\'s push service. On Windows, check Settings → System → Notifications and make sure Chrome is allowed to show notifications. Then try again.'
          : (err.message || 'Could not enable notifications. Check the browser console for details.')
        setNotifError(msg)
        setNotifLoading(false)
        return
      }
    } else {
      await unsubscribeFromPush()
    }
    const updated = { ...notifPrefs, enabled }
    setNotifPrefs(updated)
    await upsertNotificationPrefs(session.user.id, updated)
    setNotifLoading(false)
  }

  async function handleNotifRadiusChange(radius_miles) {
    if (!session?.user) return
    const updated = { ...notifPrefs, radius_miles }
    setNotifPrefs(updated)
    await upsertNotificationPrefs(session.user.id, updated)
  }

  async function handleSetNotifLocation() {
    if (!session?.user) return
    navigator.geolocation.getCurrentPosition(async pos => {
      const updated = { ...notifPrefs, lat: pos.coords.latitude, lng: pos.coords.longitude }
      setNotifPrefs(updated)
      await upsertNotificationPrefs(session.user.id, updated)
    }, () => {
      alert('Location access denied. Please allow location access and try again.')
    })
  }

  // ── Comments ───────────────────────────────────────────────────────────
  function handleOpenComments(sighting) {
    setCommentSighting(sighting)
    setComments([])
    setCommentText('')
    setReplyingTo(null)
    setExpandedReplies(new Set())
    setCommentsLoading(true)
    fetchComments(sighting.id).then(data => {
      setComments(data)
      // Auto-expand threads with fewer than 3 replies
      const replyCounts = {}
      data.forEach(c => { if (c.parent_id) replyCounts[c.parent_id] = (replyCounts[c.parent_id] || 0) + 1 })
      const autoExpand = new Set(Object.entries(replyCounts).filter(([, n]) => n < 3).map(([id]) => id))
      setExpandedReplies(autoExpand)
      setCommentsLoading(false)
    })
  }

  function handleCloseComments() {
    setCommentSighting(null)
    setComments([])
    setCommentText('')
    setReplyingTo(null)
    setExpandedReplies(new Set())
  }

  async function handlePostComment() {
    if (!session?.user?.id || !commentText.trim() || !commentSighting) return
    const badWords = getProfaneWords(commentText)
    if (badWords.length > 0) {
      alert(`Your comment contains language that isn't allowed. Please remove or replace: ${badWords.join(', ')}`)
      return
    }
    const handle = reporterHandle.trim() || session.user.user_metadata?.full_name || ('scout_' + getFingerprint().slice(-4))
    const parentId = replyingTo?.id || null
    setCommentSubmitting(true)
    const saved = await postComment(commentSighting.id, session.user.id, handle, commentText.trim(), parentId)
    if (saved) {
      setComments(prev => [...prev, saved])
      setCommentText('')
      setReplyingTo(null)
      // If this reply tips the thread to >= 3, keep it expanded since user just posted
      if (parentId) {
        setExpandedReplies(prev => new Set([...prev, parentId]))
      }
      // Update comment count in feed
      setDbSightings(prev => (prev || []).map(s =>
        s.id === commentSighting.id ? { ...s, comment_count: (s.comment_count || 0) + 1 } : s
      ))
      setCommentSighting(prev => ({ ...prev, comment_count: (prev.comment_count || 0) + 1 }))
    } else {
      alert('Could not post comment. Please try again.')
    }
    setCommentSubmitting(false)
  }

  async function handleDeleteComment(commentId, commentUserId) {
    const result = canDeleteAny
      ? await deleteCommentAdmin(commentId)
      : await deleteComment(commentId, commentUserId)
    if (result.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId))
      setDbSightings(prev => (prev || []).map(s =>
        s.id === commentSighting?.id ? { ...s, comment_count: Math.max(0, (s.comment_count || 1) - 1) } : s
      ))
      setCommentSighting(prev => prev ? { ...prev, comment_count: Math.max(0, (prev.comment_count || 1) - 1) } : prev)
    } else {
      alert('Could not delete comment.')
    }
  }

  // ── Forum helpers ─────────────────────────────────────────────────────
  function forumRelTime(ts) {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  function forumReactionCounts(postId) {
    const counts = {}
    forumReactions.filter(r => r.post_id === postId).forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
    })
    return counts
  }

  function forumHasReacted(postId, emoji) {
    return forumReactions.some(r => r.post_id === postId && r.user_id === session?.user?.id && r.emoji === emoji)
  }

  // ── Forum handlers ────────────────────────────────────────────────────
  async function handleEnterCategory(cat) {
    setForumActiveCategory(cat)
    setForumView('threads')
    setForumThreadsLoading(true)
    setForumThreads(await fetchForumThreads(cat.id))
    setForumThreadsLoading(false)
  }

  async function handleEnterThread(thread) {
    setForumActiveThread(thread)
    setForumView('thread')
    setForumPostsLoading(true)
    setForumPage(0)
    const PAGE_SIZE = 20
    const posts = await fetchForumPosts(thread.id, 0, PAGE_SIZE)
    setForumPosts(posts)
    setForumHasMore(posts.length === PAGE_SIZE)
    if (posts.length) {
      const reactions = await fetchForumReactions(posts.map(p => p.id))
      setForumReactions(reactions)
    }
    setForumPostsLoading(false)
    forumChannelRef.current?.unsubscribe()
    forumChannelRef.current = subscribeToForumPosts(thread.id, newPost => {
      setForumPosts(prev => [...prev, newPost])
      fetchForumReactions([newPost.id]).then(r => setForumReactions(prev => [...prev, ...r]))
    })
  }

  function handleForumBack() {
    if (forumView === 'thread') {
      forumChannelRef.current?.unsubscribe()
      forumChannelRef.current = null
      setForumView('threads')
      setForumPosts([])
      setForumReactions([])
      setForumActiveThread(null)
    } else {
      setForumView('categories')
      setForumThreads([])
      setForumActiveCategory(null)
    }
  }

  async function handleLoadMorePosts() {
    const PAGE_SIZE = 20
    const nextPage = forumPage + 1
    const more = await fetchForumPosts(forumActiveThread.id, nextPage, PAGE_SIZE)
    setForumPosts(prev => [...prev, ...more])
    setForumHasMore(more.length === PAGE_SIZE)
    setForumPage(nextPage)
    if (more.length) {
      const r = await fetchForumReactions(more.map(p => p.id))
      setForumReactions(prev => [...prev, ...r])
    }
  }

  function handleOpenForumComposer(mode) {
    setForumComposerMode(mode)
    setForumDraftTitle('')
    setForumDraftBody('')
    setForumError('')
    setForumComposerOpen(true)
  }

  function handleCloseForumComposer() {
    setForumComposerOpen(false)
  }

  async function handleSubmitForum() {
    const title = forumDraftTitle.trim()
    const body  = forumDraftBody.trim()
    if (forumComposerMode === 'thread' && !title) { setForumError('Thread title is required.'); return }
    if (!body) { setForumError('Post body is required.'); return }
    const badWords = getProfaneWords(title, body)
    if (badWords.length) { setForumError(`Please remove: ${badWords.join(', ')}`); return }
    setForumSubmitting(true)
    setForumError('')
    const handle = reporterHandle || session.user.email.split('@')[0]
    if (forumComposerMode === 'thread') {
      const thread = await postForumThread(forumActiveCategory.id, session.user.id, handle, title, body)
      if (thread) {
        setForumThreads(prev => [thread, ...prev])
        handleCloseForumComposer()
      } else {
        setForumError('Could not post thread. Please try again.')
      }
    } else {
      const post = await postForumPost(forumActiveThread.id, session.user.id, handle, body)
      if (post) {
        setForumPosts(prev => [...prev, post])
        setForumActiveThread(prev => ({ ...prev, post_count: (prev.post_count || 0) + 1 }))
        handleCloseForumComposer()
      } else {
        setForumError('Could not post reply. Please try again.')
      }
    }
    setForumSubmitting(false)
  }

  async function handleDeleteForumPost(postId, postUserId) {
    const ok = isAdmin
      ? await deleteForumPostAdmin(postId)
      : await deleteForumPost(postId, postUserId)
    if (ok) setForumPosts(prev => prev.filter(p => p.id !== postId))
  }

  async function handleDeleteForumThread(threadId, threadUserId) {
    const ok = isAdmin
      ? await deleteForumThreadAdmin(threadId)
      : await deleteForumThread(threadId, threadUserId)
    if (ok) setForumThreads(prev => prev.filter(t => t.id !== threadId))
  }

  async function handleToggleReaction(postId, emoji) {
    if (!session?.user) return
    const already = forumReactions.some(r => r.post_id === postId && r.user_id === session.user.id && r.emoji === emoji)
    if (already) {
      setForumReactions(prev => prev.filter(r => !(r.post_id === postId && r.user_id === session.user.id && r.emoji === emoji)))
    } else {
      setForumReactions(prev => [...prev, { post_id: postId, user_id: session.user.id, emoji }])
    }
    await toggleForumReaction(postId, session.user.id, emoji)
  }

  // ── Event bottle helper ────────────────────────────────────────────────
  function handleAddEvtBottle() {
    let name = ''
    if (evtPendingBrand === '__other__') name = evtOtherBottle.trim()
    else if (evtPendingBottle === '__other__') name = evtOtherBottle.trim()
    else name = evtPendingBottle
    if (!name || !evtPendingBrand) return
    if (evtBottles.includes(name)) return
    setEvtBottles(prev => [...prev, name])
    setEvtPendingBrand('')
    setEvtPendingBottle('')
    setEvtOtherBottle('')
  }

  // ── Post a new event ───────────────────────────────────────────────────
  async function handlePostEvent() {
    let bottleList = [...evtBottles]
    if (bottleList.length === 0 && evtPendingBottle && evtPendingBottle !== '__other__') {
      bottleList = [evtPendingBottle]
    } else if (bottleList.length === 0 && evtOtherBottle.trim()) {
      bottleList = [evtOtherBottle.trim()]
    }
    if (!evtName.trim() || !evtStoreName.trim() || !evtCity.trim() || !evtDate) return

    const badEvtWords = getProfaneWords(evtName, evtRulesNotes, evtParking, evtOvernight, evtIdReq, evtLimit, evtOtherBottle)
    if (badEvtWords.length > 0) {
      alert(`Your event contains language that isn't allowed. Please remove or replace the following word${badEvtWords.length > 1 ? 's' : ''}:\n\n${badEvtWords.join(', ')}`)
      return
    }

    const payload = {
      name: evtName.trim(),
      store: evtStoreName.trim(),
      city: evtCity.trim(),
      state: 'NC',
      event_date: new Date(evtDate).toISOString(),
      event_type: evtType,
      bottles: bottleList,
      rules: {
        parking: evtParking.trim() || 'Not specified',
        overnight: evtOvernight.trim() || 'Not specified',
        id: evtIdReq.trim() || 'Valid ID required',
        limit: evtLimit.trim() || 'Not specified',
        notes: evtRulesNotes.trim() || '',
      },
      user_id: session?.user?.id || null,
      attendee_count: 0,
      queue_open_at: evtQueueOpenAt ? new Date(evtQueueOpenAt).toISOString() : null,
      queue_radius_miles: evtQueueRadius ? parseFloat(evtQueueRadius) : null,
      store_lat: evtStoreLat,
      store_lng: evtStoreLng,
    }

    // Optimistic add
    const tempId = `local-evt-${Date.now()}`
    const optimistic = { ...payload, id: tempId, event_date: payload.event_date }
    setDbEvents(prev => [...(prev || []), optimistic])

    // Close & reset form
    setEventFormOpen(false)
    setEvtType('drop')
    setEvtName(''); setEvtStoreName(''); setEvtCity(''); setEvtDate('')
    setEvtBottles([]); setEvtPendingBrand(''); setEvtPendingBottle(''); setEvtOtherBottle('')
    setEvtParking(''); setEvtOvernight(''); setEvtIdReq(''); setEvtLimit(''); setEvtRulesNotes('')
    setEvtQueueOpenAt(''); setEvtQueueRadius('')
    setEvtStoreSearch(''); setEvtSelectedStore(null); setEvtStoreLat(null); setEvtStoreLng(null)

    if (supabase) {
      const saved = await postEvent(payload)
      if (saved) {
        // Replace temp with real DB row
        setDbEvents(prev => (prev || []).map(e => e.id === tempId ? saved : e))
      } else {
        setDbEvents(prev => (prev || []).filter(e => e.id !== tempId))
        alert('Could not save event. Please try again.')
      }
    }
  }

  // ── Delete an event ────────────────────────────────────────────────────
  async function handleDeleteEvent(id) {
    if (!session?.user?.id) return
    setDeleteEventConfirm(null)
    if (supabase) {
      const result = canDeleteAny
        ? await deleteEventAdmin(id)
        : await deleteEvent(id, session.user.id)
      if (!result.ok) { alert(`Could not delete event: ${result.error}`); return }
    }
    setDbEvents(prev => (prev || []).filter(e => e.id !== id))
  }

  // ── Open edit form pre-filled with existing event data ────────────────
  function handleOpenEditEvent(event) {
    setEditingEventId(event.id)
    setEvtType(event.event_type || 'drop')
    setEvtName(event.name || '')
    setEvtStoreName(event.store || '')
    setEvtStoreSearch(event.store || '')
    setEvtCity(event.city || '')
    // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:MM)
    const d = event.event_date ? new Date(event.event_date) : null
    setEvtDate(d ? d.toISOString().slice(0, 16) : '')
    setEvtBottles(event.bottles || [])
    setEvtPendingBrand(''); setEvtPendingBottle(''); setEvtOtherBottle('')
    setEvtParking(event.rules?.parking || '')
    setEvtOvernight(event.rules?.overnight || '')
    setEvtIdReq(event.rules?.id || '')
    setEvtLimit(event.rules?.limit || '')
    setEvtRulesNotes(event.rules?.notes || '')
    const qoAt = event.queue_open_at ? new Date(event.queue_open_at).toISOString().slice(0, 16) : ''
    setEvtQueueOpenAt(qoAt)
    setEvtQueueRadius(event.queue_radius_miles != null ? String(event.queue_radius_miles) : '')
    setEvtSelectedStore(null)
    setEvtStoreLat(event.store_lat || null)
    setEvtStoreLng(event.store_lng || null)
    setEvtShowStorePicker(false)
    setEventFormOpen(true)
  }

  // ── Save edits to an existing event ────────────────────────────────────
  async function handleUpdateEvent() {
    let bottleList = [...evtBottles]
    if (bottleList.length === 0 && evtPendingBottle && evtPendingBottle !== '__other__') {
      bottleList = [evtPendingBottle]
    } else if (bottleList.length === 0 && evtOtherBottle.trim()) {
      bottleList = [evtOtherBottle.trim()]
    }
    if (!evtName.trim() || !evtStoreName.trim() || !evtCity.trim() || !evtDate) return

    const badEvtWords = getProfaneWords(evtName, evtRulesNotes, evtParking, evtOvernight, evtIdReq, evtLimit, evtOtherBottle)
    if (badEvtWords.length > 0) {
      alert(`Your event contains language that isn't allowed. Please remove or replace the following word${badEvtWords.length > 1 ? 's' : ''}:\n\n${badEvtWords.join(', ')}`)
      return
    }

    const payload = {
      name: evtName.trim(),
      store: evtStoreName.trim(),
      city: evtCity.trim(),
      state: 'NC',
      event_date: new Date(evtDate).toISOString(),
      event_type: evtType,
      bottles: bottleList,
      rules: {
        parking: evtParking.trim() || 'Not specified',
        overnight: evtOvernight.trim() || 'Not specified',
        id: evtIdReq.trim() || 'Valid ID required',
        limit: evtLimit.trim() || 'Not specified',
        notes: evtRulesNotes.trim() || '',
      },
      queue_open_at: evtQueueOpenAt ? new Date(evtQueueOpenAt).toISOString() : null,
      queue_radius_miles: evtQueueRadius ? parseFloat(evtQueueRadius) : null,
      store_lat: evtStoreLat,
      store_lng: evtStoreLng,
    }

    const id = editingEventId
    // Optimistic update
    setDbEvents(prev => (prev || []).map(e => e.id === id ? { ...e, ...payload } : e))

    // Close & reset form
    setEventFormOpen(false)
    setEditingEventId(null)
    setEvtType('drop')
    setEvtName(''); setEvtStoreName(''); setEvtCity(''); setEvtDate('')
    setEvtBottles([]); setEvtPendingBrand(''); setEvtPendingBottle(''); setEvtOtherBottle('')
    setEvtParking(''); setEvtOvernight(''); setEvtIdReq(''); setEvtLimit(''); setEvtRulesNotes('')
    setEvtQueueOpenAt(''); setEvtQueueRadius('')
    setEvtStoreSearch(''); setEvtSelectedStore(null); setEvtStoreLat(null); setEvtStoreLng(null)

    if (supabase) {
      const saved = await updateEvent(id, payload)
      if (saved) {
        setDbEvents(prev => (prev || []).map(e => e.id === id ? saved : e))
      } else {
        // Revert on failure by re-fetching
        fetchEvents().then(data => { if (data) setDbEvents(data) })
        alert('Could not save changes. Please try again.')
      }
    }
  }

  // ── Join virtual queue ─────────────────────────────────────────────────
  async function handleJoinQueue(eventId) {
    if (!session?.user?.id) return

    // ── Location enforcement ───────────────────────────────────────────
    const evtData = activeEvents.find(e => e.id === eventId)
    if (evtData?.queueRadiusMiles) {
      const getUserPos = () => new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000, maximumAge: 60000 })
      )
      let pos
      try {
        pos = await getUserPos()
      } catch {
        alert('Location access is required to join this line.\n\nPlease enable location services in your browser settings and try again.')
        return
      }
      if (evtData.storeLat && evtData.storeLng) {
        const dist = haversineDistance(
          pos.coords.latitude, pos.coords.longitude,
          evtData.storeLat, evtData.storeLng
        )
        if (dist > evtData.queueRadiusMiles) {
          alert(`You must be within ${evtData.queueRadiusMiles} mile${evtData.queueRadiusMiles === 0.5 ? '' : 's'} of the store to join this line.\n\nYou are approximately ${dist < 1 ? (dist * 5280).toFixed(0) + ' ft' : dist.toFixed(1) + ' miles'} away.`)
          return
        }
      }
    }

    const fp = getFingerprint()
    const handle =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split('@')[0] ||
      ('scout_' + fp.slice(-4))

    // Optimistic add
    const tempEntry = {
      id: `temp-q-${Date.now()}`,
      event_id: eventId,
      user_id: session.user.id,
      handle,
      joined_at: new Date().toISOString(),
    }
    setEventQueues(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), tempEntry],
    }))
    // Auto-expand queue list so user sees their position
    setOpenQueues(prev => { const n = new Set(prev); n.add(eventId); return n })

    if (supabase) {
      const saved = await joinEventQueue(eventId, session.user.id, handle, fp)
      if (saved) {
        const entries = await fetchEventQueue(eventId)
        setEventQueues(prev => ({ ...prev, [eventId]: entries }))
      } else {
        setEventQueues(prev => ({
          ...prev,
          [eventId]: (prev[eventId] || []).filter(e => e.id !== tempEntry.id),
        }))
        alert('Could not join the line. You may already be in it.')
      }
    }
  }

  // ── Leave virtual queue ────────────────────────────────────────────────
  async function handleLeaveQueue(eventId) {
    if (!session?.user?.id) return
    setEventQueues(prev => ({
      ...prev,
      [eventId]: (prev[eventId] || []).filter(e => e.user_id !== session.user.id),
    }))
    if (supabase) {
      const ok = await leaveEventQueue(eventId, session.user.id)
      if (!ok) {
        const entries = await fetchEventQueue(eventId)
        setEventQueues(prev => ({ ...prev, [eventId]: entries }))
      }
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
    setDbSightings(prev => updateCount(prev || []))
    if (supabase) await confirmSighting(id, getFingerprint())
  }

  // ── Show toast ─────────────────────────────────────────────────────────
  function showToast() {
    setToastVisible(true)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  // ── Add pending brand/bottle to the sighting's bottle list ─────────────
  function handleAddBottle() {
    let name = ''
    if (pendingBrand === '__other__') {
      name = otherBottle.trim()
    } else if (pendingBottle === '__other__') {
      name = otherBottle.trim()
    } else {
      name = pendingBottle
    }
    if (!name || !pendingBrand) return
    if (selectedBottles.includes(name)) return
    setSelectedBottles(prev => [...prev, name])
    setPendingBrand('')
    setPendingBottle('')
    setOtherBottle('')
  }

  // ── Submit new sighting ────────────────────────────────────────────────
  async function handlePost() {
    // If user filled in a pending selection but didn't click Add, auto-add it
    let bottleList = [...selectedBottles]
    if (bottleList.length === 0 && pendingBottle && pendingBottle !== '__other__') {
      bottleList = [pendingBottle]
    } else if (bottleList.length === 0 && pendingBrand === '__other__' && otherBottle.trim()) {
      bottleList = [otherBottle.trim()]
    } else if (bottleList.length === 0 && pendingBottle === '__other__' && otherBottle.trim()) {
      bottleList = [otherBottle.trim()]
    }

    if (!bottleList.length || !storeName.trim()) return

    const badWords = getProfaneWords(notes, reporterHandle, otherBottle, storeName, cityName)
    if (badWords.length > 0) {
      alert(`Your post contains language that isn't allowed. Please remove or replace the following word${badWords.length > 1 ? 's' : ''}:\n\n${badWords.join(', ')}`)
      return
    }

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
    setPendingBrand('')
    setPendingBottle('')
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
      const row = saved ? { ...saved, store: saved.store_name, confirmations: 0 } : localSighting
      setDbSightings(prev => [row, ...(prev || [])])
      if (saved) {
        fetch('/api/notify-sighting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sightingId: saved.id,
            storeName: saved.store_name,
            storeId: saved.store_id,
            lat: saved.lat,
            lng: saved.lng,
          }),
        }).catch(() => {}) // fire-and-forget
      }
    } else {
      setDbSightings(prev => [localSighting, ...(prev || [])])
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
    setPendingBrand('')
    setPendingBottle('')
    setBottleSearch('')
    if (!prefillStore) setStoreName('')
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <img src="/icon-192.png" className="header-logo" alt="" />
          <span className="header-title">DRAM SCOUT</span>
        </div>
        {isAdmin && (
          <button
            className="header-mode-toggle"
            onClick={() => { window.location.href = '/store' }}
            title="Switch to Store Portal view"
          >
            Store View →
          </button>
        )}
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
          <button className="header-user" onClick={() => openAuthModal('signin')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="8" r="4"/>
              <path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
            SIGN IN
          </button>
        )}
      </header>

      {/* ── HOME COUNTY ONBOARDING MODAL ────────────────────────────── */}
      {session && isOnboardingNeeded && (
        <HomeCountyModal onComplete={updateHomeCounty} />
      )}

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
        <button
          className={`tab-btn${activeTab === 'forum' ? ' active' : ''}`}
          onClick={() => setActiveTab('forum')}
        >
          <span className="tab-btn-icon">💬</span> FORUM
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
      <div className={`left-panel${searchExpanded ? ' search-expanded' : ''}`}>

      {/* ── DB STATUS BAR ───────────────────────────────────────────── */}
      {activeTab === 'scout' && (
        <div className="db-status-bar">
          <span className="db-status-dot" style={{ background: dbReady ? '#5DB85A' : '#C17D0E' }} />
          {dbReady ? `LIVE · ${filteredSightings.length} SIGHTINGS · ${stores.length} STORES MAPPED` : 'CONNECTING...'}
        </div>
      )}

      {/* ── FILTER STRIP ────────────────────────────────────────────── */}
      {activeTab === 'scout' && (
        <div className="search-box">
          <div className="search-row">
            <input
              className="search-input"
              placeholder="Search by bottle, brand, or store..."
              value={bottleSearch}
              onChange={e => { setBottleSearch(e.target.value); if (e.target.value) setActiveFilter('ALL') }}
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => setTimeout(() => setSearchExpanded(false), 200)}
            />
            {searchExpanded && (
              <button
                className="search-dismiss"
                onMouseDown={e => { e.preventDefault(); setSearchExpanded(false); setBottleSearch('') }}
              >DONE</button>
            )}
          </div>
        </div>
      )}
      <div className="filter-strip" style={{ display: activeTab === 'scout' ? undefined : 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip${activeFilter === f && !bottleSearch ? ' active' : ''}`}
            onClick={() => { setActiveFilter(f); setBottleSearch('') }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── BARREL PICKS SECTION (Scout tab only) ───────────────────── */}
      {activeTab === 'scout' && (
        <ScoutTab searchQuery={bottleSearch} />
      )}

      {/* ── SIGHTINGS FEED ──────────────────────────────────────────── */}
      <section className="feed-section" style={{ display: activeTab === 'scout' ? undefined : 'none' }}>
        <div className="feed-header" onClick={() => setSightingsExpanded(e => !e)}>
          <span className="feed-header-label">RECENT SIGHTINGS</span>
          <span className="feed-header-meta">{filteredSightings.length} REPORTS · LAST 7 DAYS</span>
          <div className="feed-header-rule" />
          <span className={`feed-header-chevron${sightingsExpanded ? ' open' : ''}`}>▼</span>
        </div>

        {sightingsExpanded && filteredSightings.slice(0, visibleCount).map(s => {
          const hoursOld = (now - s.createdAt) / (1000 * 60 * 60)
          const tier = getFreshnessTier(hoursOld)
          const isConfirmed = confirmed.has(s.id)
          const confirmCount = isConfirmed ? s.confirmations + 1 : s.confirmations

          return (
            <div key={s.id} className="sighting-card" onClick={() => handleOpenComments(s)} style={{ cursor: 'pointer' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="card-confirmed">✓ {confirmCount} confirmed</span>
                  <span className="card-comment-count">💬 {s.comment_count || 0}</span>
                </div>
              </div>

              {s.notes && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: '11px', color: 'var(--ghost)', marginBottom: '10px', fontStyle: 'italic' }}>
                  "{s.notes}"
                </div>
              )}

              <div className="card-actions">
                <button
                  className={`btn-saw-it${isConfirmed ? ' confirmed' : ''}`}
                  onClick={e => { e.stopPropagation(); !isConfirmed && handleConfirm(s.id) }}
                >
                  {isConfirmed ? '✓ CONFIRMED' : 'I SAW THIS'}
                </button>
                <button className="btn-view-map" onClick={e => { e.stopPropagation(); handleViewOnMap(s) }}>
                  VIEW ON MAP
                </button>
                {session && s.storeId && (
                  <button
                    className={`btn-favorite${favorites.has(s.storeId) ? ' favorited' : ''}`}
                    onClick={e => { e.stopPropagation(); handleToggleFavorite(s.storeId) }}
                    title={favorites.has(s.storeId) ? 'Remove favorite' : 'Save store'}
                  >
                    {favorites.has(s.storeId) ? '★' : '☆'}
                  </button>
                )}
                {canDeleteAny && (
                  <button className="btn-delete-sighting" onClick={e => { e.stopPropagation(); setDeleteConfirm(s.id) }}
                    style={{ fontSize: 9, padding: '4px 8px' }}
                    title="Admin: delete sighting"
                  >✕</button>
                )}
              </div>
            </div>
          )
        })}

        {sightingsExpanded && visibleCount < filteredSightings.length && (
          <button className="load-more-btn" onClick={() => setVisibleCount(v => v + 10)}>
            LOAD {Math.min(10, filteredSightings.length - visibleCount)} MORE SIGHTINGS
          </button>
        )}

        {sightingsExpanded && filteredSightings.length === 0 && (
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
            <span className="feed-header-label">
              {evtTypeFilter === 'meetup' ? 'MEET-UPS' : evtTypeFilter === 'tasting' ? 'TASTINGS' : 'UPCOMING EVENTS'}
            </span>
            <span className="feed-header-meta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {filteredActiveEvents.filter(e => getEventStatus(e.date) !== 'past').length} SCHEDULED
              {session && canPostEvent && (
                <button className="btn-post-event" onClick={() => setEventFormOpen(true)}>
                  + POST EVENT
                </button>
              )}
            </span>
            <div className="feed-header-rule" />
          </div>

          <div className="event-type-filter">
            {[
              { key: 'all',     label: '🥃 ALL' },
              { key: 'drop',    label: '🥃 DROPS' },
              { key: 'meetup',  label: '🤝 MEET-UPS' },
              { key: 'tasting', label: '🍷 TASTINGS' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`btn-evt-type-filter${evtTypeFilter === key ? ` active-${key}` : ''}`}
                onClick={() => setEvtTypeFilter(key)}
              >{label}</button>
            ))}
          </div>

          {filteredActiveEvents.map(event => {
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
                    <span className={`event-type-badge ${event.type}`}>
                      {event.type === 'drop' ? '🥃 DROP' : event.type === 'meetup' ? '🤝 MEET-UP' : '🍷 TASTING'}
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
                  <div className="event-rules-title">
                    {event.type === 'drop' ? 'Drop Rules & Info' : event.type === 'meetup' ? 'Meet-up Details' : 'Tasting Details'}
                  </div>
                  <div className="event-rule-row">
                    <span className="event-rule-icon">🅿️</span>
                    <div className="event-rule-content">
                      <span className="event-rule-label">Parking</span>
                      <span className="event-rule-text">{event.rules.parking}</span>
                    </div>
                  </div>
                  {event.type === 'drop' && (
                    <div className="event-rule-row">
                      <span className="event-rule-icon">🌙</span>
                      <div className="event-rule-content">
                        <span className="event-rule-label">Overnight / Line Policy</span>
                        <span className="event-rule-text">{event.rules.overnight}</span>
                      </div>
                    </div>
                  )}
                  <div className="event-rule-row">
                    <span className="event-rule-icon">🪪</span>
                    <div className="event-rule-content">
                      <span className="event-rule-label">ID Requirements</span>
                      <span className="event-rule-text">{event.rules.id}</span>
                    </div>
                  </div>
                  {event.type === 'drop' && (
                    <div className="event-rule-row">
                      <span className="event-rule-icon">📋</span>
                      <div className="event-rule-content">
                        <span className="event-rule-label">Bottle Limit</span>
                        <span className="event-rule-text">{event.rules.limit}</span>
                      </div>
                    </div>
                  )}
                  {event.rules.notes ? (
                    <div className="event-rule-row">
                      <span className="event-rule-icon">💬</span>
                      <div className="event-rule-content">
                        <span className="event-rule-label">Community Notes</span>
                        <span className="event-rule-text">{event.rules.notes}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* ── VIRTUAL QUEUE (drop events only) ── */}
                {event.type === 'drop' && (() => {
                  const queueCloseTime = event.date.getTime() + 30 * 60 * 1000
                  const queueOpenTime  = event.queueOpenAt ? event.queueOpenAt.getTime() : null
                  const nowMs          = queueNow.getTime()
                  const lineIsOpen     = (queueOpenTime === null || nowMs >= queueOpenTime) && nowMs < queueCloseTime
                  const lineNotYet     = queueOpenTime !== null && nowMs < queueOpenTime
                  const lineClosed     = nowMs >= queueCloseTime
                  const entries        = eventQueues[event.id] || []
                  const myEntry        = entries.find(e => e.user_id === session?.user?.id)
                  const myPos          = myEntry ? entries.indexOf(myEntry) + 1 : null
                  const queueExpanded  = openQueues.has(event.id)

                  return (
                    <div className="event-queue-section">
                      <div className="event-queue-header">
                        <span className="event-queue-title">
                          VIRTUAL LINE{entries.length > 0 ? ` · ${entries.length} IN LINE` : ''}
                        </span>
                        {entries.length > 0 && (
                          <button
                            className="btn-queue-toggle"
                            onClick={() => setOpenQueues(prev => {
                              const n = new Set(prev)
                              n.has(event.id) ? n.delete(event.id) : n.add(event.id)
                              return n
                            })}
                          >
                            {queueExpanded ? 'HIDE LINE' : 'VIEW LINE'}
                          </button>
                        )}
                      </div>

                      {event.queueRadiusMiles && (
                        <div className="event-queue-radius">
                          📍 Must be within {event.queueRadiusMiles} miles of {event.city}
                        </div>
                      )}

                      {!session && (
                        <div className="event-queue-signin">Sign in to join the virtual line</div>
                      )}

                      {session && lineNotYet && (
                        <div className="event-queue-countdown">
                          <span className="queue-countdown-label">LINE OPENS IN</span>
                          <span className="queue-countdown-value">
                            {formatQueueCountdown(queueOpenTime, nowMs)}
                          </span>
                        </div>
                      )}

                      {session && lineIsOpen && !myEntry && (
                        <button className="btn-join-line" onClick={() => handleJoinQueue(event.id)}>
                          {event.queueRadiusMiles ? '📍 JOIN LINE' : '🎯 JOIN LINE'}
                        </button>
                      )}
                      {session && lineIsOpen && !myEntry && event.queueRadiusMiles && (
                        <div className="evt-hint" style={{ textAlign: 'center', marginTop: -6 }}>
                          Location services required to check in
                        </div>
                      )}

                      {session && myEntry && (
                        <div className="my-queue-position">
                          <span className="my-queue-position-label">YOUR POSITION</span>
                          <span className="my-queue-position-num">#{myPos}</span>
                          {lineIsOpen && (
                            <button className="btn-leave-line" onClick={() => handleLeaveQueue(event.id)}>
                              LEAVE
                            </button>
                          )}
                        </div>
                      )}

                      {lineClosed && (
                        <div className="event-queue-closed">
                          🔒 LINE CLOSED
                        </div>
                      )}

                      {queueExpanded && entries.length > 0 && (
                        <div className="queue-list">
                          {entries.map((entry, idx) => (
                            <div
                              key={entry.id}
                              className={`queue-entry${entry.user_id === session?.user?.id ? ' mine' : ''}`}
                            >
                              <span className="queue-pos">#{idx + 1}</span>
                              <span className="queue-handle">{entry.handle}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

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
                  {session?.user?.id && isAdmin && (
                    <button className="btn-edit-event" onClick={() => handleOpenEditEvent(event)}>
                      EDIT
                    </button>
                  )}
                  {session?.user?.id && (canDeleteAny || event.user_id === session.user.id) ? (
                    <button className="btn-delete-event" onClick={() => setDeleteEventConfirm(event.id)}>
                      DELETE
                    </button>
                  ) : (
                    <button className="btn-share">SHARE</button>
                  )}
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
                  {(() => {
                    const rl = ROLE_LABELS[effectiveRole] || ROLE_LABELS.scout
                    return (<>
                      <span className="role-badge" style={{ color: rl.color, borderColor: rl.color, background: rl.bg }}>
                        {rl.label}
                      </span>
                      <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, color: 'var(--ghost)', marginTop: 3, letterSpacing: '0.04em' }}>
                        {rl.desc}
                      </div>
                    </>)
                  })()}
                </div>
                <button className="profile-signout-btn" onClick={() => signOut()}>SIGN OUT</button>
              </div>

              {/* ── Scout Handle ─────────────────────────────────── */}
              <div className="phone-settings-panel">
                <div className="phone-settings-header">SCOUT HANDLE</div>
                <div className="phone-current">
                  <span className="phone-number">@{reporterHandle || '—'}</span>
                </div>
                <div className="phone-field-row">
                  <input
                    className="phone-input"
                    type="text"
                    placeholder="bourbonhunter_nc"
                    value={handleInput}
                    onChange={e => setHandleInput(e.target.value.replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '').toLowerCase().slice(0, 30))}
                    disabled={handleSaving}
                  />
                </div>
                {handleError && <div className="phone-error">{handleError}</div>}
                <div className="phone-btn-row">
                  <button
                    className="phone-submit-btn"
                    onClick={handleSaveHandle}
                    disabled={handleSaving || !handleInput.trim()}
                  >
                    {handleSaving ? 'SAVING…' : handleSaved ? 'SAVED ✓' : 'SAVE HANDLE'}
                  </button>
                </div>
              </div>

              {/* ── Home County ──────────────────────────────────── */}
              <div className="phone-settings-panel">
                <div className="phone-settings-header">HOME COUNTY</div>
                <div className="phone-current">
                  {countyProfile?.home_county ? (
                    <span className="phone-number">{countyProfile.home_county} County</span>
                  ) : (
                    <span className="phone-empty">No home county set</span>
                  )}
                </div>
                <button
                  className="phone-edit-btn"
                  onClick={() => setCountyPickerOpen(true)}
                >
                  {countyProfile?.home_county ? 'CHANGE COUNTY' : 'SET COUNTY'}
                </button>
              </div>

              {/* County change sheet */}
              {countyPickerOpen && (
                <>
                  <div className="sheet-overlay" onClick={() => setCountyPickerOpen(false)} style={{ zIndex: 400 }} />
                  <div className="sheet open" style={{ zIndex: 410, height: '88dvh', maxHeight: '88dvh' }}>
                    <div className="sheet-handle-wrap">
                      <div className="sheet-handle" />
                    </div>
                    <div className="sheet-header">
                      <div className="sheet-title">CHANGE HOME COUNTY</div>
                    </div>
                    <div className="sheet-body" style={{ overflowY: 'auto', padding: '0 16px' }}>
                      <CountyPicker
                        selectedCounty={countyProfile?.home_county ?? null}
                        onSelect={async (county) => {
                          await updateHomeCounty(county)
                          setCountyPickerOpen(false)
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Phone Number ─────────────────────────────────── */}
              <div className="phone-settings-panel">
                <div className="phone-settings-header">PHONE NUMBER</div>

                {phoneStep === 'idle' && (
                  <>
                    <div className="phone-current">
                      {userPhone?.phone ? (
                        <>
                          <span className="phone-number">{userPhone.phone}</span>
                          {userPhone.phone_verified
                            ? <span className="phone-verified-badge">VERIFIED</span>
                            : <span className="phone-unverified-badge">UNVERIFIED</span>
                          }
                        </>
                      ) : (
                        <span className="phone-empty">No phone number on file</span>
                      )}
                    </div>
                    <button
                      className="phone-edit-btn"
                      onClick={() => { setPhoneInput(userPhone?.phone || ''); setPhoneStep('editing'); setPhoneError(null) }}
                    >
                      {userPhone?.phone ? 'CHANGE PHONE' : 'ADD PHONE'}
                    </button>
                  </>
                )}

                {phoneStep === 'editing' && (
                  <>
                    <div className="phone-field-row">
                      <input
                        className="phone-input"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        disabled={phoneLoading}
                      />
                    </div>
                    {phoneError && <div className="phone-error">{phoneError}</div>}
                    <div className="phone-btn-row">
                      <button
                        className="phone-submit-btn"
                        onClick={handleRequestPhoneVerification}
                        disabled={phoneLoading || !phoneInput.trim()}
                      >
                        {phoneLoading ? 'SENDING…' : 'SEND CODE'}
                      </button>
                      <button
                        className="phone-cancel-btn"
                        onClick={() => { setPhoneStep('idle'); setPhoneError(null) }}
                        disabled={phoneLoading}
                      >
                        CANCEL
                      </button>
                    </div>
                  </>
                )}

                {phoneStep === 'awaiting_code' && (
                  <>
                    <div className="phone-code-hint">
                      Enter the 6-digit code sent to <strong>{phoneInput}</strong>
                    </div>
                    {phoneDevCode && (
                      <div className="phone-dev-banner">
                        Dev mode — code: <strong>{phoneDevCode}</strong>
                      </div>
                    )}
                    <div className="phone-field-row">
                      <input
                        className="phone-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value.replace(/\D/g, ''))}
                        disabled={phoneLoading}
                      />
                    </div>
                    {phoneError && <div className="phone-error">{phoneError}</div>}
                    <div className="phone-btn-row">
                      <button
                        className="phone-submit-btn"
                        onClick={handleConfirmPhoneVerification}
                        disabled={phoneLoading || codeInput.length !== 6}
                      >
                        {phoneLoading ? 'VERIFYING…' : 'VERIFY'}
                      </button>
                      <button
                        className="phone-cancel-btn"
                        onClick={() => { setPhoneStep('editing'); setPhoneError(null); setCodeInput('') }}
                        disabled={phoneLoading}
                      >
                        BACK
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* ── Admin Panel ────────────────────────────────────── */}
              {isAdmin && (() => {
                const filtered = (allUsers || []).filter(u => {
                  if (!adminSearch.trim()) return true
                  const q = adminSearch.toLowerCase()
                  return (u.email || '').toLowerCase().includes(q) ||
                         (u.display_name || '').toLowerCase().includes(q)
                })
                return (
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <div className="admin-panel-title">⚙ USER MANAGEMENT</div>
                      <div className="admin-panel-count">
                        {allUsersLoading ? 'Loading…' : `${(allUsers || []).length} users`}
                      </div>
                    </div>
                    <div className="admin-search-row">
                      <input
                        className="admin-search-input"
                        placeholder="Search by email or name..."
                        value={adminSearch}
                        onChange={e => setAdminSearch(e.target.value)}
                      />
                      {adminSearch && (
                        <button className="btn-admin-clear" onClick={() => setAdminSearch('')}>✕</button>
                      )}
                    </div>

                    {allUsersLoading && (
                      <div className="admin-loading">Loading users…</div>
                    )}

                    {!allUsersLoading && filtered.length === 0 && (
                      <div className="admin-empty">
                        {adminSearch ? 'No users match that search.' : 'No users have signed in yet.'}
                      </div>
                    )}

                    {!allUsersLoading && filtered.length > 0 && (
                      <div className="admin-user-list">
                        {filtered.map(u => {
                          const rl = ROLE_LABELS[u.role] || ROLE_LABELS.scout
                          return (
                            <div key={u.user_id} className="admin-user-row">
                              <div className="admin-user-info">
                                <div className="admin-user-email">{u.email}</div>
                                {u.display_name && <div className="admin-user-name">{u.display_name}</div>}
                              </div>
                              <div className="admin-user-right">
                                <span className="admin-role-badge" style={{ color: rl.color, background: rl.bg }}>
                                  {rl.label}
                                </span>
                                <select
                                  className="admin-role-select"
                                  value={u.role || 'scout'}
                                  onChange={async e => {
                                    const newRole = e.target.value
                                    const ok = await upsertUserRole(u.user_id, newRole)
                                    if (ok) {
                                      setAllUsers(prev => (prev || []).map(p =>
                                        p.user_id === u.user_id ? { ...p, role: newRole } : p
                                      ))
                                    } else {
                                      alert('Failed to update role')
                                    }
                                  }}
                                >
                                  <option value="scout">Scout</option>
                                  <option value="collector">Collector</option>
                                  <option value="store">Store</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── Push Notifications ───────────────────────────────────── */}
              {['admin', 'store', 'collector'].includes(effectiveRole) && !pushSupported && (
                <div className="notif-settings-panel">
                  <div className="notif-settings-header">NOTIFICATIONS</div>
                  <div className="notif-unsupported">
                    Push notifications require Chrome or Edge. Opera and some other browsers do not support the push service used by DramScout.
                  </div>
                </div>
              )}
              {['admin', 'store', 'collector'].includes(effectiveRole) && pushSupported && (
                <div className="notif-settings-panel">
                  <div className="notif-settings-header">NOTIFICATIONS</div>

                  <div className="notif-toggle-row">
                    <label className="notif-toggle-label">
                      <input
                        type="checkbox"
                        className="notif-toggle-checkbox"
                        checked={notifPrefs.enabled}
                        disabled={notifLoading}
                        onChange={e => handleToggleNotifications(e.target.checked)}
                      />
                      <span className="notif-toggle-text">
                        {notifLoading ? 'Updating…' : 'Enable push notifications'}
                      </span>
                    </label>
                    {notifError && <div className="notif-error">{notifError}</div>}
                  </div>

                  {notifPrefs.enabled && (
                    <>
                      <div className="notif-radius-label">Notification Radius</div>
                      <div className="notif-radius-row">
                        {[5, 10, 25, 50, 999999].map(r => (
                          <button
                            key={r}
                            className={`notif-radius-btn${notifPrefs.radius_miles === r ? ' active' : ''}`}
                            onClick={() => handleNotifRadiusChange(r)}
                          >
                            {r >= 999999 ? 'Nationwide' : `${r} mi`}
                          </button>
                        ))}
                      </div>

                      <button className="notif-location-btn" onClick={handleSetNotifLocation}>
                        {notifPrefs.lat && notifPrefs.lng ? 'Update My Location' : 'Set My Location'}
                      </button>
                      {notifPrefs.lat && notifPrefs.lng && (
                        <div className="notif-location-set">
                          Location set ({notifPrefs.lat.toFixed(3)}, {notifPrefs.lng.toFixed(3)})
                        </div>
                      )}

                      <div className="notif-favorites-note">
                        Favorite stores always notify regardless of radius.
                      </div>
                    </>
                  )}
                </div>
              )}

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

              {/* Store search */}
              <div className="fav-store-search-wrap">
                <input
                  className="fav-store-search-input"
                  placeholder="Search stores to favorite…"
                  value={favStoreSearch}
                  onChange={e => setFavStoreSearch(e.target.value)}
                />
                {favStoreSearch && (
                  <button className="fav-store-search-clear" onClick={() => setFavStoreSearch('')}>✕</button>
                )}
              </div>

              {/* Search results */}
              {favStoreSearch.trim().length > 0 && (() => {
                const q = favStoreSearch.toLowerCase()
                const results = stores.filter(s =>
                  s.name.toLowerCase().includes(q) ||
                  s.city.toLowerCase().includes(q)
                ).slice(0, 8)
                return results.length === 0 ? (
                  <div className="profile-empty">No stores match "{favStoreSearch}"</div>
                ) : results.map(s => (
                  <div key={s.id} className="profile-fav-store-row">
                    <div style={{ flex: 1 }}>
                      <div className="profile-fav-store-name">{s.name}</div>
                      <div className="profile-fav-store-city">{s.city}, {s.state}</div>
                    </div>
                    <button
                      className={`profile-fav-remove${favorites.has(s.id) ? ' active' : ''}`}
                      onClick={() => handleToggleFavorite(s.id)}
                      title={favorites.has(s.id) ? 'Remove favorite' : 'Add favorite'}
                    >{favorites.has(s.id) ? '★' : '☆'}</button>
                  </div>
                ))
              })()}

              {/* Current favorites list */}
              {favStoreSearch.trim().length === 0 && (
                favorites.size === 0 ? (
                  <div className="profile-empty">No favorites yet — search above or tap ★ on any sighting card</div>
                ) : stores.filter(s => favorites.has(s.id)).map(store => (
                  <div key={store.id} className="profile-fav-store-row">
                    <div style={{ flex: 1 }}>
                      <div className="profile-fav-store-name">{store.name}</div>
                      <div className="profile-fav-store-city">{store.city}, {store.state}</div>
                    </div>
                    <button
                      className="profile-fav-remove active"
                      onClick={() => handleToggleFavorite(store.id)}
                      title="Remove favorite"
                    >★</button>
                  </div>
                ))
              )}

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

              {/* My Lottery Entries */}
              <div className="profile-section-header" style={{ marginTop: 8 }}>
                MY LOTTERY ENTRIES
              </div>
              <MyLotteryEntries userId={session?.user?.id} />
            </>
          ) : (
            <div className="profile-signin-prompt">
              <p>SIGN IN TO TRACK YOUR SIGHTINGS, SAVE FAVORITE STORES, AND RSVP TO BOURBON DROPS</p>
              <button className="profile-signin-google-btn" onClick={() => signInWithGoogle()}>
                SIGN IN WITH GOOGLE
              </button>
              <button className="profile-signin-email-btn" onClick={() => openAuthModal('signin')}>
                SIGN IN WITH EMAIL
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── FORUM VIEW ──────────────────────────────────────────────── */}
      {activeTab === 'forum' && (
        <div className="forum-view">

          {/* ── CATEGORIES ─────────────────────────────────────────── */}
          {forumView === 'categories' && (
            <>
              <div className="forum-header">
                <span className="forum-header-title">COMMUNITY FORUM</span>
              </div>
              {forumCategories.length === 0 && (
                <div className="forum-empty">Loading categories…</div>
              )}
              {forumCategories.map(cat => (
                <button key={cat.id} className="forum-category-card" onClick={() => handleEnterCategory(cat)}>
                  <span className="forum-category-icon">{cat.icon}</span>
                  <div className="forum-category-info">
                    <div className="forum-category-name">{cat.name}</div>
                    {cat.description && <div className="forum-category-desc">{cat.description}</div>}
                    <div className="forum-category-meta">
                      {cat.thread_count} thread{cat.thread_count !== 1 ? 's' : ''}
                      {cat.last_post_at ? ` · ${forumRelTime(cat.last_post_at)}` : ''}
                    </div>
                  </div>
                  <span className="forum-category-chevron">›</span>
                </button>
              ))}
            </>
          )}

          {/* ── THREADS ─────────────────────────────────────────────── */}
          {forumView === 'threads' && (
            <>
              <div className="forum-subheader">
                <button className="forum-back-btn" onClick={handleForumBack}>‹</button>
                <span className="forum-subheader-title">{forumActiveCategory?.name}</span>
                {session && (
                  <button className="forum-new-btn" onClick={() => handleOpenForumComposer('thread')}>+ NEW</button>
                )}
              </div>
              {forumThreadsLoading && <div className="forum-empty">Loading…</div>}
              {!forumThreadsLoading && forumThreads.length === 0 && (
                <div className="forum-empty">No threads yet — be the first to post!</div>
              )}
              {!forumThreadsLoading && forumThreads.map(thread => (
                <div
                  key={thread.id}
                  className={`forum-thread-row${thread.pinned ? ' forum-thread-pinned' : ''}`}
                  onClick={() => handleEnterThread(thread)}
                >
                  <div className="forum-thread-row-main">
                    <div className="forum-thread-title">
                      {thread.pinned && <span className="forum-pin">📌 </span>}
                      {thread.title}
                    </div>
                    <div className="forum-thread-meta">
                      @{thread.handle} · {thread.post_count} repl{thread.post_count !== 1 ? 'ies' : 'y'} · {forumRelTime(thread.last_post_at)}
                    </div>
                  </div>
                  {(session?.user?.id === thread.user_id || isAdmin) && (
                    <button
                      className="forum-delete-btn"
                      onClick={e => { e.stopPropagation(); handleDeleteForumThread(thread.id, thread.user_id) }}
                    >✕</button>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── THREAD VIEW ─────────────────────────────────────────── */}
          {forumView === 'thread' && forumActiveThread && (
            <>
              <div className="forum-subheader">
                <button className="forum-back-btn" onClick={handleForumBack}>‹</button>
                <span className="forum-subheader-title forum-subheader-thread-title">{forumActiveThread.title}</span>
                {session && (
                  <button className="forum-new-btn" onClick={() => handleOpenForumComposer('reply')}>REPLY</button>
                )}
              </div>

              {/* Original post */}
              <div className="forum-post-card forum-post-op">
                <div className="forum-post-header">
                  <span className="forum-post-handle">@{forumActiveThread.handle}</span>
                  <span className="forum-post-time">{forumRelTime(forumActiveThread.created_at)}</span>
                </div>
                <div className="forum-post-body">{forumActiveThread.body}</div>
              </div>

              {forumPostsLoading && <div className="forum-empty">Loading replies…</div>}

              {!forumPostsLoading && forumPosts.length === 0 && (
                <div className="forum-empty">No replies yet.</div>
              )}

              {forumPosts.map(post => {
                const counts = forumReactionCounts(post.id)
                return (
                  <div key={post.id} className="forum-post-card">
                    <div className="forum-post-header">
                      <span className="forum-post-handle">@{post.handle}</span>
                      <span className="forum-post-time">{forumRelTime(post.created_at)}</span>
                      {(session?.user?.id === post.user_id || isAdmin) && (
                        <button
                          className="forum-delete-btn"
                          onClick={() => handleDeleteForumPost(post.id, post.user_id)}
                        >✕</button>
                      )}
                    </div>
                    <div className="forum-post-body">{post.body}</div>
                    <div className="forum-reactions-row">
                      {['👍', '🥃', '🔥'].map(emoji => (
                        <button
                          key={emoji}
                          className={`forum-reaction-btn${forumHasReacted(post.id, emoji) ? ' mine' : ''}`}
                          onClick={() => handleToggleReaction(post.id, emoji)}
                          disabled={!session}
                        >
                          {emoji} {counts[emoji] ? <span className="forum-reaction-count">{counts[emoji]}</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {forumHasMore && (
                <button className="forum-load-more" onClick={handleLoadMorePosts}>
                  Load more replies…
                </button>
              )}
            </>
          )}

          {/* ── COMPOSER SHEET ──────────────────────────────────────── */}
          <div className={`event-form-overlay${forumComposerOpen ? ' open' : ''}`} onClick={handleCloseForumComposer} />
          <div className={`event-form-sheet${forumComposerOpen ? ' open' : ''}`}>
            {forumComposerOpen && (
              <>
                <div className="sheet-header">
                  <div className="sheet-handle-wrap" style={{ padding: '12px 0 4px' }}>
                    <div className="sheet-handle" />
                  </div>
                  <div className="sheet-title">
                    {forumComposerMode === 'thread' ? 'NEW THREAD' : 'NEW REPLY'}
                  </div>
                </div>
                <div className="event-form-body">
                  {forumComposerMode === 'thread' && (
                    <div className="evt-field">
                      <label className="evt-label">TITLE</label>
                      <input
                        className="forum-composer-title evt-input"
                        placeholder="Thread title…"
                        value={forumDraftTitle}
                        onChange={e => setForumDraftTitle(e.target.value.slice(0, 140))}
                        autoFocus
                      />
                    </div>
                  )}
                  <div className="evt-field">
                    <label className="evt-label">{forumComposerMode === 'thread' ? 'BODY' : 'REPLY'}</label>
                    <textarea
                      className="forum-composer-body"
                      placeholder="Write something…"
                      rows={5}
                      value={forumDraftBody}
                      onChange={e => setForumDraftBody(e.target.value.slice(0, 2000))}
                    />
                  </div>
                  {forumError && <div className="forum-composer-error">{forumError}</div>}
                </div>
                <div className="event-form-footer">
                  <button className="btn-evt-cancel" onClick={handleCloseForumComposer}>CANCEL</button>
                  <button
                    className="btn-evt-submit forum-composer-submit"
                    onClick={handleSubmitForum}
                    disabled={forumSubmitting}
                  >
                    {forumSubmitting ? 'POSTING…' : 'POST'}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      )}

      </div>{/* end .left-panel */}

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <button className="fab" onClick={openSheet} aria-label="Post sighting">
        +
      </button>

      {/* ── BOTTOM SHEET ─────────────────────────────────────────────── */}
      {sheetOpen && <div className="sheet-overlay" onClick={closeSheet} />}
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
          {selectedBottles.length > 0 && (
            <div className="bottle-added-list">
              {selectedBottles.map((b, i) => (
                <div key={i} className="bottle-added-item">
                  <span>🍾 {b}</span>
                  <button className="bottle-added-remove" onClick={() => setSelectedBottles(prev => prev.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
          <select
            className="bottle-select"
            value={pendingBrand}
            onChange={e => { setPendingBrand(e.target.value); setPendingBottle(''); setOtherBottle('') }}
          >
            <option value="">— Select a brand —</option>
            {BOURBON_CATALOG.map(({ brand }) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
            <option value="__other__">Other (not listed)</option>
          </select>
          {pendingBrand && pendingBrand !== '__other__' && (
            <select
              className="bottle-select"
              value={pendingBottle}
              onChange={e => { setPendingBottle(e.target.value); setOtherBottle('') }}
            >
              <option value="">— Select a bottle —</option>
              {BOURBON_CATALOG.find(({ brand }) => brand === pendingBrand)?.bottles.map(bottle => (
                <option key={bottle} value={bottle}>{bottle}</option>
              ))}
              <option value="__other__">Other (not listed)</option>
            </select>
          )}
          {(pendingBrand === '__other__' || pendingBottle === '__other__') && (
            <div className="field-group">
              <input
                className="text-input"
                placeholder={pendingBrand === '__other__' ? 'Full bottle name (e.g. Maker\'s Mark RC6)...' : 'Bottle label...'}
                value={otherBottle}
                onChange={e => setOtherBottle(e.target.value)}
              />
            </div>
          )}
          <button className="btn-add-bottle" onClick={handleAddBottle}>
            + ADD BOTTLE
          </button>

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

      {/* ── DELETE EVENT CONFIRM MODAL ───────────────────────────────── */}
      {deleteEventConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setDeleteEventConfirm(null)} />
          <div className="modal">
            <div className="modal-title">DELETE EVENT?</div>
            <div className="modal-body">
              This event will be permanently removed. RSVPs will also be lost. This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setDeleteEventConfirm(null)}>
                CANCEL
              </button>
              <button className="modal-btn-confirm" onClick={() => handleDeleteEvent(deleteEventConfirm)}>
                DELETE
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── COMMENTS SHEET ───────────────────────────────────────────── */}
      <div className={`event-form-overlay${commentSighting ? ' open' : ''}`} onClick={handleCloseComments} />
      <div className={`event-form-sheet${commentSighting ? ' open' : ''}`}>
        {commentSighting && (() => {
          const relTime = ts => {
            const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
            if (mins < 1) return 'just now'
            if (mins < 60) return `${mins}m ago`
            const hrs = Math.floor(mins / 60)
            if (hrs < 24) return `${hrs}h ago`
            return `${Math.floor(hrs / 24)}d ago`
          }
          const topLevel = comments.filter(c => !c.parent_id)
          const repliesFor = id => comments.filter(c => c.parent_id === id)

          return (
            <>
              <div className="sheet-header">
                <div className="sheet-handle-wrap" style={{ padding: '12px 0 4px' }}>
                  <div className="sheet-handle" />
                </div>
                <div className="sheet-title">COMMENTS</div>
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 11, color: 'var(--ghost)', padding: '0 20px 10px', letterSpacing: '0.06em' }}>
                  {commentSighting.store} · {commentSighting.city}
                </div>
              </div>

              <div className="event-form-body" style={{ paddingBottom: session ? 80 : 20 }}>
                {commentsLoading && <div className="comments-empty">Loading comments…</div>}
                {!commentsLoading && topLevel.length === 0 && (
                  <div className="comments-empty">No comments yet — be the first!</div>
                )}
                {!commentsLoading && topLevel.map(c => {
                  const replies = repliesFor(c.id)
                  const isExpanded = expandedReplies.has(c.id)
                  const isReplying = replyingTo?.id === c.id

                  return (
                    <div key={c.id} className="comment-row">
                      {/* Top-level comment */}
                      <div className="comment-header">
                        <span className="comment-handle">@{c.handle}</span>
                        <span className="comment-time">{relTime(c.created_at)}</span>
                      </div>
                      <div className="comment-body">{c.body}</div>

                      {/* Actions: Reply + Delete */}
                      <div className="comment-actions">
                        {session && (
                          <button
                            className="comment-reply-btn"
                            onClick={() => setReplyingTo(isReplying ? null : { id: c.id, handle: c.handle })}
                          >
                            {isReplying ? 'CANCEL' : 'REPLY'}
                          </button>
                        )}
                        {(canDeleteAny || c.user_id === session?.user?.id) && (
                          <button className="comment-delete-inline" onClick={() => handleDeleteComment(c.id, c.user_id)}>✕</button>
                        )}
                      </div>

                      {/* Inline reply input */}
                      {isReplying && (
                        <div className="reply-input-row">
                          <input
                            className="comment-input"
                            placeholder={`Replying to @${c.handle}…`}
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
                            maxLength={280}
                            autoFocus
                          />
                          <button
                            className="comment-submit"
                            onClick={handlePostComment}
                            disabled={!commentText.trim() || commentSubmitting}
                          >{commentSubmitting ? '…' : 'POST'}</button>
                        </div>
                      )}

                      {/* Replies section */}
                      {replies.length > 0 && (
                        <div className="replies-section">
                          <button
                            className="replies-toggle"
                            onClick={() => setExpandedReplies(prev => {
                              const next = new Set(prev)
                              next.has(c.id) ? next.delete(c.id) : next.add(c.id)
                              return next
                            })}
                          >
                            {isExpanded ? '▼' : '▶'} {replies.length} {replies.length === 1 ? 'REPLY' : 'REPLIES'}
                          </button>

                          {isExpanded && (
                            <div className="replies-list">
                              {replies.map(r => (
                                <div key={r.id} className="reply-row">
                                  <div className="comment-header">
                                    <span className="comment-handle">@{r.handle}</span>
                                    <span className="comment-time">{relTime(r.created_at)}</span>
                                  </div>
                                  <div className="comment-body">{r.body}</div>
                                  {(canDeleteAny || r.user_id === session?.user?.id) && (
                                    <button className="comment-delete-inline" onClick={() => handleDeleteComment(r.id, r.user_id)}>✕</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bottom input bar — top-level comments only */}
              {session && !replyingTo ? (
                <div className="comment-input-row">
                  <input
                    className="comment-input"
                    placeholder="Add a comment…"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
                    maxLength={280}
                  />
                  <button
                    className="comment-submit"
                    onClick={handlePostComment}
                    disabled={!commentText.trim() || commentSubmitting}
                  >{commentSubmitting ? '…' : 'POST'}</button>
                </div>
              ) : !session ? (
                <div className="comment-sign-in-prompt">Sign in to leave a comment</div>
              ) : null}
            </>
          )
        })()}
      </div>

      {/* ── CREATE EVENT FORM SHEET ──────────────────────────────────── */}
      <div className={`event-form-overlay${eventFormOpen ? ' open' : ''}`} onClick={() => { setEventFormOpen(false); setEditingEventId(null) }} />
      <div className={`event-form-sheet${eventFormOpen ? ' open' : ''}`}>
        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-handle-wrap" style={{ padding: '12px 0 4px' }}>
            <div className="sheet-handle" />
          </div>
          <div className="sheet-title">{editingEventId ? 'EDIT EVENT' : 'POST AN EVENT DROP'}</div>
        </div>

        <div className="event-form-body">
          {/* Event type */}
          <div className="event-form-section">
            <div className="event-form-section-title">Event Type</div>
            <div className="evt-type-row">
              {[
                { key: 'drop',    label: '🥃 DROP',    allowed: canCreateDrop },
                { key: 'meetup',  label: '🤝 MEET-UP',  allowed: true },
                { key: 'tasting', label: '🍷 TASTING',  allowed: true },
              ].map(({ key, label, allowed }) => (
                <button
                  key={key}
                  className={`evt-type-btn${evtType === key ? ` sel-${key}` : ''}`}
                  onClick={() => allowed && setEvtType(key)}
                  disabled={!allowed}
                  style={!allowed ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                  title={!allowed ? 'Store or Admin role required to post Drops' : undefined}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Event details */}
          <div className="event-form-section">
            <div className="event-form-section-title">Event Info</div>
            <div className="evt-field">
              <label className="evt-label">Event Name *</label>
              <input className="evt-input" placeholder="e.g. Blanton's Single Barrel Drop" value={evtName} onChange={e => setEvtName(e.target.value)} />
            </div>
            <div className="evt-field" style={{ position: 'relative' }}>
              <label className="evt-label">Store Name *</label>
              <input
                className="evt-input"
                placeholder={stores.length ? 'Search store name or city...' : 'Store name...'}
                value={evtStoreSearch}
                onChange={e => {
                  setEvtStoreSearch(e.target.value)
                  setEvtStoreName(e.target.value)
                  setEvtSelectedStore(null)
                  setEvtStoreLat(null); setEvtStoreLng(null)
                  setEvtShowStorePicker(true)
                  // clear radius if it required a store
                  if (evtQueueRadius && evtQueueRadius !== '') setEvtQueueRadius('')
                }}
                onFocus={() => setEvtShowStorePicker(true)}
                onBlur={() => setTimeout(() => setEvtShowStorePicker(false), 180)}
              />
              {evtSelectedStore && (
                <div className="evt-hint" style={{ color: '#5DB85A' }}>✓ {evtSelectedStore.name} · {evtSelectedStore.city}</div>
              )}
              {evtShowStorePicker && evtStoreSearch.length > 0 && (() => {
                const matches = stores.filter(s =>
                  s.name.toLowerCase().includes(evtStoreSearch.toLowerCase()) ||
                  s.city.toLowerCase().includes(evtStoreSearch.toLowerCase())
                ).slice(0, 7)
                if (!matches.length) return null
                return (
                  <div className="store-picker-dropdown">
                    {matches.map(s => (
                      <div key={s.id} className="store-picker-item"
                        onMouseDown={() => {
                          setEvtSelectedStore(s)
                          setEvtStoreSearch(s.name)
                          setEvtStoreName(s.name)
                          setEvtCity(s.city)
                          setEvtStoreLat(s.lat)
                          setEvtStoreLng(s.lng)
                          setEvtShowStorePicker(false)
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--ghost)' }}>{s.city}, {s.state}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div className="evt-field">
              <label className="evt-label">City *</label>
              <input className="evt-input" placeholder="e.g. Raleigh" value={evtCity} onChange={e => setEvtCity(e.target.value)} />
            </div>
            <div className="evt-field">
              <label className="evt-label">Date &amp; Time *</label>
              <input className="evt-input" type="datetime-local" value={evtDate} onChange={e => setEvtDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Virtual Line Settings — drops only */}
          {evtType === 'drop' && (
            <div className="event-form-section">
              <div className="event-form-section-title">Virtual Line Settings</div>
              <div className="evt-field">
                <label className="evt-label">Line Opens At (optional)</label>
                <input
                  className="evt-input"
                  type="datetime-local"
                  value={evtQueueOpenAt}
                  onChange={e => setEvtQueueOpenAt(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
                <div className="evt-hint">Leave blank — line opens when the event is posted</div>
              </div>
              <div className="evt-field">
                <label className="evt-label">Check-in Radius</label>
                <select
                  className="evt-select"
                  value={evtQueueRadius}
                  onChange={e => setEvtQueueRadius(e.target.value)}
                  disabled={!!evtQueueRadius && !evtStoreLat && evtQueueRadius !== ''}
                >
                  <option value="">Nationwide (no restriction)</option>
                  <option value="0.5" disabled={!evtStoreLat}>Within 0.5 miles{!evtStoreLat ? ' — pick store below' : ''}</option>
                  <option value="1"   disabled={!evtStoreLat}>Within 1 mile{!evtStoreLat ? ' — pick store below' : ''}</option>
                  <option value="5"   disabled={!evtStoreLat}>Within 5 miles{!evtStoreLat ? ' — pick store below' : ''}</option>
                  <option value="10"  disabled={!evtStoreLat}>Within 10 miles{!evtStoreLat ? ' — pick store below' : ''}</option>
                  <option value="25"  disabled={!evtStoreLat}>Within 25 miles{!evtStoreLat ? ' — pick store below' : ''}</option>
                </select>
                {!evtStoreLat && (
                  <div className="evt-hint" style={{ color: 'rgba(193,125,14,0.8)' }}>
                    Select a store from the list below to enable radius check-in
                  </div>
                )}
                {evtStoreLat && (
                  <div className="evt-hint" style={{ color: '#5DB85A' }}>
                    ✓ Store location locked — distance will be verified on check-in
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottles */}
          <div className="event-form-section">
            <div className="event-form-section-title">
              {evtType === 'tasting' ? 'Bottles Being Tasted (optional)' : evtType === 'meetup' ? 'Featured Bottles (optional)' : 'Bottles Being Released (optional)'}
            </div>
            <div className="evt-field">
              <label className="evt-label">Brand</label>
              <select className="evt-select" value={evtPendingBrand} onChange={e => { setEvtPendingBrand(e.target.value); setEvtPendingBottle(''); setEvtOtherBottle('') }}>
                <option value="">— Select a brand —</option>
                {BOURBON_CATALOG.map(({ brand }) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
                <option value="__other__">Other (not listed)</option>
              </select>
            </div>
            {evtPendingBrand && evtPendingBrand !== '__other__' && (
              <div className="evt-field">
                <label className="evt-label">Bottle</label>
                <div className="evt-bottle-row">
                  <select className="evt-select" value={evtPendingBottle} onChange={e => { setEvtPendingBottle(e.target.value); setEvtOtherBottle('') }}>
                    <option value="">— Select a bottle —</option>
                    {(BOURBON_CATALOG.find(c => c.brand === evtPendingBrand)?.bottles || []).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="__other__">Other / not listed</option>
                  </select>
                  {evtPendingBottle && evtPendingBottle !== '__other__' && (
                    <button className="btn-evt-add-bottle" onClick={handleAddEvtBottle}>ADD</button>
                  )}
                </div>
              </div>
            )}
            {(evtPendingBrand === '__other__' || evtPendingBottle === '__other__') && (
              <div className="evt-field">
                <label className="evt-label">Enter Bottle Name</label>
                <div className="evt-bottle-row">
                  <input className="evt-input" placeholder="Bottle name..." value={evtOtherBottle} onChange={e => setEvtOtherBottle(e.target.value)} />
                  <button className="btn-evt-add-bottle" onClick={handleAddEvtBottle}>ADD</button>
                </div>
              </div>
            )}
            {evtBottles.length > 0 && (
              <div className="evt-chips">
                {evtBottles.map(b => (
                  <span key={b} className="evt-chip">
                    🍾 {b}
                    <button className="evt-chip-remove" onClick={() => setEvtBottles(prev => prev.filter(x => x !== b))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rules */}
          <div className="event-form-section">
            <div className="event-form-section-title">
              {evtType === 'drop' ? 'Drop Rules & Info (optional)' : evtType === 'meetup' ? 'Meet-up Details (optional)' : 'Tasting Details (optional)'}
            </div>
            <div className="evt-field">
              <label className="evt-label">Parking</label>
              <input className="evt-input" placeholder="e.g. Lot parking available" value={evtParking} onChange={e => setEvtParking(e.target.value)} />
            </div>
            {evtType === 'drop' && (
              <div className="evt-field">
                <label className="evt-label">Overnight / Line Policy</label>
                <input className="evt-input" placeholder="e.g. No overnight lines" value={evtOvernight} onChange={e => setEvtOvernight(e.target.value)} />
              </div>
            )}
            <div className="evt-field">
              <label className="evt-label">ID Requirements</label>
              <input className="evt-input" placeholder="e.g. Valid ID required, 21+" value={evtIdReq} onChange={e => setEvtIdReq(e.target.value)} />
            </div>
            {evtType === 'drop' && (
              <div className="evt-field">
                <label className="evt-label">Bottle Limit</label>
                <input className="evt-input" placeholder="e.g. One per customer" value={evtLimit} onChange={e => setEvtLimit(e.target.value)} />
              </div>
            )}
            <div className="evt-field">
              <label className="evt-label">Community Notes</label>
              <input className="evt-input" placeholder="Any other details..." value={evtRulesNotes} onChange={e => setEvtRulesNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="event-form-footer">
          <button className="btn-evt-cancel" onClick={() => { setEventFormOpen(false); setEditingEventId(null) }}>CANCEL</button>
          <button
            className="btn-evt-submit"
            onClick={editingEventId ? handleUpdateEvent : handlePostEvent}
            disabled={!evtName.trim() || !evtStoreName.trim() || !evtCity.trim() || !evtDate}
          >
            {editingEventId ? 'SAVE CHANGES' : 'POST EVENT'}
          </button>
        </div>
      </div>

      {/* ── AUTH MODAL ───────────────────────────────────────────────── */}
      {showAuthModal && <div className="auth-overlay" onClick={() => setShowAuthModal(false)} />}
      <div className={`auth-modal${showAuthModal ? ' open' : ''}`} role="dialog" aria-modal="true">
        <button className="auth-modal-close" onClick={() => setShowAuthModal(false)} aria-label="Close">×</button>
        <div className="auth-modal-brand">DRAM SCOUT</div>

        {/* Tabs: Sign In / Create Account — hidden in forgot mode or after success */}
        {!authSuccess && (
          <div className="auth-modal-tabs">
            <button
              className={`auth-modal-tab${authMode === 'signin' || authMode === 'forgot' ? ' active' : ''}`}
              onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthSuccess(null) }}
            >SIGN IN</button>
            <button
              className={`auth-modal-tab${authMode === 'signup' ? ' active' : ''}`}
              onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthSuccess(null) }}
            >CREATE ACCOUNT</button>
          </div>
        )}

        {/* Success state (shown after signup confirmation or reset email sent) */}
        {authSuccess && (
          <div className="auth-success-box">
            {authSuccess}
            <br /><br />
            <button className="auth-forgot-link" style={{ textAlign: 'center', display: 'block', margin: '0 auto' }} onClick={() => setShowAuthModal(false)}>CLOSE</button>
          </div>
        )}

        {/* Sign In Form */}
        {!authSuccess && authMode === 'signin' && (
          <>
            <label className="auth-field-label">Email</label>
            <input className="auth-input" type="email" autoComplete="username" value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailAuth(e)}
              placeholder="you@example.com" />
            <label className="auth-field-label">Password</label>
            <input className="auth-input" type="password" autoComplete="current-password" value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailAuth(e)} />
            <button className="auth-forgot-link"
              onClick={() => { setAuthMode('forgot'); setAuthError(null) }}>Forgot password?</button>
            {authError && <div className="auth-error">{authError}</div>}
            <button className="auth-submit-btn" onClick={handleEmailAuth}
              disabled={authLoading || !authEmail || !authPassword}>
              {authLoading ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
            <div className="auth-divider">or</div>
            <button className="auth-google-btn" onClick={() => { setShowAuthModal(false); signInWithGoogle() }}>
              CONTINUE WITH GOOGLE
            </button>
          </>
        )}

        {/* Sign Up Form */}
        {!authSuccess && authMode === 'signup' && (
          <>
            <label className="auth-field-label">Display Name</label>
            <input className="auth-input" type="text" autoComplete="name" value={authDisplayName}
              onChange={e => setAuthDisplayName(e.target.value)}
              placeholder="Your name or handle" />
            <label className="auth-field-label">Email</label>
            <input className="auth-input" type="email" autoComplete="username" value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="you@example.com" />
            <label className="auth-field-label">Password</label>
            <input className="auth-input" type="password" autoComplete="new-password" value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailAuth(e)} />
            {authError && <div className="auth-error">{authError}</div>}
            <button className="auth-submit-btn" onClick={handleEmailAuth}
              disabled={authLoading || !authEmail || !authPassword}>
              {authLoading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
            </button>
            <div className="auth-divider">or</div>
            <button className="auth-google-btn" onClick={() => { setShowAuthModal(false); signInWithGoogle() }}>
              CONTINUE WITH GOOGLE
            </button>
          </>
        )}

        {/* Forgot Password Form */}
        {!authSuccess && authMode === 'forgot' && (
          <>
            <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, letterSpacing: '0.1em', color: 'var(--ghost)', marginBottom: 14 }}>RESET PASSWORD</div>
            <label className="auth-field-label">Your Email</label>
            <input className="auth-input" type="email" autoComplete="username" value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailAuth(e)}
              placeholder="you@example.com" />
            {authError && <div className="auth-error">{authError}</div>}
            <button className="auth-submit-btn" onClick={handleEmailAuth}
              disabled={authLoading || !authEmail}>
              {authLoading ? 'SENDING…' : 'SEND RESET LINK'}
            </button>
            <button className="auth-forgot-link" style={{ marginTop: 12 }}
              onClick={() => { setAuthMode('signin'); setAuthError(null) }}>← Back to sign in</button>
          </>
        )}
      </div>
    </div>
  )
}

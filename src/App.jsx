import { useState, useRef, useEffect, useCallback } from 'react'

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
  height: 52px;
  background: var(--ink);
  border-bottom: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
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

.header-bell {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--ghost);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.header-bell svg {
  width: 20px;
  height: 20px;
}

.header-bell-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gold);
  border: 1.5px solid var(--ink);
}

/* ─── TAB BAR ────────────────────────────────────────────────────────────── */
.tab-bar {
  position: fixed;
  top: 52px;
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
  margin-top: 92px;
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
  top: 92px;
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
  margin-top: 92px;
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
  max-height: 90dvh;
  background: var(--card);
  border-radius: 20px 20px 0 0;
  z-index: 310;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.sheet::-webkit-scrollbar { display: none; }

.sheet.open {
  transform: translateX(-50%) translateY(0);
}

.sheet-handle-wrap {
  display: flex;
  justify-content: center;
  padding: 12px 0 6px;
  position: sticky;
  top: 0;
  background: var(--card);
  z-index: 1;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--worn);
}

.sheet-header {
  padding: 4px 20px 16px;
  border-bottom: 1px solid var(--rule);
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
  top: 60px;
  left: 50%;
  transform: translateX(-50%) translateY(-80px);
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
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.toast.show {
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
}

/* Other option input */
.other-input {
  margin-top: 8px;
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
  const [sightings, setSightings] = useState(INITIAL_SIGHTINGS)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [confirmed, setConfirmed] = useState(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [locating, setLocating] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [prefillStore, setPrefillStore] = useState('')

  // Post form state
  const [selectedBottles, setSelectedBottles] = useState([])
  const [storeName, setStoreName] = useState('')
  const [cityName, setCityName] = useState('')
  const [notes, setNotes] = useState('')
  const [useLocation, setUseLocation] = useState(true)
  const [otherBottle, setOtherBottle] = useState('')

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const leafletLoadedRef = useRef(false)
  const toastTimerRef = useRef(null)

  // ── Inject styles ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = STYLES
    document.head.appendChild(el)
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
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
            <button class="popup-btn" onclick="window.__dsOpenSheet('${s.id}','${s.store.replace(/'/g, "\\'")}')">
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
    window.__dsOpenSheet = (id, store) => {
      setPrefillStore(store)
      setStoreName(store)
      setSheetOpen(true)
    }
    return () => {
      delete window.__dsConfirm
      delete window.__dsOpenSheet
    }
  }, [])

  // ── Redraw markers on filter or sightings change ───────────────────────
  useEffect(() => {
    if (mapInstanceRef.current && leafletLoadedRef.current) {
      drawMarkers(sightings, activeFilter, mapInstanceRef.current, confirmed)
    }
  }, [activeFilter, sightings, confirmed, drawMarkers])

  // ── Filtered sightings for feed ────────────────────────────────────────
  const now = Date.now()
  const filteredSightings = sightings.filter(s => {
    const hoursOld = (now - s.createdAt) / (1000 * 60 * 60)
    if (hoursOld > 336) return false
    return filterMatches(s, activeFilter)
  })

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
  function handleConfirm(id) {
    setConfirmed(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  // ── Show toast ─────────────────────────────────────────────────────────
  function showToast() {
    setToastVisible(true)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2500)
  }

  // ── Toggle bottle selection ────────────────────────────────────────────
  function toggleBottle(bottle) {
    setSelectedBottles(prev =>
      prev.includes(bottle) ? prev.filter(b => b !== bottle) : [...prev, bottle]
    )
  }

  // ── Submit new sighting ────────────────────────────────────────────────
  function handlePost() {
    const bottleList = selectedBottles.includes('Other') && otherBottle.trim()
      ? [...selectedBottles.filter(b => b !== 'Other'), otherBottle.trim()]
      : selectedBottles

    if (!bottleList.length || !storeName.trim()) return

    const newSighting = {
      id: `new-${Date.now()}`,
      store: storeName.trim(),
      city: cityName.trim() || 'Unknown',
      state: 'NC',
      lat: 35.7796 + (Math.random() - 0.5) * 0.2,
      lng: -78.6382 + (Math.random() - 0.5) * 0.2,
      bottles: bottleList,
      reporter: 'you',
      hoursAgo: 0,
      createdAt: Date.now(),
      confirmations: 0,
      notes: notes.trim() || null,
      dist: '0.1',
    }

    setSightings(prev => [newSighting, ...prev])
    setSheetOpen(false)

    // Reset form
    setSelectedBottles([])
    setStoreName('')
    setCityName('')
    setNotes('')
    setOtherBottle('')
    setPrefillStore('')

    // Fly to new pin
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([newSighting.lat, newSighting.lng], 14)
      }
    }, 300)

    showToast()
  }

  // ── Open sheet ─────────────────────────────────────────────────────────
  function openSheet() {
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setPrefillStore('')
    if (!prefillStore) {
      setStoreName('')
    }
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
        <button className="header-bell" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="header-bell-dot" />
        </button>
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
      </nav>

      {/* ── MAP SECTION ─────────────────────────────────────────────── */}
      <section className="map-section" style={{ display: activeTab === 'scout' ? undefined : 'none' }}>
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

          {EVENTS.map(event => {
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
                    onClick={() => setRsvpd(prev => { const n = new Set(prev); n.has(event.id) ? n.delete(event.id) : n.add(event.id); return n })}
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

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <button className="fab" onClick={openSheet} aria-label="Post sighting">
        +
      </button>

      {/* ── BOTTOM SHEET ─────────────────────────────────────────────── */}
      <div className={`sheet-overlay${sheetOpen ? ' open' : ''}`} onClick={closeSheet} />
      <div className={`sheet${sheetOpen ? ' open' : ''}`}>
        <div className="sheet-handle-wrap">
          <div className="sheet-handle" />
        </div>
        <div className="sheet-header">
          <div className="sheet-title">POST A SIGHTING</div>
        </div>
        <div className="sheet-body">
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

          {/* Store Name */}
          <div className="field-group">
            <label className="field-label">STORE NAME</label>
            <input
              className="text-input"
              placeholder="Which store?"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
            />
          </div>

          {/* City */}
          <div className="field-group">
            <label className="field-label">CITY</label>
            <input
              className="text-input"
              placeholder="City"
              value={cityName}
              onChange={e => setCityName(e.target.value)}
            />
          </div>

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

          {/* Location toggle */}
          <div className={`location-toggle${useLocation ? ' on' : ''}`} onClick={() => setUseLocation(v => !v)}>
            <div className={`toggle-switch${useLocation ? ' on' : ''}`}>
              <div className="toggle-knob" />
            </div>
            <span className={`toggle-label${useLocation ? ' on' : ''}`}>
              {useLocation ? '📍 Using your current location' : 'USE MY LOCATION'}
            </span>
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
    </div>
  )
}

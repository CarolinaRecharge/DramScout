import { useEffect, useState } from 'react'
import { supabase } from '../../supabase.js'

const styles = `
  .dash-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 40px;
  }

  .dash-stat {
    background: var(--dark-3);
    border: 1px solid var(--bark);
    border-radius: 6px;
    padding: 24px;
  }

  .dash-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 900;
    color: var(--amber-light);
    line-height: 1;
    margin-bottom: 8px;
  }

  .dash-stat-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
  }

  .dash-section-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dash-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--bark), transparent);
  }

  .dash-active-card {
    background: var(--dark-3);
    border: 1px solid var(--amber);
    border-radius: 8px;
    padding: 28px;
    margin-bottom: 32px;
  }

  .dash-bottle-name {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 6px;
  }

  .dash-draw-date {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 1px;
    margin-bottom: 20px;
  }

  .dash-progress-bar-bg {
    height: 4px;
    background: var(--dark-4);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .dash-progress-bar-fill {
    height: 100%;
    background: var(--amber);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .dash-progress-label {
    font-size: 10px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
  }

  .dash-no-active {
    background: var(--dark-3);
    border: 1px dashed var(--bark);
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 1px;
    margin-bottom: 32px;
  }

  .dash-activity-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--dark-4);
    font-size: 11px;
  }

  .dash-ticket-num {
    color: var(--amber);
    font-weight: 500;
    min-width: 48px;
  }

  .dash-claimed-by {
    color: var(--cream-2);
    flex: 1;
    padding: 0 16px;
  }

  .dash-claimed-at {
    color: var(--muted);
    font-size: 10px;
  }

  .dash-empty-activity {
    padding: 24px 0;
    color: var(--muted);
    font-size: 11px;
    text-align: center;
  }

  .dash-loading {
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 2px;
    padding: 40px 0;
  }
`

export default function StoreDashboard({ storeProfile }) {
  const [activeProgram, setActiveProgram] = useState(null)
  const [stats, setStats] = useState({ totalEntries: 0, daysUntilDraw: null })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: programs } = await supabase
        .from('lottery_programs')
        .select('*')
        .in('status', ['active', 'upcoming'])
        .order('draw_date', { ascending: true })
        .limit(1)

      if (programs && programs.length > 0) {
        const prog = programs[0]
        setActiveProgram(prog)

        const { count } = await supabase
          .from('lottery_tokens')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', prog.id)
          .eq('status', 'claimed')

        const drawDate = new Date(prog.draw_date)
        const now = new Date()
        const daysLeft = Math.ceil((drawDate - now) / (1000 * 60 * 60 * 24))

        setStats({ totalEntries: count || 0, daysUntilDraw: daysLeft })

        const { data: recent } = await supabase
          .from('lottery_tokens')
          .select('ticket_number, claimed_at, claimed_by_phone, claimed_by_user_id')
          .eq('program_id', prog.id)
          .eq('status', 'claimed')
          .order('claimed_at', { ascending: false })
          .limit(10)

        setRecentActivity(recent || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  function formatTime(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) return <div className="dash-loading">LOADING...</div>

  return (
    <>
      <style>{styles}</style>

      <div className="dash-grid">
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.totalEntries}</div>
          <div className="dash-stat-label">Tickets Issued</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">
            {stats.daysUntilDraw !== null ? stats.daysUntilDraw : '—'}
          </div>
          <div className="dash-stat-label">Days Until Draw</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">
            {activeProgram?.draw_winner_count ?? '—'}
          </div>
          <div className="dash-stat-label">Winners Selected</div>
        </div>
      </div>

      <div className="dash-section-label">Active Lottery</div>
      {activeProgram ? (
        <div className="dash-active-card">
          <div className="dash-bottle-name">{activeProgram.bottle_name}</div>
          <div className="dash-draw-date">
            Drawing {formatDate(activeProgram.draw_date)} · {activeProgram.draw_winner_count} winner{activeProgram.draw_winner_count > 1 ? 's' : ''}
          </div>
          <div className="dash-progress-bar-bg">
            <div
              className="dash-progress-bar-fill"
              style={{ width: `${Math.max(5, Math.min(100, stats.totalEntries * 5))}%` }}
            />
          </div>
          <div className="dash-progress-label">
            <span>{stats.totalEntries} ticket{stats.totalEntries !== 1 ? 's' : ''} in pool</span>
            <span>{stats.daysUntilDraw}d remaining</span>
          </div>
        </div>
      ) : (
        <div className="dash-no-active">
          No active lottery — create one in the Lotteries tab
        </div>
      )}

      <div className="dash-section-label">Recent Scans</div>
      {recentActivity.length === 0 ? (
        <div className="dash-empty-activity">No tickets claimed yet</div>
      ) : (
        recentActivity.map((entry, i) => (
          <div key={entry.ticket_number ?? i} className="dash-activity-row">
            <span className="dash-ticket-num">#{entry.ticket_number}</span>
            <span className="dash-claimed-by">
              {entry.claimed_by_phone
                ? entry.claimed_by_phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
                : entry.claimed_by_user_id
                  ? 'Dram Scout user'
                  : 'Anonymous'}
            </span>
            <span className="dash-claimed-at">
              {formatTime(entry.claimed_at)}
            </span>
          </div>
        ))
      )}
    </>
  )
}

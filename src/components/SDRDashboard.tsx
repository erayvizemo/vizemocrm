import { useApp } from '../context/AppContext';
import { Customer, LEODESSA_STAGES, VIZEMO_STAGES, CALL_OUTCOMES, CallOutcome } from '../types';
import { getStatusColor } from '../utils/helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function today(): string {
  return new Date().toISOString().substring(0, 10);
}
function daysAgo(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}
function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return dateStr < today();
}
function isDueToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  return dateStr === today();
}
function isDueSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86_400_000;
  return diff >= 0 && diff <= 2;
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 32, fontFamily: "'Syne', sans-serif", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

// ─── Customer row for lists ───────────────────────────────────────────────────
function LeadRow({ c, badge }: { c: Customer; badge?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 16px',
      background: 'var(--bg-elevated)',
      borderRadius: 8,
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif" }}>
          {c.firstName} {c.lastName}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{c.telefon}</div>
      </div>
      <div style={{
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: '11px',
        fontWeight: 700,
        background: `${getStatusColor(c.durum)}18`,
        color: getStatusColor(c.durum),
        fontFamily: "'Syne', sans-serif",
        whiteSpace: 'nowrap',
      }}>
        {c.durum}
      </div>
      {badge}
    </div>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, color = 'var(--accent-primary)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontSize: '11px',
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color,
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SDRDashboard() {
  const { customers, users, currentUser } = useApp();

  const todayStr = today();

  // Visible customers filtered by current user role
  const visibleCustomers = currentUser?.role === 'sdr'
    ? customers.filter(c => c.assignedSdrId === currentUser.id)
    : customers;

  // ── Buckets ─────────────────────────────────────────────────────────────────
  const overdueFollowups = visibleCustomers.filter(c => isOverdue(c.nextFollowupDate) && !c.doNotContact);
  const todayFollowups   = visibleCustomers.filter(c => isDueToday(c.nextFollowupDate));
  const soonFollowups    = visibleCustomers.filter(c => isDueSoon(c.nextFollowupDate) && !isDueToday(c.nextFollowupDate));

  // 48h no activity
  const inactive48h = visibleCustomers.filter(c => {
    if (!c.lastActivityDate) return true;
    return daysAgo(c.lastActivityDate) >= 2;
  });

  // Unassigned leads (admin only)
  const unassigned = customers.filter(c => !c.assignedSdrId && LEODESSA_STAGES.includes(c.durum as any));

  // ── Pipeline stage counts ────────────────────────────────────────────────────
  const stageCounts: Record<string, number> = {};
  [...LEODESSA_STAGES, ...VIZEMO_STAGES].forEach(s => { stageCounts[s] = 0; });
  visibleCustomers.forEach(c => {
    if (stageCounts[c.durum] !== undefined) stageCounts[c.durum]++;
  });

  // ── Call outcome stats ───────────────────────────────────────────────────────
  const outcomeCounts: Record<string, number> = {};
  CALL_OUTCOMES.forEach(o => { outcomeCounts[o] = 0; });
  visibleCustomers.forEach(c => {
    (c.callLogs ?? []).forEach(log => {
      if (outcomeCounts[log.outcome] !== undefined) outcomeCounts[log.outcome]++;
    });
  });
  const totalCalls = Object.values(outcomeCounts).reduce((a, b) => a + b, 0);

  // ── Per-SDR stats (admin view) ────────────────────────────────────────────────
  const sdrs = users.filter(u => u.role === 'sdr');
  const sdrStats = sdrs.map(sdr => {
    const mine = customers.filter(c => c.assignedSdrId === sdr.id);
    const overdue = mine.filter(c => isOverdue(c.nextFollowupDate));
    const todayDue = mine.filter(c => isDueToday(c.nextFollowupDate));
    const calls = mine.reduce((sum, c) => sum + (c.callLogs?.length ?? 0), 0);
    return { sdr, total: mine.length, overdue: overdue.length, todayDue: todayDue.length, calls };
  });

  const isAdmin = currentUser?.role === 'leodessa_admin' || currentUser?.role === 'vizemo_admin';

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '28px', fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--text-primary)' }}>
          📊 SDR Dashboard
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: 6 }}>
          {currentUser ? `${currentUser.name} · ${todayStr}` : todayStr}
        </div>
      </div>

      {/* ── Top stats ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
        <StatCard icon="📋" label="Toplam Lead" value={visibleCustomers.length} color="var(--accent-primary)" />
        <StatCard icon="🔴" label="Gecikmiş Takip" value={overdueFollowups.length} color="var(--accent-rose)" />
        <StatCard icon="📅" label="Bugün Takip" value={todayFollowups.length} color="var(--accent-amber)" />
        <StatCard icon="⏳" label="Yaklaşan (2 gün)" value={soonFollowups.length} color="var(--accent-cyan)" />
        <StatCard icon="💤" label="48 Saat İnaktif" value={inactive48h.length} color="#a855f7" />
        <StatCard icon="📞" label="Toplam Arama" value={totalCalls} color="var(--accent-emerald)" />
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>

        {/* Overdue follow-ups */}
        <div>
          <SectionTitle color="var(--accent-rose)">🔴 Gecikmiş Takipler ({overdueFollowups.length})</SectionTitle>
          {overdueFollowups.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>Gecikmiş takip yok 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {overdueFollowups.map(c => (
                <LeadRow key={c.id} c={c} badge={
                  <div style={{ fontSize: '11px', background: 'rgba(244,63,94,0.12)', color: 'var(--accent-rose)', borderRadius: 6, padding: '3px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {c.nextFollowupDate}
                  </div>
                } />
              ))}
            </div>
          )}
        </div>

        {/* Today's follow-ups */}
        <div>
          <SectionTitle color="var(--accent-amber)">📅 Bugün Aranacaklar ({todayFollowups.length})</SectionTitle>
          {todayFollowups.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>Bugün için takip yok.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {todayFollowups.map(c => (
                <LeadRow key={c.id} c={c} badge={
                  <div style={{ fontSize: '11px', background: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>
                    Bugün
                  </div>
                } />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 48h inactive ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle color="#a855f7">💤 48 Saattir Aktivite Yok ({inactive48h.length})</SectionTitle>
        {inactive48h.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>Tüm leadler aktif.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
            {inactive48h.slice(0, 12).map(c => (
              <LeadRow key={c.id} c={c} badge={
                <div style={{ fontSize: '11px', background: 'rgba(168,85,247,0.12)', color: '#a855f7', borderRadius: 6, padding: '3px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {c.lastActivityDate ? `${daysAgo(c.lastActivityDate)}g önce` : 'Hiç yok'}
                </div>
              } />
            ))}
          </div>
        )}
      </div>

      {/* ── Pipeline stage counts ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle color="var(--accent-primary)">📊 Pipeline Dağılımı</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {/* LeoDessa stages */}
          <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: '#a855f7', fontWeight: 700, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            ✈ LeoDessa Aşamaları
          </div>
          {LEODESSA_STAGES.map(s => (
            <div key={s} style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${getStatusColor(s)}30`,
              borderLeft: `3px solid ${getStatusColor(s)}`,
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{s}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: getStatusColor(s), fontFamily: "'Syne', sans-serif" }}>{stageCounts[s]}</div>
            </div>
          ))}
          {/* Vizemo stages */}
          <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8, marginBottom: 4 }}>
            🏢 Vizemo Aşamaları
          </div>
          {VIZEMO_STAGES.map(s => (
            <div key={s} style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${getStatusColor(s)}30`,
              borderLeft: `3px solid ${getStatusColor(s)}`,
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{s}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: getStatusColor(s), fontFamily: "'Syne', sans-serif" }}>{stageCounts[s]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Call outcome stats ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle color="var(--accent-emerald)">📞 Arama Sonuçları (toplam: {totalCalls})</SectionTitle>
        {totalCalls === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>Henüz arama kaydı yok.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {CALL_OUTCOMES.map(o => {
              const count = outcomeCounts[o] ?? 0;
              const pct = totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0;
              const barColor = o.startsWith('Ulaşıldı') ? 'var(--accent-emerald)'
                : o.startsWith('Ulaşılamadı') ? 'var(--accent-rose)'
                : o === 'Numara Yanlış' ? '#94a3b8'
                : 'var(--accent-amber)';
              return (
                <div key={o} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{o}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: barColor, fontFamily: "'Syne', sans-serif" }}>{count}</div>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-void)' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: barColor, width: `${pct}%`, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Per-SDR breakdown (admin only) ───────────────────────────────────────── */}
      {isAdmin && (
        <div style={{ marginBottom: 40 }}>
          <SectionTitle color="var(--accent-primary)">👤 SDR Performans Özeti</SectionTitle>
          {/* Unassigned alert */}
          {unassigned.length > 0 && (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 10,
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ fontSize: '14px', color: 'var(--accent-amber)', fontWeight: 600 }}>
                {unassigned.length} lead henüz bir SDR&apos;a atanmadı.
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {sdrStats.map(({ sdr, total, overdue, todayDue, calls }) => (
              <div key={sdr.id} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '20px',
              }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: 16 }}>
                  👤 {sdr.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Atanmış Lead', value: total, color: 'var(--accent-primary)' },
                    { label: 'Bugün Takip', value: todayDue, color: 'var(--accent-amber)' },
                    { label: 'Gecikmiş', value: overdue, color: 'var(--accent-rose)' },
                    { label: 'Toplam Arama', value: calls, color: 'var(--accent-emerald)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{row.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: row.value > 0 ? row.color : 'var(--text-muted)', fontFamily: "'Syne', sans-serif" }}>{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

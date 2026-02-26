import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeodessaLead } from '../types';

const LEODESSA_COLOR = '#a855f7';

function getTemperatureColor(temp: string): string {
  if (temp.includes('Çok Sıcak') || temp.includes('Sıcak')) return '#22c55e';
  if (temp.includes('Ilık')) return '#f59e0b';
  if (temp.includes('Soğuk')) return '#ef4444';
  if (temp.includes('Diskalifiye')) return '#ef4444';
  return '#64748b';
}

export default function LeodessaLeads() {
  const { leodessaLeads, deleteLeodessaLead, updateLeodessaLead, addCustomer, showToast } = useApp();
  const [filterService, setFilterService] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeodessaLead | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filtered = leodessaLeads.filter(l => {
    if (filterService && l.service !== filterService) return false;
    if (filterStatus === 'disq' && !l.isDisqualified) return false;
    if (filterStatus === 'hot' && (l.isDisqualified || l.score < 45)) return false;
    if (filterStatus === 'warm' && (l.isDisqualified || l.score < 25 || l.score >= 45)) return false;
    if (filterStatus === 'cold' && (l.isDisqualified || l.score >= 25)) return false;
    if (filterStatus === 'transferred' && !l.crmTransferred) return false;
    return true;
  });

  const stats = {
    total: leodessaLeads.length,
    hot: leodessaLeads.filter(l => !l.isDisqualified && l.score >= 45).length,
    warm: leodessaLeads.filter(l => !l.isDisqualified && l.score >= 25 && l.score < 45).length,
    disq: leodessaLeads.filter(l => l.isDisqualified).length,
    transferred: leodessaLeads.filter(l => l.crmTransferred).length,
  };

  function handleCrmTransfer(lead: LeodessaLead) {
    const durum = (!lead.isDisqualified && lead.score >= 45)
      ? 'Beklemede'
      : 'Yeni Lead';

    addCustomer({
      ad: lead.ad,
      telefon: lead.telefon,
      email: lead.email,
      vize: lead.serviceName,
      durum,
      gorusme: '',
      takip: '',
      surec: '',
      karar: '',
      not: lead.summaryText.substring(0, 500),
      log: [],
      sehir: '',
      danisman: '',
      kaynak: 'Leodessa Lead',
    });

    updateLeodessaLead(lead.id, { crmTransferred: true, status: 'transferred' });
    showToast(`${lead.ad} CRM'e aktarıldı.`, 'success');
  }

  function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 100,
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>{label}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: LEODESSA_COLOR }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: LEODESSA_COLOR }}>Leodessa New Leads</h2>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 20 }}>
          Leodessa sisteminden aktarılan lead kayıtları
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <StatCard label="Toplam Lead" value={stats.total} color={LEODESSA_COLOR} />
        <StatCard label="Sıcak Lead" value={stats.hot} color="#22c55e" />
        <StatCard label="Ilık Lead" value={stats.warm} color="#f59e0b" />
        <StatCard label="Diskalifiye" value={stats.disq} color="#ef4444" />
        <StatCard label="CRM'e Aktarılan" value={stats.transferred} color="#4f8ef7" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterService}
          onChange={e => setFilterService(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: filterService ? LEODESSA_COLOR : 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">Tüm Hizmetler</option>
          <option value="schengen">🇪🇺 Schengen</option>
          <option value="ispanya">🏖️ İspanya Oturum</option>
          <option value="ingiltere">🇬🇧 İngiltere</option>
          <option value="amerika">🇺🇸 Amerika</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: filterStatus ? LEODESSA_COLOR : 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">Tüm Durumlar</option>
          <option value="hot">🔥 Sıcak Lead</option>
          <option value="warm">🌡️ Ilık Lead</option>
          <option value="cold">❄️ Soğuk Lead</option>
          <option value="disq">❌ Diskalifiye</option>
          <option value="transferred">✅ CRM'e Aktarılan</option>
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center', fontFamily: "'IBM Plex Mono', monospace" }}>
          {filtered.length} sonuç
        </span>
      </div>

      {/* Empty state */}
      {leodessaLeads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>Henüz lead yok</div>
          <div style={{ fontSize: '0.82rem' }}>Leodessa Lead Tracking sayfasından görüşme yapın ve lead aktarın.</div>
        </div>
      )}

      {/* Lead cards */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(lead => {
            const tempColor = getTemperatureColor(lead.temperature);
            return (
              <div
                key={lead.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 18px',
                  borderLeft: `3px solid ${lead.crmTransferred ? '#4f8ef7' : tempColor}`,
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `${LEODESSA_COLOR}20`, border: `1px solid ${LEODESSA_COLOR}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700, color: LEODESSA_COLOR,
                  }}>
                    {lead.ad.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + info */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{lead.ad}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>{lead.telefon}</div>
                  </div>

                  {/* Service badge */}
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem',
                    background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
                    color: LEODESSA_COLOR, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap',
                  }}>
                    {lead.serviceIcon} {lead.serviceName}
                  </span>

                  {/* Score */}
                  <div style={{ textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: tempColor, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>
                      {lead.isDisqualified ? '✗' : lead.score}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>puan</div>
                  </div>

                  {/* Temperature */}
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem',
                    background: `${tempColor}12`, border: `1px solid ${tempColor}33`,
                    color: tempColor, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap', fontWeight: 600,
                  }}>
                    {lead.temperature}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                    {lead.createdAt}
                  </span>

                  {/* CRM transferred badge */}
                  {lead.crmTransferred && (
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)', color: '#4f8ef7', fontFamily: "'IBM Plex Mono', monospace" }}>
                      ✅ CRM'de
                    </span>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    <button
                      onClick={() => { setSelectedLead(lead); setShowDetail(true); }}
                      style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      📋 Detay
                    </button>
                    {!lead.crmTransferred && !lead.isDisqualified && (
                      <button
                        onClick={() => handleCrmTransfer(lead)}
                        style={{ padding: '6px 12px', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.35)', borderRadius: 7, color: '#4f8ef7', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        CRM'e Aktar
                      </button>
                    )}
                    <button
                      onClick={() => deleteLeodessaLead(lead.id)}
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                      title="Sil"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {showDetail && selectedLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 580, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', flex: 1 }}>
                {selectedLead.serviceIcon} {selectedLead.ad} — {selectedLead.serviceName}
              </div>
              <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', background: `${getTemperatureColor(selectedLead.temperature)}12`, border: `1px solid ${getTemperatureColor(selectedLead.temperature)}33`, color: getTemperatureColor(selectedLead.temperature), fontFamily: "'IBM Plex Mono', monospace" }}>
                {selectedLead.isDisqualified ? '✗' : selectedLead.score} puan — {selectedLead.temperature}
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: LEODESSA_COLOR, fontFamily: "'IBM Plex Mono', monospace" }}>
                📅 {selectedLead.createdAt}
              </span>
              {selectedLead.email && (
                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  ✉ {selectedLead.email}
                </span>
              )}
            </div>

            {/* Summary text */}
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Görüşme Özeti</div>
              <pre style={{ fontSize: '0.78rem', color: 'var(--text)', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, margin: 0 }}>
                {selectedLead.summaryText}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowDetail(false)} style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem' }}>
                Kapat
              </button>
              {!selectedLead.crmTransferred && !selectedLead.isDisqualified && (
                <button
                  onClick={() => { handleCrmTransfer(selectedLead); setShowDetail(false); }}
                  style={{ flex: 2, padding: '9px', background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.4)', borderRadius: 8, color: '#4f8ef7', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  CRM'e Aktar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

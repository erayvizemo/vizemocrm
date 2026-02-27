import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeodessaLead } from '../types';

const LEODESSA_COLOR = 'var(--accent-secondary)';

function getTemperatureColor(temp: string): string {
  if (temp.includes('Çok Sıcak') || temp.includes('Sıcak')) return 'var(--accent-emerald)';
  if (temp.includes('Ilık')) return 'var(--accent-amber)';
  if (temp.includes('Soğuk')) return 'var(--accent-rose)';
  if (temp.includes('Diskalifiye')) return 'var(--accent-rose)';
  return 'var(--text-secondary)';
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
      firstName: lead.firstName,
      lastName: lead.lastName,
      telefon: lead.telefon,
      email: lead.email || '',
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
      statu: '',
      kaynak: 'Leodessa Lead',
      evrakPct: '',
      ulke: ''
    });

    updateLeodessaLead(lead.id, { crmTransferred: true, status: 'transferred' });
    showToast(`${lead.firstName + ' ' + lead.lastName} CRM'e aktarıldı.`, 'success');
  }

  function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
      <div className="chart-card" style={{ padding: '20px', flex: 1, minWidth: 140, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, borderRadius: '50%' }} />
        <div style={{ fontSize: '32px', fontWeight: 800, color, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 8, fontWeight: 700 }}>{label}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '64px 32px 32px', minHeight: '100vh', background: 'var(--bg-void)' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: LEODESSA_COLOR, boxShadow: `0 0 12px ${LEODESSA_COLOR}` }} />
          <h1 style={{ fontSize: '28px', color: LEODESSA_COLOR }}>Ayşe & Ortakları Akıllı Lead Havuzu</h1>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
          Ayşe & Ortakları yapay zeka aracından gelen lead adayları
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Toplam Lead Yoklaması" value={stats.total} color={LEODESSA_COLOR} />
        <StatCard label="Sıcak Lead" value={stats.hot} color="var(--accent-emerald)" />
        <StatCard label="Ilık Lead" value={stats.warm} color="var(--accent-amber)" />
        <StatCard label="Diskalifiye" value={stats.disq} color="var(--accent-rose)" />
        <StatCard label="CRM'e Aktarılan" value={stats.transferred} color="var(--accent-primary)" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="form-input"
          value={filterService}
          onChange={e => setFilterService(e.target.value)}
          style={{ width: 'auto', minWidth: 200, color: filterService ? LEODESSA_COLOR : 'var(--text-secondary)' }}
        >
          <option value="">Tüm Hizmetler</option>
          <option value="schengen">🇪🇺 Schengen</option>
          <option value="ispanya">🏖️ İspanya Oturum</option>
          <option value="ingiltere">🇬🇧 İngiltere</option>
          <option value="amerika">🇺🇸 Amerika</option>
        </select>
        <select
          className="form-input"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ width: 'auto', minWidth: 200, color: filterStatus ? LEODESSA_COLOR : 'var(--text-secondary)' }}
        >
          <option value="">Tüm Durumlar</option>
          <option value="hot">🔥 Sıcak Lead</option>
          <option value="warm">🌡️ Ilık Lead</option>
          <option value="cold">❄️ Soğuk Lead</option>
          <option value="disq">❌ Diskalifiye</option>
          <option value="transferred">✅ CRM'e Aktarılan</option>
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {filtered.length} sonuç bulundu
        </span>
      </div>

      {/* Empty state */}
      {leodessaLeads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: '18px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Havuz Boş</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Leodessa asistanı üzerinden yapılan görüşmeler buraya düşecek.</div>
        </div>
      )}

      {/* Lead cards */}
      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map(lead => {
            const tempColor = getTemperatureColor(lead.temperature);
            return (
              <div
                key={lead.id}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 16, padding: '20px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = lead.crmTransferred ? 'var(--accent-primary)' : tempColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: lead.crmTransferred ? 'var(--accent-primary)' : tempColor }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, paddingLeft: 8 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', fontWeight: 800, color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif"
                    }}>
                      {lead.firstName + ' ' + lead.lastName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif" }}>{lead.firstName + ' ' + lead.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>{lead.telefon}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: tempColor, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
                      {lead.isDisqualified ? '✗' : lead.score}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4, fontWeight: 700 }}>puan</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 8, marginBottom: 20 }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '11px', fontWeight: 600,
                    background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                    color: LEODESSA_COLOR, whiteSpace: 'nowrap',
                  }}>
                    {lead.serviceIcon} {lead.serviceName}
                  </span>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '11px', fontWeight: 600,
                    background: lead.crmTransferred ? 'rgba(99, 102, 241, 0.1)' : `${tempColor}15`,
                    border: `1px solid ${lead.crmTransferred ? 'rgba(99, 102, 241, 0.2)' : `${tempColor}30`}`,
                    color: lead.crmTransferred ? 'var(--accent-primary)' : tempColor, whiteSpace: 'nowrap',
                  }}>
                    {lead.crmTransferred ? '✅ CRM\'e Aktarıldı' : lead.temperature}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    {lead.createdAt}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, paddingLeft: 8 }}>
                  <button
                    onClick={() => { setSelectedLead(lead); setShowDetail(true); }}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px 0', fontSize: '12px' }}
                  >
                    Detayı Gör
                  </button>
                  {!lead.crmTransferred && !lead.isDisqualified && (
                    <button
                      onClick={() => handleCrmTransfer(lead)}
                      className="btn-primary"
                      style={{ flex: 1, padding: '8px 0', fontSize: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', boxShadow: 'none' }}
                    >
                      CRM'e Aktar
                    </button>
                  )}
                  <button
                    onClick={() => deleteLeodessaLead(lead.id)}
                    className="btn-secondary"
                    style={{ padding: '8px 12px', borderColor: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}
                    title="Sil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {showDetail && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" style={{ width: 620, maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>
                  {selectedLead.firstName + ' ' + selectedLead.lastName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {selectedLead.serviceIcon} {selectedLead.serviceName}
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Kapat
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: '12px', fontWeight: 600, background: `${getTemperatureColor(selectedLead.temperature)}15`, border: `1px solid ${getTemperatureColor(selectedLead.temperature)}30`, color: getTemperatureColor(selectedLead.temperature) }}>
                {selectedLead.isDisqualified ? '✗' : selectedLead.score} Puan — {selectedLead.temperature}
              </span>
              <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: '12px', fontWeight: 600, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: LEODESSA_COLOR }}>
                📅 {selectedLead.createdAt}
              </span>
              {selectedLead.email && (
                <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  ✉ {selectedLead.email}
                </span>
              )}
            </div>

            {/* AI Summary text */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '20px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: LEODESSA_COLOR }} />
                <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Yapay Zeka Görüşme Özeti
                </div>
              </div>
              <pre style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>
                {selectedLead.summaryText}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
              <button
                className="btn-secondary"
                onClick={() => setShowDetail(false)}
                style={{ minWidth: 100 }}
              >
                İptal
              </button>
              {!selectedLead.crmTransferred && !selectedLead.isDisqualified && (
                <button
                  className="btn-primary"
                  onClick={() => { handleCrmTransfer(selectedLead); setShowDetail(false); }}
                  style={{ minWidth: 160 }}
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

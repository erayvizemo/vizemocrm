import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusType, VIZEMO_STAGES } from '../types';
import { getVizeClass } from '../utils/helpers';
import { generateId } from '../utils/helpers';

// ── Her aşama için renk ve ikon haritası ──
const STAGE_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    'Yeni Lead': { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', icon: '🔵' },
    'Ulaşıldı': { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', icon: '✅' },
    'Ulaşılamadı': { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '📵' },
    'Unqualify Lead': { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: '❌' },
    'Belgeler İstendi': { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.25)', icon: '📄' },
    'Başvurular Yapıldı': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', icon: '📋' },
    'Randevu Alındı': { color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)', icon: '📅' },
    'Ödeme Alındı': { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', icon: '💰' },
    'Vize Alındı ✓': { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', icon: '🎉' },
    'Tekrar Aranacak': { color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', icon: '📞' },
    // Legacy
    'Beklemede': { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', icon: '🟡' },
    'Tamamlandı': { color: '#10b981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', icon: '🟢' },
    'Olumsuz': { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', icon: '🔴' },
    'Müşteriden Geri Dönüş Bekleniyor': { color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', icon: '⏳' },
};

const VIZEMO_COLOR = '#3b82f6';

export default function VizemoPipeline() {
    const { customers, openModal, updateCustomer, currentUser } = useApp();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [filterSdr, setFilterSdr] = useState('');
    const [filterVize, setFilterVize] = useState('');

    // Sadece Vizemo pipeline'a ait datalar (leodessa hariç)
    const activeCustomers = customers.filter(c => c.pipelineType !== 'leodessa');

    // Tüm Vizemo aşamaları
    const allStages: StatusType[] = [...VIZEMO_STAGES];

    // Filtreleme
    const filteredCustomers = activeCustomers.filter(c => {
        if (filterSdr && c.danisman !== filterSdr && c.assignedSdrId !== filterSdr) return false;
        if (filterVize && c.vize !== filterVize) return false;
        return true;
    });

    // Sürükle-bırak ile aşama değiştir
    function handleDrop(stage: StatusType) {
        if (!draggedId) return;
        const c = customers.find(x => x.id === draggedId);
        if (!c || c.durum === stage) { setDraggedId(null); setDragOverStage(null); return; }
        const now = new Date();
        const nowStr = now.toLocaleString('tr-TR');
        const stageEntry = {
            id: generateId(),
            fromStage: c.durum,
            toStage: stage,
            changedBy: currentUser?.id ?? 'system',
            changedAt: now.toISOString(),
        };
        updateCustomer(draggedId, {
            durum: stage,
            lastActivityDate: now.toISOString(),
            stageHistory: [...(c.stageHistory ?? []), stageEntry],
            log: [...c.log, { timestamp: nowStr, text: `Aşama değişti: ${c.durum} → ${stage}` }],
        });
        setDraggedId(null);
        setDragOverStage(null);
    }

    function moveCustomer(id: string, newStatus: StatusType, e: React.MouseEvent) {
        e.stopPropagation();
        const c = customers.find(x => x.id === id);
        if (!c) return;
        const now = new Date();
        const nowStr = now.toLocaleString('tr-TR');
        const stageEntry = {
            id: generateId(),
            fromStage: c.durum,
            toStage: newStatus,
            changedBy: currentUser?.id ?? 'system',
            changedAt: now.toISOString(),
        };
        updateCustomer(id, {
            durum: newStatus,
            lastActivityDate: now.toISOString(),
            stageHistory: [...(c.stageHistory ?? []), stageEntry],
            log: [...c.log, { timestamp: nowStr, text: `Aşama değişti: ${c.durum} → ${newStatus}` }],
        });
    }

    // Filtre seçenekleri
    const danismanList = [...new Set(activeCustomers.map(c => c.danisman).filter(Boolean))] as string[];
    const vizeList = [...new Set(activeCustomers.map(c => c.vize).filter(Boolean))] as string[];

    const totalCustomers = filteredCustomers.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-void)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
                            Vizemo Pipeline
                        </h1>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 4 }}>
                            {totalCustomers} müşteri · Aşamalar arası taşımak için sürükleyin veya butonları kullanın
                        </div>
                    </div>

                    {/* Filtreler */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <select
                            value={filterSdr}
                            onChange={e => setFilterSdr(e.target.value)}
                            style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}
                        >
                            <option value="">Tüm Danışmanlar</option>
                            {danismanList.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <select
                            value={filterVize}
                            onChange={e => setFilterVize(e.target.value)}
                            style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}
                        >
                            <option value="">Tüm Vize Türleri</option>
                            {vizeList.map(v => <option key={v}>{v}</option>)}
                        </select>
                    </div>
                </div>

                {/* Section label */}
                <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: '11px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: VIZEMO_COLOR }} />
                        <span style={{ color: VIZEMO_COLOR }}>🏢 Vizemo Aşamaları</span>
                    </div>
                </div>
            </div>

            {/* Kanban Board — Horizontal Scroll */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '20px 24px' }}>
                <div style={{
                    display: 'flex',
                    gap: 14,
                    height: '100%',
                    alignItems: 'flex-start',
                    minWidth: 'max-content',
                }}>
                    {allStages.map((stage) => {
                        const meta = STAGE_META[stage] ?? STAGE_META['Yeni Lead'];
                        const colCustomers = filteredCustomers.filter(c => c.durum === stage);
                        const isDragOver = dragOverStage === stage;
                        const stageNum = allStages.indexOf(stage) + 1;

                        return (
                            <div
                                key={stage}
                                style={{
                                    width: 240,
                                    minWidth: 240,
                                    height: '100%',
                                    background: isDragOver ? `${meta.bg}` : 'var(--bg-surface)',
                                    border: `1px solid ${isDragOver ? meta.border : 'var(--border-subtle)'}`,
                                    borderRadius: 14,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    transition: 'all 0.15s',
                                    boxShadow: isDragOver ? `0 0 0 2px ${meta.color}40` : 'none',
                                }}
                                onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                                onDragLeave={() => setDragOverStage(null)}
                                onDrop={() => handleDrop(stage)}
                            >
                                {/* Sütun başlığı */}
                                <div style={{
                                    padding: '14px 14px 10px',
                                    borderBottom: `2px solid ${meta.color}30`,
                                    background: `${meta.bg}`,
                                    flexShrink: 0,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: '14px' }}>{meta.icon}</span>
                                            <span style={{
                                                fontSize: '10px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                                                textTransform: 'uppercase', letterSpacing: '0.06em', color: VIZEMO_COLOR,
                                            }}>
                                                🏢 Vizemo
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                                            padding: '2px 8px', borderRadius: 20,
                                            background: `${meta.color}20`, color: meta.color,
                                        }}>
                                            {colCustomers.length}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: meta.color, lineHeight: 1.3 }}>
                                        {stageNum}. {stage}
                                    </div>
                                </div>

                                {/* Kartlar */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {colCustomers.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '20px 8px', opacity: 0.6 }}>
                                            Boş
                                        </div>
                                    ) : (
                                        colCustomers.map(c => {
                                            const isDragging = draggedId === c.id;
                                            const hasFollowup = c.nextFollowupDate && new Date(c.nextFollowupDate) <= new Date();
                                            return (
                                                <div
                                                    key={c.id}
                                                    draggable
                                                    onDragStart={() => setDraggedId(c.id)}
                                                    onDragEnd={() => { setDraggedId(null); setDragOverStage(null); }}
                                                    onClick={() => openModal(c.id)}
                                                    style={{
                                                        background: 'var(--bg-card)',
                                                        border: `1px solid ${hasFollowup ? 'rgba(245,158,11,0.4)' : 'var(--border-subtle)'}`,
                                                        borderRadius: 10,
                                                        padding: '10px 12px',
                                                        cursor: 'pointer',
                                                        opacity: isDragging ? 0.4 : 1,
                                                        transition: 'all 0.15s',
                                                        userSelect: 'none',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color + '80'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = hasFollowup ? 'rgba(245,158,11,0.4)' : 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
                                                >
                                                    {/* doNotContact badge */}
                                                    {c.doNotContact && (
                                                        <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>
                                                            🚫 İletişime Geçme
                                                        </div>
                                                    )}

                                                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: 4 }}>
                                                        {c.firstName} {c.lastName}
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                                        {c.vize && (
                                                            <span className={`vize-badge ${getVizeClass(c.vize)}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                                                {c.vize}
                                                            </span>
                                                        )}
                                                        {c.sehir && (
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>📍 {c.sehir}</span>
                                                        )}
                                                        {c.danisman && (
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.danisman}</span>
                                                        )}
                                                    </div>

                                                    {c.telefon && (
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                                                            {c.telefon}
                                                        </div>
                                                    )}

                                                    {/* Statu badge */}
                                                    {c.statu && (
                                                        <div style={{ fontSize: '10px', color: 'var(--accent-amber)', fontWeight: 600, marginBottom: 4 }}>
                                                            ⚡ {c.statu}
                                                        </div>
                                                    )}

                                                    {/* Follow-up */}
                                                    {c.nextFollowupDate && (
                                                        <div style={{ fontSize: '10px', color: hasFollowup ? '#f59e0b' : 'var(--text-muted)', marginBottom: 4, fontWeight: hasFollowup ? 700 : 400 }}>
                                                            {hasFollowup ? '⚠️ Takip Gecikmiş!' : `📅 ${c.nextFollowupDate}`}
                                                        </div>
                                                    )}

                                                    {/* Not önizleme */}
                                                    {c.not && (
                                                        <div style={{
                                                            fontSize: '10px', color: 'var(--text-muted)', marginBottom: 6,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            maxWidth: '100%', fontStyle: 'italic',
                                                        }}>
                                                            {c.not}
                                                        </div>
                                                    )}

                                                    {/* Komşu aşama hızlı butonlar */}
                                                    {(() => {
                                                        const stageIdx = allStages.indexOf(stage);
                                                        const quickBtns: { s: StatusType; dir: 'prev' | 'next' }[] = [];
                                                        if (stageIdx > 0) quickBtns.push({ s: allStages[stageIdx - 1], dir: 'prev' });
                                                        if (stageIdx < allStages.length - 1) quickBtns.push({ s: allStages[stageIdx + 1], dir: 'next' });
                                                        if (stageIdx < allStages.length - 2) quickBtns.push({ s: allStages[stageIdx + 2], dir: 'next' });
                                                        return (
                                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                                                                {quickBtns.map(({ s, dir }) => {
                                                                    const sm = STAGE_META[s] ?? STAGE_META['Yeni Lead'];
                                                                    return (
                                                                        <button
                                                                            key={s}
                                                                            onClick={(e) => moveCustomer(c.id, s, e)}
                                                                            style={{
                                                                                fontSize: '9px', padding: '2px 6px', borderRadius: 4,
                                                                                border: `1px solid ${sm.color}40`,
                                                                                background: 'transparent',
                                                                                color: sm.color,
                                                                                cursor: 'pointer', fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {dir === 'prev' ? '← ' : '→ '}{s.length > 14 ? s.substring(0, 14) + '…' : s}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Video } from 'lucide-react';
import { teamRecordingsAPI } from '../teamRecordingAPI';
import { teamTasksAPI } from '../teamAPI';
import { getCached, setCached, invalidate } from '../teamCache';
import { useRecorder } from '../recording/RecorderContext';
import { baseFont, monoFont, serifFont } from '../theme';
import { PageHeader, SolidButton } from '../components/Primitives';
import MemberFilterDropdown from '../components/MemberFilterDropdown';
import RecordingCard from '../recording/RecordingCard';
import { recFmtDur } from '../recording/recHelpers';

// Library view — "My recordings" / "Team recordings" tabs, filters, search, card grid.
// Reads from cache on mount and refetches in background (same pattern as the other team views).

export default function RecordingsView({ palette, isDark, isAdmin, currentUserId, onOpenRec }) {
  const recorder = useRecorder();

  // Seed all three scopes from cache so tab-switch is instant.
  const [mine, setMine] = useState(() => getCached('recordings:mine')?.recordings || []);
  const [team, setTeam] = useState(() => getCached('recordings:team')?.recordings || []);
  const [shared, setShared] = useState(() => getCached('recordings:shared')?.recordings || []);
  const [tab, setTab] = useState('mine');           // 'mine' | 'team'
  const [filter, setFilter] = useState('all');      // 'all' | 'shared'
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState([]); // selected ownerIds for the team tab
  const [taskMap, setTaskMap] = useState({});

  // Seed each recording's detail cache from a list response. The watch page reads from
  // `recordings:detail:<id>` first, so writing it here means opening any card is instant.
  const seedDetailCache = (records) => {
    for (const r of records || []) {
      const existing = getCached(`recordings:detail:${r.id}`);
      // Only overwrite if the list version is newer OR no detail is cached yet.
      // (list and detail share the same shape via shapePublic on the server.)
      if (!existing || new Date(r.updatedAt) >= new Date(existing.updatedAt || 0)) {
        setCached(`recordings:detail:${r.id}`, r);
      }
    }
  };

  // ----- fetchers -----
  const fetchMine = async () => {
    const { data } = await teamRecordingsAPI.list('mine');
    if (data?.success) {
      setMine(data.recordings || []);
      setCached('recordings:mine', data);
      seedDetailCache(data.recordings);
    }
  };
  const fetchTeam = async () => {
    const { data } = await teamRecordingsAPI.list('team');
    if (data?.success) {
      setTeam(data.recordings || []);
      setCached('recordings:team', data);
      seedDetailCache(data.recordings);
    }
  };
  const fetchShared = async () => {
    const { data } = await teamRecordingsAPI.list('shared');
    if (data?.success) {
      setShared(data.recordings || []);
      setCached('recordings:shared', data);
      seedDetailCache(data.recordings);
    }
  };

  useEffect(() => {
    // Always refresh the current scope on mount + when tab/filter changes; cache stays warm meanwhile.
    fetchMine();
    fetchShared();
    if (isAdmin) fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Lightweight task title map (for the chip on each card). Reads from the tasks cache if it's been warmed.
  useEffect(() => {
    const cached = getCached('tasks:list');
    if (cached?.tasks) {
      setTaskMap(Object.fromEntries(cached.tasks.map((t) => [String(t._id), t.title])));
      return;
    }
    teamTasksAPI.list().then(({ data }) => {
      if (data?.success) {
        setTaskMap(Object.fromEntries((data.tasks || []).map((t) => [String(t._id), t.title])));
        setCached('tasks:list', data);
      }
    }).catch(() => {});
  }, []);

  // When a new recording is saved by the recorder, refresh the lists so the new row appears immediately.
  useEffect(() => recorder.onComplete?.(() => { fetchMine(); if (isAdmin) fetchTeam(); }), [recorder, isAdmin]);

  const filteredList = useMemo(() => {
    let list;
    if (tab === 'team') list = team;
    else list = filter === 'shared' ? shared : mine;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (tab === 'team' && ownerFilter.length > 0) {
      const allow = new Set(ownerFilter.map(String));
      list = list.filter((r) => allow.has(String(r.ownerId)));
    }
    return list;
  }, [tab, filter, search, ownerFilter, mine, team, shared]);

  const myTotalDur = mine.reduce((a, r) => a + r.durationSec, 0);
  const teamTotalDur = team.reduce((a, r) => a + r.durationSec, 0);

  // Unique owners on the team tab — used by the "Recorded by" filter dropdown.
  const teamOwners = useMemo(() => {
    const map = new Map();
    for (const r of team) {
      if (!map.has(String(r.ownerId))) {
        const initials = r.ownerAvatar
          || (r.ownerName ? r.ownerName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : '?');
        map.set(String(r.ownerId), { _id: r.ownerId, name: r.ownerName || 'Someone', avatar: initials });
      }
    }
    return Array.from(map.values());
  }, [team]);
  const ownerCounts = useMemo(() => team.reduce((a, r) => {
    const k = String(r.ownerId);
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {}), [team]);

  const handleCopyLink = (shareId) => {
    const link = `${window.location.origin}/v/${shareId}`;
    try { navigator.clipboard.writeText(link); } catch (e) {}
  };
  const handleStar = async (rec) => {
    try {
      await teamRecordingsAPI.update(rec.id, { starred: !rec.starred });
      invalidate('recordings:*');
      fetchMine(); if (isAdmin) fetchTeam();
    } catch (e) { /* swallow */ }
  };
  const handleDelete = async (rec) => {
    if (!window.confirm('Delete this recording? This can’t be undone.')) return;
    try {
      await teamRecordingsAPI.remove(rec.id);
      invalidate('recordings:*');
      fetchMine(); if (isAdmin) fetchTeam();
    } catch (e) { alert('Could not delete recording.'); }
  };
  const handleRename = async (rec) => {
    const next = window.prompt('Rename recording', rec.title);
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === rec.title) return;
    // Optimistic — update all three local lists + cache immediately, then send the PATCH.
    const apply = (list) => list.map((r) => (r.id === rec.id ? { ...r, title: trimmed } : r));
    setMine(apply);
    if (isAdmin) setTeam(apply);
    setShared(apply);
    setCached(`recordings:detail:${rec.id}`, { ...rec, title: trimmed });
    try {
      await teamRecordingsAPI.update(rec.id, { title: trimmed });
      invalidate('recordings:mine'); invalidate('recordings:team'); invalidate('recordings:shared');
    } catch (e) {
      alert('Rename failed.');
      fetchMine(); if (isAdmin) fetchTeam();
    }
  };

  const taskTitleById = (id) => taskMap[String(id)] || null;

  const tabs = [{ id: 'mine', label: 'My recordings' }];
  if (isAdmin) tabs.push({ id: 'team', label: 'Team recordings' });

  const isTeamTab = tab === 'team';

  return (
    <div>
      {isAdmin && (
        <div style={{ display: 'inline-flex', borderRadius: 8, marginBottom: 32, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, padding: 3 }}>
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                backgroundColor: tab === t.id ? palette.accentBg : 'transparent',
                color: tab === t.id ? palette.accent : palette.textDim,
                fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isTeamTab ? (
        <PageHeader
          palette={palette}
          kicker={`${team.length} RECORDINGS · ${recFmtDur(teamTotalDur)} TOTAL`}
          title="Team"
          accentWord="recordings"
        />
      ) : (
        <PageHeader
          palette={palette}
          kicker={`${mine.length} RECORDINGS · ${recFmtDur(myTotalDur)} TOTAL`}
          title="Your"
          accentWord="recordings"
          right={<SolidButton palette={palette} onClick={() => recorder.openSetup()} icon={Plus}>New recording</SolidButton>}
        />
      )}

      {isTeamTab && (
        <div className="team-stack-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
          backgroundColor: palette.border, border: `1px solid ${palette.border}`,
          borderRadius: 10, overflow: 'hidden', marginBottom: 24, maxWidth: 380,
        }}>
          {[
            { label: 'Total recordings', value: team.length },
            { label: 'Total duration', value: recFmtDur(teamTotalDur) },
          ].map((s) => (
            <div key={s.label} style={{ padding: '10px 14px', backgroundColor: palette.surface }}>
              <div style={{ fontFamily: monoFont, fontSize: 9.5, color: palette.textMute, letterSpacing: '0.06em', marginBottom: 3, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 400, color: palette.text }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        {!isTeamTab ? (
          <div style={{ display: 'inline-flex', borderRadius: 8, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, padding: 3 }}>
            {[{ id: 'all', label: 'All' }, { id: 'shared', label: 'Shared with me' }].map((f) => (
              <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  backgroundColor: filter === f.id ? palette.accentBg : 'transparent',
                  color: filter === f.id ? palette.accent : palette.textDim,
                  fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                }}>
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          // "Recorded by" multi-select — appears only on the Team recordings tab.
          <MemberFilterDropdown
            palette={palette}
            members={teamOwners}
            value={ownerFilter}
            onChange={setOwnerFilter}
            counts={ownerCounts}
            compact
          />
        )}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: 8, color: palette.textMute }} />
          <input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px 6px 28px', borderRadius: 6, outline: 'none',
              backgroundColor: palette.surfaceAlt, color: palette.text,
              fontFamily: baseFont, fontSize: 12, border: `1px solid ${palette.border}`,
              width: 200,
            }}
          />
        </div>
      </div>

      {filteredList.length === 0 ? (
        <EmptyState
          palette={palette}
          showCta={!search.trim() && filter !== 'shared' && !isTeamTab}
          headline={
            search.trim() ? 'Nothing matches that.'
            : (filter === 'shared' && !isTeamTab) ? 'Nothing shared with you yet.'
            : 'No recordings yet.'
          }
          onRecord={() => recorder.openSetup()}
        />
      ) : (
        <div className="team-recordings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filteredList.map((rec) => (
            <RecordingCard
              key={rec.id}
              rec={rec}
              palette={palette}
              scope={isTeamTab ? 'team' : 'mine'}
              currentUserId={currentUserId}
              taskTitleById={taskTitleById}
              onOpen={(r) => onOpenRec?.(r.id)}
              onCopyLink={handleCopyLink}
              onStar={handleStar}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ palette, headline, showCta, onRecord }) {
  return (
    <div style={{
      border: `1px dashed ${palette.border}`, borderRadius: 12, padding: '64px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 400, color: palette.text }}>{headline}</div>
      {showCta && (
        <>
          <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 8, marginBottom: 20 }}>
            Hit Record to make your first one →
          </div>
          <button type="button" onClick={onRecord}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              backgroundColor: palette.accent, color: palette.accentText,
              fontFamily: baseFont, fontSize: 13, fontWeight: 500,
            }}>
            <Video size={14} /> Record
          </button>
        </>
      )}
    </div>
  );
}

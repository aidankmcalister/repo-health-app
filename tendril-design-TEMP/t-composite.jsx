// t-composite.jsx — assembled surfaces: sidebar, top bar, command menu, repo
// card, empty state, toast, user menu, and the view-builder modal.

// ---------- Mock data ----------
const REPOS = [
{ id: 'r1', name: 'prisma/prisma', branch: 'main', stars: 39200, private: false, color: '#f46a3c' },
{ id: 'r2', name: 'vercel/next.js', branch: 'canary', stars: 121000, private: false, color: '#4ea7fc' },
{ id: 'r3', name: 'withastro/astro', branch: 'main', stars: 44100, private: false, color: '#4cb782' },
{ id: 'r4', name: 'acme/platform-core', branch: 'develop', stars: 0, private: true, color: '#b59aff' }];

const METRICS = [
{ id: 'open_prs', label: 'Open pull requests', hint: 'count' },
{ id: 'open_issues', label: 'Open issues', hint: 'count' },
{ id: 'stars', label: 'Stargazers', hint: 'count' },
{ id: 'commits', label: 'Commits / day', hint: 'rate' },
{ id: 'merge_rate', label: 'PR merge rate', hint: 'pct' },
{ id: 'review_time', label: 'Time to first review', hint: 'hrs' }];

const AGGS = [
{ id: 'total', label: 'Total' }, { id: 'avg', label: 'Average' }, { id: 'last', label: 'Latest' },
{ id: 'max', label: 'Maximum' }, { id: 'min', label: 'Minimum' }];

window.T_REPOS = REPOS;window.T_METRICS = METRICS;

// Owner monogram logo — a rounded square tinted from the repo color.
function RepoLogo({ repo, size = 18 }) {
  const owner = repo.name.split('/')[0] || '?';
  return (
    <span style={{ width: size, height: size, flex: 'none', borderRadius: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: size * 0.52, fontWeight: 700, color: repo.color, background: `color-mix(in srgb, ${repo.color} 18%, var(--surface-3))`, border: `1px solid color-mix(in srgb, ${repo.color} 36%, transparent)`, textTransform: 'uppercase' }}>{owner[0]}</span>);

}
window.RepoLogo = RepoLogo;

// ---------- Sidebar ----------
function GallerySidebar({ active = 'OSS health', onNav = () => {} }) {
  const dashboards = [['OSS health', 4], ['Platform team', 6], ['Release radar', 3]];
  return (
    <aside style={{ width: 232, background: 'var(--canvas)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', padding: 12, height: 460 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px 14px' }}>
        <span className="gal__mark" style={{ width: 24, height: 24 }}><Icon name="sprout" size={15} /></span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.4px', color: 'var(--ink)' }}>Tendril</span>
        <Icon name="chevrons-up-down" size={14} style={{ color: 'var(--ink-tertiary)', marginLeft: 'auto' }} />
      </div>
      <Search kbd="⌘K" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 8px 6px' }}>
        <span style={{ fontFamily: 'var(--font-text)', fontSize: 11, fontWeight: 500, letterSpacing: 0.4, color: 'var(--ink-tertiary)' }}>DASHBOARDS</span>
        <span style={{ color: 'var(--ink-tertiary)', display: 'inline-flex', cursor: 'pointer' }}><Icon name="plus" size={13} stroke={2} /></span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {dashboards.map(([nm, ct]) =>
        <button key={nm} onClick={() => onNav(nm)} className="rail-item" style={{ height: 32, background: active === nm ? 'var(--surface-2)' : 'transparent', color: active === nm ? 'var(--ink)' : 'var(--ink-muted)' }}>
            <Icon name="dashboard" size={14} style={{ color: active === nm ? 'var(--primary)' : 'var(--ink-tertiary)' }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{nm}</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-tertiary)' }}>{ct}</span>
          </button>
        )}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: 8, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-subtle)' }}>
        <Icon name="terminal" size={14} style={{ color: 'var(--term-prompt)' }} />
        <span>Press <span style={{ color: 'var(--ink)' }}>⌘K</span> for commands</span>
      </div>
    </aside>);

}

// ---------- Top bar ----------
function TopBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--canvas)' }}>
      <span className="iconbtn"><Icon name="sidebar" size={16} /></span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-text)', fontSize: 13, color: 'var(--ink-subtle)' }}>
        <span>Dashboards</span><Icon name="chevron-right" size={13} style={{ color: 'var(--ink-tertiary)' }} /><span style={{ color: 'var(--ink)' }}>OSS health</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button variant="ghost" size="sm" icon="refresh">Sync</Button>
        <Button variant="primary" size="sm" icon="plus">New view</Button>
      </div>
    </div>);

}

// ---------- Command menu ----------
function CommandMenu() {
  const items = [
  { ic: 'plus', label: 'Create new view', kbd: 'C' },
  { ic: 'dashboard', label: 'Go to dashboard…', kbd: '' },
  { ic: 'github', label: 'Connect a repository', kbd: '' },
  { ic: 'refresh', label: 'Sync all metrics', kbd: 'S' },
  { ic: 'settings', label: 'Open settings', kbd: '⌘,' }];

  return (
    <div style={{ width: 440, background: 'var(--surface-3)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', borderBottom: '1px solid var(--hairline)' }}>
        <Icon name="search" size={16} style={{ color: 'var(--ink-subtle)' }} />
        <input autoFocus placeholder="Type a command or search…" style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: 'var(--ink)', fontFamily: 'var(--font-text)', fontSize: 14 }} />
        <span className="kbd" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-tertiary)', border: '1px solid var(--hairline)', borderRadius: 4, padding: '1px 6px' }}>esc</span>
      </div>
      <div style={{ padding: 6 }}>
        <div className="menu__head">Actions</div>
        {items.map((it, i) =>
        <div key={it.label} className="menu__item" style={{ background: i === 0 ? 'var(--surface-1)' : 'transparent', color: i === 0 ? 'var(--ink)' : 'var(--ink-muted)' }}>
            <Icon name={it.ic} size={15} style={{ color: i === 0 ? 'var(--primary)' : 'var(--ink-tertiary)' }} />
            <span>{it.label}</span>
            {it.kbd && <span className="menu__kbd">{it.kbd}</span>}
          </div>
        )}
      </div>
    </div>);

}

// ---------- Repo card ----------
function RepoCard({ repo }) {
  const [color, setColor] = React.useState(repo.color);
  return (
    <div className="repo">
      <div className="repo__top">
        <RepoLogo repo={repo} size={26} />
        <span className="repo__name" style={{ fontFamily: "\"JetBrains Mono\"" }}>{repo.name}</span>
        <span className="repo__vis"><Icon name={repo.private ? 'lock' : 'globe'} size={13} /></span>
      </div>
      <div className="repo__meta">
        <Icon name="git-branch" size={13} /><span>{repo.branch}</span>
        <span style={{ color: 'var(--ink-tertiary)' }}>·</span>
        <Icon name="star" size={13} /><span>{repo.stars ? (repo.stars / 1000).toFixed(1) + 'k' : '—'}</span>
        <ColorDot value={color} onChange={setColor} />
      </div>
    </div>);

}

// ---------- Empty state ----------
function EmptyState() {
  return (
    <div className="empty" style={{ width: '100%', maxWidth: 380 }}>
      <span className="empty__ico"><Icon name="dashboard" size={20} /></span>
      <h4>No views yet</h4>
      <p>Add a view to start tracking pull requests, issues, and contributor health across your repos.</p>
      <Button variant="primary" icon="plus">Create your first view</Button>
    </div>);

}

// ---------- User menu ----------
function UserMenu() {
  return (
    <div className="popcard">
      <div className="popcard__head" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar img="https://i.pravatar.cc/64?img=33" size={34} />
        <div style={{ minWidth: 0 }}><div className="popcard__nm">Aidan McAlister</div><div className="popcard__em">aidan@example.com</div></div>
      </div>
      <div className="menu__item"><Icon name="settings" size={14} /><span>Settings</span><span className="menu__kbd">⌘,</span></div>
      <div className="menu__item"><Icon name="github" size={14} /><span>GitHub profile</span></div>
      <div className="menu__sep" />
      <div className="menu__item danger"><Icon name="logout" size={14} /><span>Sign out</span></div>
    </div>);

}

// ---------- Toast ----------
function ToastDemo() {
  return <div className="toast"><Icon name="circle-check" size={14} style={{ color: 'var(--success)' }} /> View <code className="toast-code">PR throughput</code> saved</div>;
}

// ========================================================================
// VIEW BUILDER MODAL  (the composite finale — Direction C, on Linear)
// ========================================================================
const TYPES = [{ id: 'big_number', label: 'Big Number', icon: 'hash' }, { id: 'line', label: 'Line', icon: 'line' }, { id: 'area', label: 'Area', icon: 'area' }, { id: 'bar', label: 'Bar', icon: 'bar' }];
const TYPES_SOON = [{ id: 'table', label: 'Table', icon: 'table' }];
const letterFor = (i) => String.fromCharCode(65 + i);
const newPoint = (i) => ({ letter: letterFor(i), metricId: METRICS[i % METRICS.length].id, repoIds: [REPOS[i % REPOS.length].id], aggregation: 'last', color: T_COLORS[i % T_COLORS.length] });

function RepoSelect({ value, onChange, sm }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const sel = REPOS.filter((r) => value.includes(r.id));
  const one = sel.length === 1 ? sel[0] : null;
  const label = value.length === 0 ? 'No repos' : value.length === REPOS.length ? `All repos · ${REPOS.length}` : sel.length === 1 ? sel[0].name : `${sel[0].name} +${sel.length - 1}`;
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="select" ref={ref}>
      <button className={'select__trigger' + (sm ? ' sm' : '')} onClick={() => setOpen((o) => !o)}>
        {one ? <RepoLogo repo={one} size={sm ? 16 : 18} /> : <Icon name="github" size={13} style={{ color: 'var(--ink-tertiary)' }} />}
        <span className="select__val mono" style={{ fontSize: sm ? 12 : 13 }}>{label}</span>
        <span className="select__ico"><Icon name="chevron-down" size={13} /></span>
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)}>
        <div className="menu__list">
          {REPOS.map((r) =>
          <button key={r.id} className="menu__item" onClick={() => toggle(r.id)}>
              <Checkbox checked={value.includes(r.id)} onChange={() => toggle(r.id)} />
              <RepoLogo repo={r} />
              <span className="mono" style={{ fontSize: 12.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              {r.private && <Icon name="lock" size={12} style={{ color: 'var(--ink-tertiary)' }} />}
            </button>
          )}
        </div>
      </Floating>
    </div>);

}

// Letter badge that doubles as the series color picker — click "A" to recolor.
function LetterColorPicker({ s, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  return (
    <div className="cp" ref={ref} style={{ flex: 'none' }}>
      <button className="dp__badge" style={{ borderColor: s.color, color: s.color, cursor: 'pointer' }} onClick={() => setOpen((o) => !o)} title="Series color">{s.letter}</button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width="auto">
        <div className="cp__grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
          {T_COLORS.map((c) =>
          <button key={c} className="dp__badge" style={{ width: 26, height: 26, borderColor: c, color: c, cursor: 'pointer', background: c === s.color ? `color-mix(in srgb, ${c} 22%, transparent)` : 'transparent' }} onClick={() => {onChange(c);setOpen(false);}}>{s.letter}</button>
          )}
        </div>
      </Floating>
    </div>);

}

function DataPoint({ s, onChange, onRemove, showAgg }) {
  const u = (p) => onChange({ ...s, ...p });
  return (
    <div className="dp" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px' }}>
      <LetterColorPicker s={s} onChange={(c) => u({ color: c })} />
      <div style={{ flex: '1.5 1 0', minWidth: 0 }}><Select sm value={s.metricId} options={METRICS} onChange={(id) => u({ metricId: id })} /></div>
      <div style={{ flex: '1.3 1 0', minWidth: 0 }}><RepoSelect sm value={s.repoIds} onChange={(ids) => u({ repoIds: ids })} /></div>
      {showAgg && <div style={{ flex: '0.9 1 0', minWidth: 0 }}><Select sm value={s.aggregation} options={AGGS} onChange={(v) => u({ aggregation: v })} /></div>}
      <button className="iconbtn danger" onClick={onRemove} title="Remove data point"><Icon name="trash" size={13} /></button>
    </div>);

}

function ChartOptions({ st, set }) {
  const Row = ({ label, children }) => <div className="fieldcol"><div className="fl">{label}</div>{children}</div>;
  if (st.type === 'big_number') return (
    <div className="fieldcol" style={{ gap: 14 }}>
      <Row label="Aggregation"><Select sm value={st.agg} options={AGGS} onChange={(v) => set({ agg: v })} /></Row>
      <Row label="Format · optional"><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><div className="fieldcol" style={{ gap: 5 }}><div className="fl" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11, color: 'var(--ink-subtle)' }}>Prefix</div><Input sm placeholder="e.g. $" value={st.prefix} onChange={(e) => set({ prefix: e.target.value })} /></div><div className="fieldcol" style={{ gap: 5 }}><div className="fl" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11, color: 'var(--ink-subtle)' }}>Postfix</div><Input sm placeholder="e.g. %" value={st.postfix} onChange={(e) => set({ postfix: e.target.value })} /></div></div></Row>
      <Toggle value={st.sparkline} onChange={(v) => set({ sparkline: v })} label="Trend sparkline" />
      <Toggle value={st.compare} onChange={(v) => set({ compare: v })} label="Compare to previous period" />
    </div>);

  if (st.type === 'bar') return (
    <div className="fieldcol" style={{ gap: 14 }}>
      <Row label="Date range"><DateRange value={st.range} mode={st.mode} from={st.from} to={st.to} onChange={(p) => set(p)} /></Row>
      <Row label="Bars"><Segmented value={st.grouping} options={[{ value: 'grouped', label: 'Grouped' }, { value: 'stacked', label: 'Stacked' }]} onChange={(v) => set({ grouping: v })} /></Row>
      <Toggle value={st.valueLabels} onChange={(v) => set({ valueLabels: v })} label="Value labels" />
    </div>);

  // line / area
  return (
    <div className="fieldcol" style={{ gap: 14 }}>
      <Row label="Date range"><DateRange value={st.range} mode={st.mode} from={st.from} to={st.to} onChange={(p) => set(p)} /></Row>
      {st.type === 'area' ?
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="fieldcol"><div className="fl">Curve</div><Segmented value={st.curve} options={[{ value: 'smooth', label: 'Smooth' }, { value: 'linear', label: 'Linear' }]} onChange={(v) => set({ curve: v })} /></div>
          <div className="fieldcol"><div className="fl">Fill</div><Segmented value={st.fill} options={[{ value: 'area', label: 'Gradient' }, { value: 'line', label: 'Line' }]} onChange={(v) => set({ fill: v })} /></div>
        </div> :

      <>
          <Row label="Curve"><Segmented value={st.curve} options={[{ value: 'smooth', label: 'Smooth' }, { value: 'linear', label: 'Linear' }]} onChange={(v) => set({ curve: v })} /></Row>
          <Toggle value={st.markers} onChange={(v) => set({ markers: v })} label="Markers" />
        </>
      }
    </div>);

}

function PreviewPane({ st }) {
  const active = st.series.filter((s) => s.repoIds.length);
  const defs = active.slice(0, 3).map((s) => ({ label: REPOS.find((r) => r.id === s.repoIds[0])?.name || 'repo', color: s.color, seed: s.letter }));
  const cur = TYPES.find((t) => t.id === st.type);
  return (
    <div className="modal__preview">
      <div className="pv__h">
        <div className="pv__eyebrow">Live preview</div>
        <div className="pv__meta">{cur.label}{st.type !== 'big_number' && <> · {st.range}d</>} · {active.length} {active.length === 1 ? 'point' : 'points'}</div>
      </div>
      <div className="pv__body">
        {active.length === 0 ?
        <div className="empty" style={{ width: '100%' }}><span className="empty__ico"><Icon name={cur.icon} size={18} /></span><h4>Nothing to preview</h4><p>Add a data point to render the chart.</p></div> :
        st.type === 'big_number' ?
        <BigNumber name={st.name} value={(st.prefix || '') + '128' + (st.postfix || '')} cap={`${AGGS.find((a) => a.id === st.agg)?.label} · last ${st.range} days`} delta={st.compare ? 8.4 : 0} color={defs[0].color} seed={defs[0].seed} chart={st.sparkline} /> :
        st.type === 'bar' ?
        <BarChart name={st.name} sub={`last ${st.range}d`} /> :
        <SeriesChart name={st.name} kind={st.type} sub={`last ${st.range} days`} seriesDefs={defs} />}
      </div>
    </div>);

}

function ViewBuilder() {
  const [st, setSt] = React.useState({
    name: 'PR throughput', subtitle: '', type: 'area', range: 90, mode: 'preset', from: '', to: '',
    curve: 'smooth', fill: 'area', grouping: 'grouped', markers: false, valueLabels: false, compare: true, sparkline: false,
    agg: 'last', prefix: '', postfix: '', series: [newPoint(0), newPoint(1)]
  });
  const set = (p) => setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  const cur = TYPES.find((t) => t.id === st.type);
  const showAgg = st.type !== 'big_number';
  const updatePoint = (i, n) => set((s) => ({ ...s, series: s.series.map((x, j) => j === i ? n : x) }));
  const removePoint = (i) => set((s) => ({ ...s, series: s.series.filter((_, j) => j !== i).map((x, j) => ({ ...x, letter: letterFor(j) })) }));
  const addPoint = () => set((s) => ({ ...s, series: [...s.series, newPoint(s.series.length)] }));
  const ok = st.series.some((s) => s.repoIds.length);
  return (
    <div className="modal-scrim">
      <div className="modal">
        <div className="modal__h">
          <span style={{ color: 'var(--primary)', display: 'inline-flex' }}><Icon name={cur.icon} size={15} /></span>
          <h3>New {cur.label.toLowerCase()} view</h3>
          <span className="iconbtn" style={{ marginLeft: 'auto' }}><Icon name="x" size={15} /></span>
        </div>
        <div className="modal__body">
          <div className="modal__rail">
            <div className="modal__railhead">CHART TYPE</div>
            {TYPES.map((t) => <div key={t.id} className={'rail-item' + (st.type === t.id ? ' on' : '')} onClick={() => set({ type: t.id })}><Icon name={t.icon} size={15} /><span>{t.label}</span></div>)}
            <div className="rail-div" />
            <div className="modal__railhead">UPCOMING</div>
            {TYPES_SOON.map((t) => <div key={t.id} className="rail-item disabled"><Icon name={t.icon} size={15} /><span>{t.label}</span><span className="rail-soon">soon</span></div>)}
          </div>
          <div className="modal__config">
            <div className="fieldcol" style={{ gap: 12 }}>
              <div className="fieldcol"><div className="fl">Name</div><Input value={st.name} onChange={(e) => set({ name: e.target.value })} placeholder="Untitled view" /></div>
              <div className="fieldcol"><div className="fl">Subtitle · optional</div><Input value={st.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Shown under the title" /></div>
            </div>
            <div className="sec">
              <div className="sec__h"><span>Chart options</span></div>
              <ChartOptions st={st} set={set} />
            </div>
            <div className="sec">
              <div className="sec__h"><span>Data points<span className="count">{st.series.length}/5</span></span><button className="btn btn--ghost btn--sm" onClick={addPoint} disabled={st.series.length >= 5}><Icon name="plus" size={12} stroke={2.2} />Add</button></div>
              {showAgg && <p className="dp__hint">Each point rolls its metric up across the date range — set how with <b style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Aggregate</b>.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {st.series.map((s, i) => <DataPoint key={s.letter + i} s={s} showAgg={showAgg} onChange={(n) => updatePoint(i, n)} onRemove={() => removePoint(i)} />)}
              </div>
            </div>
          </div>
          <PreviewPane st={st} />
        </div>
        <div className="modal__f">
          <span className="modal__fhint">{st.series.filter((s) => s.repoIds.length).length} of {st.series.length} points active</span>
          <div style={{ display: 'flex', gap: 8 }}><Button variant="ghost">Cancel</Button><Button variant="primary" disabled={!ok}>Save view</Button></div>
        </div>
      </div>
    </div>);

}

// ========================================================================
// DASHBOARD BUILDER MODAL  (name + repos + highlight view)
// ========================================================================
function DashboardBuilder() {
  const [name, setName] = React.useState('ray-so');
  const [desc, setDesc] = React.useState('Testing the backfill');
  const [highlight, setHighlight] = React.useState('none');
  const [repos, setRepos] = React.useState([REPOS[0], REPOS[1]]);
  const HV = [{ id: 'none', label: 'None' }, { id: 'pr', label: 'PR throughput' }, { id: 'iss', label: 'Open issues' }];
  const addRepo = () => { const next = REPOS.find((r) => !repos.some((x) => x.id === r.id)); if (next) setRepos([...repos, next]); };
  return (
    <div className="modal-scrim">
      <div className="modal" style={{ maxWidth: 560, height: 'auto' }}>
        <div className="modal__h" style={{ alignItems: 'flex-start', padding: '15px 16px' }}>
          <div>
            <h3>Edit dashboard</h3>
            <div className="modal__sub">Name your dashboard and choose the repos to watch.</div>
          </div>
          <span className="iconbtn" style={{ marginLeft: 'auto' }}><Icon name="x" size={15} /></span>
        </div>
        <div className="modal__config" style={{ gap: 16 }}>
          <div className="fieldcol"><div className="fl">Name</div><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dashboard name" /></div>
          <div className="fieldcol"><div className="fl">Description · optional</div><textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's this dashboard for?" /></div>
          <div className="fieldcol">
            <div className="fl">Highlight view</div>
            <Select value={highlight} options={HV} onChange={setHighlight} />
            <div className="field__hint">Shown on the home-page card for this dashboard.</div>
          </div>
          <div className="sec">
            <div className="sec__h"><span>Repos<span className="count">{repos.length}</span></span><button className="btn btn--ghost btn--sm" onClick={addRepo} disabled={repos.length >= REPOS.length}><Icon name="plus" size={12} stroke={2.2} />Add repo</button></div>
            <div className="dblist">
              {repos.map((r) => (
                <div className="dbrow" key={r.id}>
                  <RepoLogo repo={r} size={22} />
                  <span className="dbrow__name">{r.name}</span>
                  {r.private && <Icon name="lock" size={12} style={{ color: 'var(--ink-tertiary)' }} />}
                  <button className="iconbtn" onClick={() => setRepos(repos.filter((x) => x.id !== r.id))} title="Remove repo"><Icon name="x" size={14} /></button>
                </div>
              ))}
              {repos.length === 0 && <div className="dbrow" style={{ color: 'var(--ink-tertiary)', fontFamily: 'var(--font-text)', fontSize: 13 }}>No repos yet — add one to start.</div>}
            </div>
          </div>
        </div>
        <div className="modal__f">
          <Button variant="danger" icon="trash">Delete dashboard</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { GallerySidebar, TopBar, CommandMenu, RepoCard, EmptyState, UserMenu, ToastDemo, ViewBuilder, DashboardBuilder, RepoSelect });
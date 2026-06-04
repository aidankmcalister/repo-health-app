// t-gallery.jsx — the showcase: every Tendril component, shown and styled.

function Specimen({ name, tag, mimic, stage = '', children }) {
  return (
    <div className="specimen">
      <div className="specimen__bar">
        <span className="specimen__name">{name}</span>
        <span className={'specimen__tag' + (mimic ? ' mimic' : '')}>{mimic ? 'mimic' : (tag || 'component')}</span>
      </div>
      <div className={'specimen__stage ' + stage}>{children}</div>
    </div>
  );
}
function Row({ label, children }) {
  return <div className="row-line"><span className="specimen__lbl">{label}</span>{children}</div>;
}
function Section({ id, kicker, title, sub, children }) {
  return (
    <section className="section" id={id}>
      <div className="section__head">
        <div className="section__kicker">{kicker}</div>
        <h2 className="section__title">{title}</h2>
        {sub && <p className="section__sub">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

// ---- Foundations specimens ----
function ColorSwatchRow({ items }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
      {items.map(([name, v, sub]) => (
        <div key={name} style={{ flex: '1 1 120px', minWidth: 120 }}>
          <div style={{ height: 52, borderRadius: 8, background: v, border: '1px solid var(--hairline)' }} />
          <div style={{ fontFamily: 'var(--font-text)', fontSize: 12, color: 'var(--ink)', marginTop: 8 }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-tertiary)' }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

function TypeSpecimen() {
  const rows = [
    ['Display', 'var(--display-md-size)', 600, '-1.0px', 'Repo health, at a glance'],
    ['Headline', 'var(--headline-size)', 600, '-0.6px', 'Pull request throughput'],
    ['Card title', 'var(--card-title-size)', 500, '-0.4px', 'Contributor reach'],
    ['Body', 'var(--body-size)', 400, '-0.05px', 'Track the metrics that matter across every repository you ship.'],
    ['Caption', 'var(--caption-size)', 400, '0', 'Total · last 30 days'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      {rows.map(([lbl, size, w, ls, sample]) => (
        <div key={lbl} style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <span style={{ width: 92, flex: 'none', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-tertiary)' }}>{lbl}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: w, letterSpacing: ls, color: 'var(--ink)', lineHeight: 1.2 }}>{sample}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
        <span style={{ width: 92, flex: 'none', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-tertiary)' }}>Mono</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--term-text)' }}><span style={{ color: 'var(--term-prompt)' }}>❯</span> tendril sync --team eng</span>
      </div>
    </div>
  );
}

function App() {
  const [section, setSection] = React.useState('foundations');
  const nav = [
    ['foundations', 'Foundations', 'layers'],
    ['buttons', 'Buttons', 'command'],
    ['inputs', 'Inputs & fields', 'hash'],
    ['selects', 'Selects & menus', 'list'],
    ['tabs', 'Tabs & ranges', 'sliders-horizontal'],
    ['toggles', 'Toggles & choices', 'circle-check'],
    ['data', 'Badges & data', 'activity'],
    ['surfaces', 'Cards & surfaces', 'dashboard'],
    ['charts', 'Charts', 'area'],
    ['nav', 'Navigation', 'sidebar'],
    ['dashboard', 'Dashboard builder', 'dashboard'],
    ['modal', 'View builder', 'plus'],
    ['handoff', 'Build on shadcn', 'terminal'],
  ];
  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setSection(e.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    nav.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="gal">
      <nav className="gal__rail">
        <div className="gal__brand">
          <span className="gal__mark"><Icon name="sprout" size={16} /></span>
          <div>
            <div className="gal__brandname">Tendril</div>
            <div className="gal__brandsub">component library</div>
          </div>
        </div>
        <div className="gal__navhead">SECTIONS</div>
        {nav.map(([id, label, ic]) => (
          <a key={id} href={'#' + id} className={'gal__navlink' + (section === id ? ' on' : '')}>
            <Icon name={ic} size={15} /><span>{label}</span>
          </a>
        ))}
      </nav>

      <main className="gal__main">
        <header className="gal__hero">
          <div className="gal__eyebrow">Design system · Linear</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--display-lg-size)', fontWeight: 600, letterSpacing: 'var(--display-lg-ls)', color: 'var(--ink)', maxWidth: 720, lineHeight: 1.08 }}>Tendril, rebuilt on the Linear design language.</h1>
          <p style={{ fontFamily: 'var(--font-text)', fontSize: 18, color: 'var(--ink-subtle)', marginTop: 18, maxWidth: 600, lineHeight: 1.5 }}>Every component in the repo-health app — restyled in the near-black, duotone Linear system. Charts are mimicked; your custom charts plug into the same frames.</p>
          <div className="gal__herometa">
            <div className="gal__stat"><span className="gal__statn">11</span><span className="gal__statl">sections</span></div>
            <div className="gal__stat"><span className="gal__statn">40+</span><span className="gal__statl">components</span></div>
            <div className="gal__stat"><span className="gal__statn" style={{ color: 'var(--primary)' }}>Orange</span><span className="gal__statl">primary action</span></div>
            <div className="gal__stat"><span className="gal__statn" style={{ color: 'var(--primary)' }}>Linear</span><span className="gal__statl">design language</span></div>
          </div>
        </header>

        {/* FOUNDATIONS */}
        <Section id="foundations" kicker="01 — Foundations" title="Color & type" sub="Orange leads — it carries the brand mark, every primary action, and all active states. Teal is a scarce developer accent, reserved for terminal moments. The label palette is for data only.">
          <div className="grid grid--2">
            <Specimen name="Brand · duotone" tag="tokens" stage="col">
              <ColorSwatchRow items={[['Primary', 'var(--primary)', '#f46a3c'], ['Teal', 'var(--accent-2)', '#1fb8a6'], ['Success', 'var(--success)', '#27a644']]} />
            </Specimen>
            <Specimen name="Surface ladder" tag="tokens" stage="col">
              <ColorSwatchRow items={[['Canvas', 'var(--canvas)', '#010102'], ['Surface 1', 'var(--surface-1)', '#0f1011'], ['Surface 2', 'var(--surface-2)', '#141516'], ['Surface 3', 'var(--surface-3)', '#18191a']]} />
            </Specimen>
            <Specimen name="Label palette" tag="data only" stage="col">
              <ColorSwatchRow items={[['Red', 'var(--label-red)', 'urgent'], ['Orange', 'var(--label-orange)', 'docs'], ['Yellow', 'var(--label-yellow)', 'review'], ['Green', 'var(--label-green)', 'perf'], ['Blue', 'var(--label-blue)', 'feature'], ['Purple', 'var(--label-purple)', 'done']]} />
            </Specimen>
            <Specimen name="Type scale" tag="Roboto / JetBrains Mono" stage="col left">
              <TypeSpecimen />
            </Specimen>
          </div>
        </Section>

        {/* BUTTONS */}
        <Section id="buttons" kicker="02 — Controls" title="Buttons" sub="8px corners, never pills. Primary is the scarce orange; secondary lifts the surface ladder; ghost is chromeless. Danger is a tinted-red outline.">
          <div className="grid grid--2">
            <Specimen name="Variants" stage="col">
              <Row label="primary"><Button variant="primary">Create view</Button><Button variant="primary" icon="plus">New dashboard</Button></Row>
              <Row label="secondary"><Button variant="secondary">Sync now</Button><Button variant="secondary" icon="github">Connect repo</Button></Row>
              <Row label="ghost"><Button variant="ghost">Cancel</Button><Button variant="ghost" icon="refresh">Refresh</Button></Row>
              <Row label="danger"><Button variant="danger" icon="trash">Delete view</Button></Row>
            </Specimen>
            <Specimen name="Sizes · icon · state" stage="col">
              <Row label="sizes"><Button variant="primary" size="sm">Small</Button><Button variant="primary">Default</Button><Button variant="primary" size="lg">Large</Button></Row>
              <Row label="icon"><Button variant="secondary" icon="settings" /><Button variant="secondary" icon="ellipsis" /><Button variant="ghost" icon="refresh" /><Button variant="primary" icon="plus" /></Row>
              <Row label="disabled"><Button variant="primary" disabled>Save view</Button><Button variant="secondary" disabled>Sync</Button></Row>
              <Row label="inverse"><Button variant="inverse" icon="github">Continue with GitHub</Button></Row>
            </Specimen>
          </div>
        </Section>

        {/* INPUTS */}
        <Section id="inputs" kicker="02 — Controls" title="Inputs & fields" sub="Surface-1 fills with hairline borders; focus is the 2px orange ring. Affix groups carry currency / unit framing for metric formatting.">
          <div className="grid grid--2">
            <Specimen name="Text field" stage="col left">
              <Field label="View name"><Input placeholder="Untitled view" /></Field>
              <Field label="View name · focused"><input className="input" defaultValue="PR throughput" style={{ borderColor: 'var(--hairline-strong)', boxShadow: '0 0 0 2px color-mix(in srgb, var(--primary-focus) 50%, transparent)' }} /></Field>
              <Field label="Description" opt><textarea className="input" rows={2} placeholder="Shown under the title" /></Field>
            </Specimen>
            <Specimen name="Search · affix" stage="col left">
              <Field label="Search repositories"><Search placeholder="Filter repos…" kbd="⌘K" /></Field>
              <Field label="Prefix"><Affix pre="$" placeholder="0" defaultValue="1,204" /></Field>
              <Field label="Postfix"><Affix post="%" placeholder="0" defaultValue="92.4" /></Field>
            </Specimen>
          </div>
        </Section>

        {/* SELECTS */}
        <Section id="selects" kicker="02 — Controls" title="Selects & menus" sub="Triggers match inputs; menus lift to surface-3 with a strong hairline and soft shadow. The selected check mark sits in a reserved slot so labels never shift.">
          <div className="grid grid--3">
            <Specimen name="Select" stage="col left"><MenuDemo /></Specimen>
            <Specimen name="Repo multi-select" stage="col left"><RepoSelectDemo /></Specimen>
            <Specimen name="Dropdown menu" stage="tight"><div style={{ padding: 24, width: '100%', display: 'flex', justifyContent: 'center' }}><UserMenu /></div></Specimen>
          </div>
        </Section>

        {/* TABS */}
        <Section id="tabs" kicker="02 — Controls" title="Tabs, segments & ranges" sub="Pill tabs for top-level switches, segmented controls for inline options, and underline tabs for the date range — with a Since picker for live, up-to-now windows.">
          <div className="grid grid--2">
            <Specimen name="Pill tabs · segmented" stage="col"><TabsDemo /></Specimen>
            <Specimen name="Date range · Since picker" stage="col left"><DateRangeDemo /></Specimen>
          </div>
        </Section>

        {/* TOGGLES */}
        <Section id="toggles" kicker="02 — Controls" title="Toggles & choices" sub="Switches use the orange action color when on. Checkboxes and radios share the same accent; color picks come from the data-label palette.">
          <div className="grid grid--3">
            <Specimen name="Toggle" stage="col"><ToggleDemo /></Specimen>
            <Specimen name="Checkbox · radio" stage="col"><ChoiceDemo /></Specimen>
            <Specimen name="Color picker" stage="col"><SwatchDemo /></Specimen>
          </div>
        </Section>

        {/* DATA */}
        <Section id="data" kicker="03 — Data display" title="Badges, deltas, tags & avatars" sub="Neutral badges for metadata, tinted status badges from the label palette, and mono delta pills for chart change — green up, red down.">
          <div className="grid grid--2">
            <Specimen name="Status · neutral badges" stage="col">
              <div className="specimen__row"><Badge color="var(--success)">Shipped</Badge><Badge color="var(--label-yellow)">In review</Badge><Badge color="var(--label-red)">Blocked</Badge><Badge color="var(--accent-2)">New</Badge><Badge color="var(--label-blue)">Planned</Badge></div>
              <div className="specimen__row"><Badge>Beta</Badge><Badge dot>Draft</Badge><span className="badge badge--count">2024.18</span></div>
            </Specimen>
            <Specimen name="Delta pills · tags · avatars" stage="col">
              <div className="specimen__row"><Change value={2.41} /><Change value={-1.83} /><Change value={1204} abs="1,204" suffix="" /><Change value={0} /></div>
              <div className="specimen__row"><Tag label="Bug" color="var(--label-red)" /><Tag label="Feature" color="var(--label-blue)" /><Tag label="Perf" color="var(--label-green)" /></div>
              <div className="specimen__row"><span className="avatar-stack"><Avatar who="AR" /><Avatar who="JL" /><Avatar who="MK" /><Avatar who="TS" /></span><Avatar img="https://i.pravatar.cc/48?img=33" /></div>
            </Specimen>
          </div>
        </Section>

        {/* SURFACES */}
        <Section id="surfaces" kicker="03 — Data display" title="Cards & surfaces" sub="The card recipe: surface-1 fill, 1px hairline, 12px radius, no shadow. Repo cards, empty states, popovers, and toasts all share it.">
          <div className="grid grid--2">
            <Specimen name="Repo card" stage="col"><RepoCard repo={T_REPOS[0]} /><RepoCard repo={T_REPOS[3]} /></Specimen>
            <Specimen name="Empty state" stage=""><EmptyState /></Specimen>
            <Specimen name="Command menu" tag="⌘K" stage=""><CommandMenu /></Specimen>
            <Specimen name="Toast" stage=""><ToastDemo /></Specimen>
          </div>
        </Section>

        {/* CHARTS */}
        <Section id="charts" kicker="04 — Visualization" title="Charts" sub="These renderings are mimics in the Linear palette — orange-led series on hairline grids. Your custom charts plug into the same .viz frames and delta pills.">
          <div className="grid grid--2">
            <Specimen name="Big number" mimic stage=""><BigNumber /></Specimen>
            <Specimen name="World map" mimic stage=""><WorldMap /></Specimen>
            <Specimen name="Line chart" mimic stage=""><SeriesChart kind="line" name="PR throughput" /></Specimen>
            <Specimen name="Area chart" mimic stage=""><SeriesChart kind="area" name="Open issues" /></Specimen>
            <Specimen name="Bar chart" mimic stage=""><BarChart /></Specimen>
            <Specimen name="Big number · no chart" mimic stage=""><BigNumber name="PR merge rate" value="92.4%" cap="Average · last 30 days" delta={1.2} chart={false} /></Specimen>
          </div>
        </Section>

        {/* NAV */}
        <Section id="nav" kicker="05 — Shell" title="Navigation" sub="The workspace sidebar and top bar — the chrome that frames every dashboard. Built from the same nav rows, search pill, and buttons above.">
          <div className="grid" style={{ gridTemplateColumns: '260px 1fr' }}>
            <Specimen name="Sidebar" stage="tight"><GallerySidebar /></Specimen>
            <Specimen name="Top bar" stage="tight"><div style={{ width: '100%' }}><TopBar /><div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-tertiary)', background: 'var(--surface-1)' }}>dashboard content</div></div></Specimen>
          </div>
        </Section>

        {/* DASHBOARD BUILDER */}
        <Section id="dashboard" kicker="06 — Composite" title="Dashboard builder" sub="Name a dashboard, choose the repos it watches, and pick a highlight view for its home-page card — assembled from the same fields, selects, and buttons.">
          <DashboardBuilder />
        </Section>

        {/* MODAL */}
        <Section id="modal" kicker="07 — Composite" title="View builder" sub="The finale: the edit / new-view modal, fully interactive. Pick a chart type in the rail and the options + live preview morph. Built entirely from the components above.">
          <ViewBuilder />
        </Section>

        {/* BUILD ON SHADCN */}
        <Section id="handoff" kicker="08 — Handoff" title="Build it on shadcn" sub="Every component above is a re-themed shadcn/ui primitive. Install the set, paste the theme tokens, then extend each one as noted — this is the path from a stock shadcn app to Tendril.">
          <div className="grid" style={{ gap: 18 }}>
            <Specimen name="1 · Install the set" tag="cli" stage="tight">
              <div style={{ width: '100%', padding: 18 }}>
                <div className="snippet">
                  <div><span className="pr">❯</span><span className="cmd">npx shadcn@latest init</span> <span className="fl">--base-color neutral</span></div>
                  <div><span className="pr">❯</span><span className="cmd">npx shadcn@latest add</span> <span className="fl">button input select tabs switch checkbox radio-group</span></div>
                  <div><span className="pr" style={{ visibility: 'hidden' }}>❯</span><span className="fl">badge popover dropdown-menu dialog card avatar command sonner tooltip</span></div>
                  <div><span className="pr">❯</span><span className="cmd">npm i</span> <span className="fl">lucide-react recharts</span> <span className="cm"># icons + swappable charts</span></div>
                </div>
              </div>
            </Specimen>

            <div className="grid grid--2">
              <Specimen name="2 · Theme tokens" tag="app/globals.css" stage="tight">
                <div style={{ width: '100%', padding: 18 }}>
                  <table className="maptable">
                    <thead><tr><th>Tendril</th><th>shadcn var</th><th>Value</th></tr></thead>
                    <tbody>
                      {[
                        ['Canvas', '--background', '#010102'],
                        ['Card', '--card', '#0f1011'],
                        ['Surface 2', '--secondary', '#141516'],
                        ['Hairline', '--border', '#23252a'],
                        ['Ink', '--foreground', '#f7f8f8'],
                        ['Muted', '--muted-foreground', '#8a8f98'],
                        ['Primary', '--primary', '#f46a3c'],
                        ['Focus', '--ring', '#db5a2e'],
                      ].map((r) => (
                        <tr key={r[1]}><td><span className="sw" style={{ background: r[2] }} />{r[0]}</td><td className="var">{r[1]}</td><td>{r[2]}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Specimen>
              <Specimen name="Radius · type · rules" tag="tailwind.config" stage="tight">
                <div style={{ width: '100%', padding: '18px 20px' }}>
                  <ul className="buildcard" style={{ background: 'transparent', border: 0, padding: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                      <>Set <code>--radius: 8px</code> — buttons & inputs. Cards 12, modals 16, pills 9999.</>,
                      <>Fonts: <code>Roboto</code> sans (400–700), <code>JetBrains Mono</code> for numbers, IDs, code.</>,
                      <>Add custom colors: <code>success</code>, the <code>label-*</code> data palette, and a dev-only <code>teal</code>.</>,
                      <>Dark only — no <code>.light</code>. Orange is the one chrome accent; teal lives only in ⌘K / terminal.</>,
                      <>No gradients, glows, or shadows except floating menus & modals. Sentence case, no emoji.</>,
                    ].map((m, i) => <li key={i} style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-text)', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-muted)' }}><span style={{ flex: 'none', width: 5, height: 5, borderRadius: 9999, background: 'var(--primary)', marginTop: 7 }} />{m}</li>)}
                  </ul>
                </div>
              </Specimen>
            </div>

            <div>
              <div className="buildnote">3 · Extend each primitive</div>
              <div className="buildgrid">
                {[
                  ['Button', 'button', [<>Add <code>primary</code> (orange), <code>secondary</code>, <code>ghost</code>, <code>danger</code> variants + <code>icon</code>/sm/lg sizes.</>, <>8px radius, never pill. Hover lightens; focus = orange ring.</>]],
                  ['Input', 'input', [<>Surface-1 fill, hairline border.</>, <>Focus = <code>border-strong</code> + 2px orange ring via box-shadow.</>]],
                  ['Select', 'select / dropdown-menu', [<>Menu on surface-3, strong hairline, soft shadow.</>, <>Selected = orange check in a <b>fixed-width slot</b> so labels never shift. Keep the Radix portal.</>]],
                  ['Tabs', 'tabs', [<>Add an <b>underline</b> variant (orange active underline) beside the pill style.</>, <>Underline tabs drive the date-range control.</>]],
                  ['Switch', 'switch', [<>Orange track when on.</>, <>Render as <code>[switch] Label</code>; dim the label (ink-tertiary) when off.</>]],
                  ['Badge', 'badge', [<>Neutral + tinted status badges from the <code>label-*</code> palette.</>, <>Add a mono ▲/▼ delta pill (green up / red down) for charts.</>]],
                  ['Date range', 'tabs + input[date]', [<>Underline tabs <code>7D 30D 90D Since</code>.</>, <>Constant-height <code>from → now</code> row: locked & dimmed for presets, editable on Since. No "to" date.</>]],
                  ['Color picker', 'popover', [<>8-col swatch grid; selected shows a white check (no ring).</>, <>Reused as the data-point <b>letter badge</b> — click "A" to recolor.</>]],
                  ['Toast', 'sonner', [<>Terminal background; success = green check.</>, <>Render view names as an inline mono <code>&lt;code&gt;</code> chip.</>]],
                  ['Command', 'command', [<>⌘K palette; orange active row + accent icon.</>, <>Actions: create view, go to dashboard, connect repo, sync.</>]],
                  ['Repo & view cards', 'card', [<>RepoCard: owner monogram logo tinted from the series color + color-dot picker.</>, <>ViewCards: <code>.viz</code> frames with delta-pill headers.</>]],
                  ['View builder', 'dialog', [<>Type rail + <b>config that morphs per chart type</b> + live preview.</>, <>Big Number: sparkline toggle <b>off by default</b> → centered number. Data points are one line each.</>]],
                  ['Charts', 'recharts (boundary)', [<>Keep renderers behind a thin <code>&lt;Chart kind data color&gt;</code> wrapper.</>, <>Series order: orange → blue → purple → green → … teal last. Swap in custom renderers later.</>]],
                ].map(([name, base, mods]) => (
                  <div className="buildcard" key={name}>
                    <div className="buildcard__h">
                      <span className="buildcard__name">{name}</span>
                      <span className="buildcard__base"><span className="lt">shadcn/</span><b>{base}</b></span>
                    </div>
                    <ul>{mods.map((m, i) => <li key={i}><span className="b" />{m}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <footer style={{ padding: '40px 56px 72px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-tertiary)' }}>
          <Icon name="sprout" size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Tendril component library · Linear design system</span>
        </footer>
      </main>
    </div>
  );
}

// ---- Small stateful demos ----
function MenuDemo() {
  const [v, setV] = React.useState('open_prs');
  return <div style={{ width: '100%' }}><Field label="Metric"><Select value={v} options={T_METRICS} onChange={setV} /></Field></div>;
}
function RepoSelectDemo() {
  const [v, setV] = React.useState(['r1', 'r2']);
  return <div style={{ width: '100%' }}><Field label="Repositories"><RepoSelect value={v} onChange={setV} /></Field></div>;
}
function TabsDemo() {
  const [t, setT] = React.useState('monthly');
  const [s, setS] = React.useState('grouped');
  return (<>
    <PillTabs value={t} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} onChange={setT} />
    <Segmented value={s} options={[{ value: 'grouped', label: 'Grouped' }, { value: 'stacked', label: 'Stacked' }]} onChange={setS} />
    <Segmented mono value={s} options={[{ value: 'grouped', label: '7D' }, { value: 'stacked', label: '30D' }]} onChange={setS} />
  </>);
}
function DateRangeDemo() {
  const [r, setR] = React.useState({ range: 30, mode: 'preset', from: '', to: '' });
  return <div style={{ width: '100%' }}><DateRange value={r.range} mode={r.mode} from={r.from} to={r.to} onChange={(p) => setR(s => ({ ...s, ...p }))} /></div>;
}
function ToggleDemo() {
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(false);
  return (<>
    <Toggle value={a} onChange={setA} label={a ? 'Compare vs. previous' : 'Off'} />
    <Toggle value={b} onChange={setB} label={b ? 'Show markers' : 'Hide markers'} />
  </>);
}
function ChoiceDemo() {
  const [c, setC] = React.useState(true);
  const [r, setR] = React.useState('total');
  return (<>
    <div className="specimen__row"><label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink-muted)', fontSize: 13.5 }}><Checkbox checked={c} onChange={setC} /> Include private repos</label></div>
    <div className="specimen__row" style={{ gap: 18 }}>
      {['total', 'average', 'latest'].map(o => <label key={o} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--ink-muted)', fontSize: 13.5, textTransform: 'capitalize' }}><Radio checked={r === o} onChange={() => setR(o)} /> {o}</label>)}
    </div>
  </>);
}
function SwatchDemo() {
  const [c, setC] = React.useState('#f46a3c');
  return <div style={{ width: '100%' }}><Field label="Series color"><ColorSelect value={c} onChange={setC} /></Field></div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

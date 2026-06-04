// t-primitives.jsx — reusable controls in the Linear system. Exposed on window.

// Shared mock palette for swatches / series colors (drawn from the DS label palette)
const T_COLORS = ['#f46a3c', '#4ea7fc', '#b59aff', '#4cb782', '#f2c94c', '#1fb8a6', '#eb5757', '#fc7840'];
window.T_COLORS = T_COLORS;

// ---- Outside-click popover ----
function useOutside(open, onClose) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => {if (ref.current && !ref.current.contains(e.target)) onClose();};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);
  return ref;
}

// ---- Floating menu: portals to <body> with fixed positioning so it escapes
// any clipping/scroll container (e.g. the modal config panel). Closes on
// outside click, scroll, or resize. ----
function Floating({ anchorRef, open, onClose, align = 'left', width, children }) {
  const menuRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!open || !anchorRef.current) {setPos(null);return;}
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 5, left: r.left, right: window.innerWidth - r.right, width: r.width });
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {if (!anchorRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) onClose();};
    const close = () => onClose();
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {document.removeEventListener('mousedown', onDoc);window.removeEventListener('scroll', close, true);window.removeEventListener('resize', close);};
  }, [open]);
  if (!open || !pos) return null;
  return ReactDOM.createPortal(
    <div ref={menuRef} className="menu" style={{ position: 'fixed', top: pos.top, left: align === 'right' ? undefined : pos.left, right: align === 'right' ? pos.right : undefined, minWidth: width || pos.width, zIndex: 1000 }}>{children}</div>,
    document.body
  );
}

// ---- Button ----
function Button({ variant = 'secondary', size, icon, iconRight, children, ...rest }) {
  const cls = ['btn', 'btn--' + variant];
  if (size) cls.push('btn--' + size);
  if (!children) cls.push('btn--icon');
  return (
    <button className={cls.join(' ')} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 17 : 15} stroke={1.7} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} stroke={1.7} />}
    </button>);

}

// ---- Field + input ----
function Field({ label, opt, children }) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}{opt && <span className="opt"> · optional</span>}</span>}
      {children}
    </label>);

}
function Input({ sm, ...rest }) {return <input className={'input' + (sm ? ' input--sm' : '')} {...rest} />;}

function Search({ placeholder = 'Search', kbd = '⌘K', value, onChange }) {
  return (
    <div className="search">
      <Icon name="search" size={15} />
      <input placeholder={placeholder} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined} />
      {kbd && <span className="kbd">{kbd}</span>}
    </div>);

}

function Affix({ pre, post, ...rest }) {
  return (
    <div className={'affix' + (pre ? ' has-pre' : '') + (post ? ' has-post' : '')}>
      {pre && <span className="affix__pre">{pre}</span>}
      <input className="input" {...rest} />
      {post && <span className="affix__post">{post}</span>}
    </div>);

}

// ---- Select / dropdown ----
function Select({ value, options, onChange, sm, align, placeholder = 'Select…', renderTrigger }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const sel = options.find((o) => o.id === value);
  return (
    <div className="select" ref={ref}>
      <button className={'select__trigger' + (sm ? ' sm' : '')} onClick={() => setOpen((o) => !o)}>
        {renderTrigger ? renderTrigger(sel) : <span className="select__val">{sel ? sel.label : placeholder}</span>}
        <span className="select__ico"><Icon name="chevron-down" size={13} /></span>
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} align={align}>
        <div className="menu__list">
          {options.map((o) => {
            const on = o.id === value;
            return (
              <button key={o.id} className={'menu__item' + (on ? ' on' : '')} onClick={() => {onChange(o.id);setOpen(false);}}>
                {o.icon && <Icon name={o.icon} size={14} style={{ color: on ? 'var(--primary)' : 'var(--ink-tertiary)' }} />}
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                {o.hint && <span className="hint">{o.hint}</span>}
                <span style={{ width: 14, flex: 'none', display: 'inline-flex', justifyContent: 'center', color: on ? 'var(--primary)' : 'transparent' }}><Icon name="check" size={13} stroke={2.2} /></span>
              </button>);
          })}
        </div>
      </Floating>
    </div>);

}

// ---- Segmented control ----
function Segmented({ value, options, onChange, mono }) {
  return (
    <div className={'seg' + (mono ? ' mono' : '')}>
      {options.map((o) =>
      <button key={o.value} className={'seg__btn' + (o.value === value ? ' on' : '')} onClick={() => onChange(o.value)}>{o.label}</button>
      )}
    </div>);

}

// ---- Pill tabs ----
function PillTabs({ value, options, onChange }) {
  return (
    <div className="pilltabs">
      {options.map((o) =>
      <button key={o.value} className={'pilltab' + (o.value === value ? ' on' : '')} onClick={() => onChange(o.value)}>{o.label}</button>
      )}
    </div>);

}

// ---- Date-range: underline tabs + always-on "from → now" row (constant height) ----
const fmtISO = (d) => d.toISOString().slice(0, 10);
function DateRange({ value, mode, from, onChange }) {
  const presets = [{ v: 7, l: '7D' }, { v: 30, l: '30D' }, { v: 90, l: '90D' }];
  const since = mode === 'since' || mode === 'custom';
  const today = fmtISO(new Date());
  const presetFrom = () => {const f = new Date();f.setDate(f.getDate() - ((value || 30) - 1));return fmtISO(f);};
  const shownFrom = since ? from || '' : presetFrom();
  const goSince = () => onChange({ mode: 'since', from: from || presetFrom(), range: value });
  const onDate = (val) => {
    let range = value;
    if (val) {const d = Math.round((Date.now() - new Date(val)) / 86400000) + 1;if (d > 0) range = d;}
    onChange({ mode: 'since', from: val, range });
  };
  return (
    <div>
      <div className="utabs">
        {presets.map((p) => <button key={p.v} className={'utab' + (!since && value === p.v ? ' on' : '')} onClick={() => onChange({ mode: 'preset', range: p.v })}>{p.l}</button>)}
        <button className={'utab' + (since ? ' on' : '')} onClick={goSince}>Custom</button>
      </div>
      <div className="daterange">
        <input type="date" value={shownFrom} max={today} disabled={!since} onChange={(e) => onDate(e.target.value)} title={since ? 'Pick a start date' : 'Preset window start — switch to Since to edit'} />
        <span className="sep"><Icon name="arrow-right" size={14} /></span>
        <span className="now-chip"><span className="live" />now</span>
      </div>
    </div>);

}

// ---- Toggle ----
function Toggle({ value, onChange, label }) {
  return (
    <button className={'toggle' + (value ? ' on' : '')} onClick={() => onChange(!value)} type="button">
      <span className="toggle__track"><span className="toggle__knob" /></span>
      {label != null && <span className="toggle__lbl">{label}</span>}
    </button>);

}

// ---- Checkbox / radio ----
function Checkbox({ checked, onChange }) {
  return (
    <span className={'checkbox' + (checked ? ' on' : '')} onClick={(e) => {e.stopPropagation();onChange(!checked);}}>
      <Icon name="check" size={11} stroke={2.6} />
    </span>);

}
function Radio({ checked, onChange }) {
  return <span className={'radio' + (checked ? ' on' : '')} onClick={(e) => {e.stopPropagation();onChange(!checked);}} />;
}

// ---- Color swatch picker (inline grid) ----
function Swatches({ value, onChange, colors = T_COLORS }) {
  return (
    <div className="swatches">
      {colors.map((c) =>
      <button key={c} className={'swatch' + (c === value ? ' on' : '')} style={{ background: c }} onClick={() => onChange(c)} title={c}>
          {c === value && <Icon name="check" size={13} stroke={2.6} style={{ color: '#fff' }} />}
        </button>
      )}
    </div>);

}

// ---- Color picker (popover swatch) ----
function ColorDot({ value, onChange, colors = T_COLORS }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  return (
    <div className="cp" ref={ref}>
      <button className="cp__btn" onClick={() => setOpen((o) => !o)} title="Series color"><span className="cp__dot" style={{ background: value }} /></button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} align="right" width="auto">
        <div className="cp__grid">
          {colors.map((c) =>
          <button key={c} className={'cp__cell' + (c === value ? ' on' : '')} onClick={() => {onChange(c);setOpen(false);}}>
              <span className="cp__dot" style={{ background: c }}>{c === value && <Icon name="check" size={11} stroke={3} style={{ color: '#fff' }} />}</span>
            </button>
          )}
        </div>
      </Floating>
    </div>);

}

// ---- Color select (labeled dropdown → swatch grid) ----
function ColorSelect({ value, onChange, colors = T_COLORS }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  return (
    <div className="select" ref={ref} style={{ width: '100%' }}>
      <button className="select__trigger" onClick={() => setOpen((o) => !o)}>
        <span className="cp__dot" style={{ width: 14, height: 14, borderRadius: 4, background: value, flex: 'none' }} />
        <span className="select__val mono" style={{ fontSize: 13 }}>{String(value).toUpperCase()}</span>
        <span className="select__ico"><Icon name="chevron-down" size={13} /></span>
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)}>
        <div className="cp__grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
          {colors.map((c) =>
          <button key={c} className={'cp__cell' + (c === value ? ' on' : '')} onClick={() => {onChange(c);setOpen(false);}}>
              <span className="cp__dot" style={{ background: c }}>{c === value && <Icon name="check" size={11} stroke={3} style={{ color: '#fff' }} />}</span>
            </button>
          )}
        </div>
      </Floating>
    </div>);

}

// ---- Badges / change pills / tags / avatars ----
function Badge({ children, dot, color }) {
  if (color) return <span className="badge badge--status" style={{ '--c': color }}>{dot !== false && <span className="dot" />}{children}</span>;
  return <span className="badge">{dot && <span className="dot" />}{children}</span>;
}
function Change({ value, suffix = '%', abs }) {
  const v = Number(value) || 0;
  const dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  const sign = v > 0 ? '+' : '';
  const num = abs != null ? abs : Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : Math.abs(v).toFixed(1);
  return (
    <span className={'change change--' + dir}>
      {dir !== 'flat' && <Icon name={dir === 'up' ? 'chevron-up' : 'chevron-down'} size={13} stroke={2.4} />}
      {sign}{num}{suffix}
    </span>);

}
function Tag({ label, color }) {
  return <span className="tag">{color && <span className="dot" style={{ background: color }} />}{label}</span>;
}
function Avatar({ who, img, size = 24 }) {
  if (img) return <img className="avatar avatar--img" src={img} alt="" style={{ width: size, height: size }} />;
  return <span className="avatar" style={{ width: size, height: size }}>{who}</span>;
}

Object.assign(window, {
  Button, Field, Input, Search, Affix, Select, Segmented, PillTabs, DateRange,
  Toggle, Checkbox, Radio, Swatches, ColorDot, ColorSelect, Badge, Change, Tag, Avatar, useOutside, Floating
});
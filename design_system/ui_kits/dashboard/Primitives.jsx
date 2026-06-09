// Primitives.jsx — Button, Badge, Avatar, IconBtn, Input, Modal, Filters
// Mirrors `design-system/components` from apps/backoffice:
//   - Button sizes: lg | md | sm | xs  (matches ButtonGroup size map)
//   - Badge variants: positive | negative | waiting | informative | neutral | progress
// Colors use tokens from ../../colors_and_type.css — do NOT inline new hexes.

const T = {
  // Brand
  primary:      '#0746CA', primaryStrong: '#0C3698', primaryHeavy: '#122666',
  // Label
  fg1: '#0F172A', fg2: '#293548', fg3: '#64748B', fg4: '#94A3B8', fgDisable: '#CBD5E1',
  // Surface
  bg: '#FFFFFF', surfaceNormal: '#F8FAFC', surfaceStrong: '#EAEFF5', surfaceHeavy: '#E2E8F0',
  // Status
  positive:'#00C592', positiveLight:'#DFFBED',
  warning:'#FF6200',  warningLight:'#FFEFD3',
  negative:'#F91C1C', negativeLight:'#FFEFEF',
  progress:'#1890FF', progressLight:'#E6F7FF',
  informative:'#3176FD', informativeLight:'#F2F6FF',
  // Neutral badge tones (slate)
  neutralFg:'#293548', neutralBg:'#F1F5F9', neutralBr:'#CBD5E1',
  // Strokes
  borderSubtle:'#E2E8F0', borderDefault:'#CBD5E1',
};

// Button — type: 'solid' | 'line' | 'text'  /  usage: 'primary' | 'secondary' | 'tertiary' | 'negative'
const Button = ({ type='solid', usage='primary', size='md', children, onClick, disabled, style, ...rest }) => {
  const base = {
    all: 'unset', boxSizing:'border-box', display:'inline-flex',
    alignItems:'center', justifyContent:'center', gap:6,
    borderRadius:6, cursor: disabled?'not-allowed':'pointer',
    transition:'background 150ms cubic-bezier(0.2,0,0,1), box-shadow 150ms cubic-bezier(0.2,0,0,1)',
    fontFamily:'Pretendard, -apple-system, sans-serif', fontWeight:600,
    whiteSpace:'nowrap',
  };
  const sizes = {
    lg: { minHeight:48, padding:'16px',      fontSize:14, lineHeight:'16px', letterSpacing:'0.175px' },
    md: { minHeight:40, padding:'12px 16px', fontSize:14, lineHeight:'16px', letterSpacing:'0.175px' },
    sm: { minHeight:36, padding:'8px 14px',  fontSize:12, lineHeight:'14px', letterSpacing:'0.15px' },
    xs: { minHeight:28, padding:'6px 12px',  fontSize:11, lineHeight:'14px', letterSpacing:'0.138px' },
  };
  const D = '#122666'; // Semantic/Primary/Heavy
  // style matrix — add new combinations here as the design system grows
  // Confirmed from Figma V.2 — add new combinations when designed
  const matrix = {
    'solid-primary':   disabled ? { background:'#64748B', color:'#94A3B8' }
                                : { background:D, color:'#FFFFFF' },
    'solid-secondary': disabled ? { background:T.surfaceHeavy, color:'#94A3B8' }
                                : { background:T.surfaceStrong, color:D },
    'line-tertiary':   disabled ? { background:T.bg, color:'#94A3B8', boxShadow:`inset 0 0 0 1px ${T.surfaceStrong}` }
                                : { background:T.bg, color:D, boxShadow:`inset 0 0 0 1px ${T.surfaceStrong}` },
    'text-primary':    disabled ? { background:'transparent', color:'#94A3B8', padding:'12px' }
                                : { background:'transparent', color:D, padding:'12px' },
  };
  const variantStyle = matrix[`${type}-${usage}`] || matrix['solid-primary'];
  return <button {...rest} disabled={disabled} onClick={onClick}
    style={{...base, ...sizes[size], ...variantStyle, ...style}}>{children}</button>;
};

const Badge = ({ variant='neutral', children }) => {
  // Semantic status colors from new DS tokens
  const map = {
    positive:   { c:T.positive,     bg:T.positiveLight },
    negative:   { c:T.negative,     bg:T.negativeLight },
    waiting:    { c:T.warning,      bg:T.warningLight },
    informative:{ c:T.informative,  bg:T.informativeLight },
    neutral:    { c:T.neutralFg,    bg:T.neutralBg },
    progress:   { c:T.progress,     bg:T.progressLight },
  };
  const s = map[variant];
  return <span style={{
    display:'inline-flex', alignItems:'center', height:22, padding:'0 10px',
    borderRadius:999, color:s.c, background:s.bg,
    fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:12, fontWeight:600, lineHeight:'18px',
    letterSpacing:'0.06px', whiteSpace:'nowrap',
  }}>{children}</span>;
};

// Icon names use Phosphor PascalCase (e.g. 'ArrowRight', 'DotsThreeVertical')
// matching the SVG filenames in assets/icons/
const Icon = ({ name, size=20, color=T.fg2 }) => (
  <span style={{
    display:'inline-block', width:size, height:size,
    WebkitMask:`url(../../assets/icons/${name}.svg) center/contain no-repeat`,
    mask:`url(../../assets/icons/${name}.svg) center/contain no-repeat`,
    background:color, flexShrink:0,
  }}/>
);

const IconBtn = ({ name, onClick, active, ariaLabel }) => (
  <button aria-label={ariaLabel} onClick={onClick} style={{
    all:'unset', boxSizing:'border-box', display:'inline-flex', alignItems:'center',
    justifyContent:'center', width:36, height:36, borderRadius:8,
    background: active?T.surfaceStrong:'transparent', cursor:'pointer',
    transition:'background 120ms cubic-bezier(0.2,0,0,1)',
  }} onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=T.surfaceNormal; }}
     onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
    <Icon name={name} size={20} color={T.fg2}/>
  </button>
);

const Avatar = ({ name='SB', size=32, bg=T.primary }) => (
  <div style={{
    width:size, height:size, borderRadius:999, background:bg,
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    color:'#fff', fontFamily:'Pretendard, -apple-system, sans-serif', fontWeight:700,
    fontSize: Math.round(size*0.38), letterSpacing:'0.02em', flexShrink:0,
  }}>{name}</div>
);

// Input — V.2 tokens: h-40, r-6, enabled border #E2E8F0, focus border #122666, no focus ring
// Props: iconLeft, iconRight, onClear (shows XCircle when value present), unit (suffix like "KRW"),
//        label (top label text), helperText (bottom), isError, disabled
const Input = ({ placeholder, value, onChange, iconLeft, iconRight, onClear, unit, label, helperText, width='100%', isError, disabled }) => {
  const [focus, setFocus] = React.useState(false);
  const border = disabled ? T.borderDefault          // #CBD5E1
               : isError  ? T.negative               // #F91C1C
               : focus    ? '#122666'                 // Primary/Heavy
               :             T.borderSubtle;          // #E2E8F0 enabled
  const bg = disabled ? T.surfaceStrong : T.bg;
  const helperColor = disabled ? T.fgDisable : isError ? T.negative : T.fg3;
  const showClear = onClear && value && !disabled;
  const iconColor = disabled ? T.fgDisable : T.fg4;

  return (
    <div style={{ display:'inline-flex', flexDirection:'column', width, gap:6 }}>
      {label && (
        <span style={{ fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14, lineHeight:'20px', color:T.fg3, letterSpacing:'0.07px' }}>
          {label}
        </span>
      )}
      <div style={{
        display:'flex', alignItems:'center',
        height:40, padding:'0 16px',
        border:`1px solid ${border}`, background:bg, borderRadius:6,
        transition:'border 120ms cubic-bezier(0.2,0,0,1)',
      }}>
        {iconLeft && <span style={{ marginRight:8, display:'inline-flex', flexShrink:0 }}><Icon name={iconLeft} size={16} color={iconColor}/></span>}
        <input value={value} onChange={onChange} placeholder={placeholder}
          onFocus={()=>{ if (!disabled) setFocus(true); }} onBlur={()=>setFocus(false)}
          disabled={disabled}
          style={{
            flex:1, border:0, outline:0, background:'transparent',
            fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14, lineHeight:'20px',
            color: disabled ? T.fgDisable : T.fg1, letterSpacing:'0.07px', minWidth:0,
            cursor: disabled ? 'not-allowed' : 'text',
          }}/>
        {unit && (
          <span style={{ fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14, color: disabled ? T.fgDisable : T.fg3, marginLeft:8, whiteSpace:'nowrap', flexShrink:0 }}>
            {unit}
          </span>
        )}
        {showClear && (
          <button onClick={onClear} style={{ all:'unset', display:'inline-flex', cursor:'pointer', marginLeft:4, flexShrink:0 }}>
            <Icon name="XCircle" size={16} color={T.fg4}/>
          </button>
        )}
        {iconRight && !showClear && (
          <span style={{ marginLeft:8, display:'inline-flex', flexShrink:0 }}><Icon name={iconRight} size={16} color={iconColor}/></span>
        )}
      </div>
      {helperText && (
        <span style={{ fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:11, lineHeight:'16px', letterSpacing:'0.055px', color:helperColor }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

// --- Select: dropdown field with searchable list --------------------------
// SelectOption is an internal row rendered inside Select's dropdown
const SelectOption = ({ label, isSelected, onSelect }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all:'unset', boxSizing:'border-box', display:'flex', alignItems:'center', gap:8,
        height:40, paddingLeft:16, paddingRight:8,
        background: hovered ? T.informativeLight : T.bg,
        borderRadius:4, cursor:'pointer', width:'100%',
        transition:'background 100ms cubic-bezier(0.2,0,0,1)',
      }}
    >
      <span style={{
        flex:1, fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14,
        lineHeight:'20px', color:T.fg1, letterSpacing:'0.07px',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0,
      }}>
        {label}
      </span>
      {isSelected && (
        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:20, flexShrink:0 }}>
          <Icon name="Check" size={16} color={T.fg2}/>
        </span>
      )}
    </button>
  );
};

// Select — V.2 tokens: h-40, r-6, open border #122666, dropdown Shadow100
// Props: value, onChange(val), options=[{value,label}], placeholder,
//        label, helperText, isError, disabled, searchable(default:true), width
const Select = ({ value, onChange, options=[], placeholder='선택하세요', label, helperText, isError, disabled, searchable=true, width='100%' }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const fieldBorder = disabled ? T.borderDefault
                    : isError  ? T.negative
                    : open     ? '#122666'
                    :             T.borderSubtle;
  const fieldBg = disabled ? T.surfaceStrong : T.bg;
  const fieldTextColor = (!selected || disabled) ? T.fgDisable : T.fg1;
  const helperColor = disabled ? T.fgDisable : isError ? T.negative : T.fg3;

  const handleSelect = (val) => { onChange && onChange(val); setOpen(false); setSearch(''); };
  const handleToggle = () => { if (!disabled) { setOpen(o => !o); setSearch(''); } };

  return (
    <div ref={ref} style={{ display:'inline-flex', flexDirection:'column', width, gap:4, position:'relative' }}>
      {label && (
        <span style={{ fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14, lineHeight:'20px', color:T.fg3, letterSpacing:'0.07px' }}>
          {label}
        </span>
      )}
      <button
        disabled={disabled}
        onClick={handleToggle}
        style={{
          all:'unset', boxSizing:'border-box', display:'flex', alignItems:'center',
          height:40, paddingLeft:16, paddingRight:8,
          border:`1px solid ${fieldBorder}`, background:fieldBg, borderRadius:6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition:'border 120ms cubic-bezier(0.2,0,0,1)',
        }}
      >
        <span style={{
          flex:1, fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14,
          lineHeight:'20px', color:fieldTextColor, letterSpacing:'0.07px',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0,
        }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:20, flexShrink:0 }}>
          <Icon name={open ? 'CaretUp' : 'CaretDown'} size={16} color={disabled ? T.fgDisable : T.fg2}/>
        </span>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:44, left:0, right:0, zIndex:100,
          background:T.bg, border:`1px solid ${T.borderSubtle}`, borderRadius:6,
          boxShadow:'0 2px 8px 0 rgba(15,23,42,0.08)',
          padding:8, display:'flex', flexDirection:'column', gap:8,
        }}>
          {searchable && (
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              height:40, padding:8,
              background:T.surfaceNormal, borderRadius:4, flexShrink:0,
            }}>
              <Icon name="MagnifyingGlass" size={16} color={T.fg4}/>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="검색어를 입력하세요."
                autoFocus
                style={{
                  flex:1, border:0, outline:0, background:'transparent',
                  fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:12,
                  lineHeight:'18px', color:T.fg1, letterSpacing:'0.06px', minWidth:0,
                }}
              />
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column' }}>
            {filtered.map(o => (
              <SelectOption key={o.value} label={o.label} isSelected={o.value === value} onSelect={() => handleSelect(o.value)}/>
            ))}
            {filtered.length === 0 && (
              <div style={{ height:40, display:'flex', alignItems:'center', paddingLeft:16, fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14, color:T.fg4 }}>
                결과 없음
              </div>
            )}
          </div>
        </div>
      )}

      {helperText && (
        <span style={{ fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:11, lineHeight:'16px', letterSpacing:'0.055px', color:helperColor }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

// --- Filters: segmented pill group used above data tables -----------------
const Filters = ({ value, onChange, options }) => (
  <div style={{padding:'0 32px 16px', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
    {options.map(o => {
      const active = o.key===value;
      return <button key={o.key} onClick={()=>onChange(o.key)} style={{
        all:'unset', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
        padding:'6px 12px', borderRadius:999,
        background: active?T.primary:T.bg,
        color: active?'#fff':T.fg2,
        boxShadow: active?'none':`inset 0 0 0 1px ${T.borderSubtle}`,
        fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:13, fontWeight:600, letterSpacing:'0.065px',
        transition:'background 120ms cubic-bezier(0.2,0,0,1)',
      }}>
        {o.label}
        <span style={{
          fontSize:11, padding:'1px 6px', borderRadius:999, fontWeight:700,
          background: active?'rgba(255,255,255,0.22)':T.surfaceStrong,
          color: active?'#fff':T.fg3,
          minWidth:18, textAlign:'center',
        }}>{o.count}</span>
      </button>;
    })}
  </div>
);

// --- Modal: centered confirm dialog ---------------------------------------
const Modal = ({ open, onClose, onConfirm, title, body, confirmLabel='Confirm', cancelLabel='Cancel' }) => {
  if (!open) return null;
  return <>
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,0.35)', backdropFilter:'blur(4px)',
      zIndex:60, animation:'sbFade 150ms cubic-bezier(0.2,0,0,1)',
    }}/>
    <div role="dialog" aria-modal="true" style={{
      position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      width:440, maxWidth:'calc(100vw - 32px)', background:T.bg, borderRadius:16,
      boxShadow:'0 0 1px 0 rgba(15,23,42,0.08), 0 6px 24px 6px rgba(15,23,42,0.16)',
      padding:24, zIndex:61, animation:'sbPop 180ms cubic-bezier(0.2,0,0,1)',
    }}>
      <div style={{fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:20, fontWeight:700, color:T.fg1, letterSpacing:'-0.005em'}}>{title}</div>
      <div style={{fontFamily:'Pretendard, -apple-system, sans-serif', fontSize:14, lineHeight:'22px', color:T.fg3, marginTop:10}}>{body}</div>
      <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:24}}>
        <Button type="solid" usage="secondary" onClick={onClose}>{cancelLabel}</Button>
        <Button type="solid" usage="primary" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </>;
};

Object.assign(window, { Button, Badge, Icon, IconBtn, Avatar, Input, Select, Filters, Modal, T });

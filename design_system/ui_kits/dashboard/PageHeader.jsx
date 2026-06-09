// PageHeader.jsx + Filters.jsx
const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, padding:'28px 32px 16px'}}>
    <div>
      <h1 style={{margin:0, fontFamily:'Pretendard,sans-serif', fontSize:26, lineHeight:'40px', fontWeight:700, color:'#0F172A', letterSpacing:'-0.005em'}}>{title}</h1>
      {subtitle && <div style={{fontFamily:'Pretendard,sans-serif', fontSize:14, lineHeight:'20px', color:'#64748B', marginTop:2}}>{subtitle}</div>}
    </div>
    <div style={{display:'flex', gap:8}}>{actions}</div>
  </div>
);

const Filters = ({ value, onChange, options }) => (
  <div style={{display:'flex', alignItems:'center', gap:16, padding:'4px 32px 20px', flexWrap:'wrap'}}>
    <div style={{display:'flex', gap:6}}>
      {options.map(o => {
        const isActive = value === o.key;
        return <button key={o.key} onClick={()=>onChange(o.key)} style={{
          all:'unset', boxSizing:'border-box', display:'inline-flex', alignItems:'center',
          height:32, padding:'0 12px', borderRadius:6, cursor:'pointer',
          background: isActive?'#0746CA':'#fff',
          color: isActive?'#fff':'#293548',
          border: isActive?'1px solid #0746CA':'1px solid #E2E8F0',
          fontFamily:'Pretendard,sans-serif', fontWeight: isActive?600:500, fontSize:13, lineHeight:'16px',
          transition:'all 0.15s',
        }}>{o.label}{o.count!=null && <span style={{marginLeft:6, opacity:0.8}}>{o.count}</span>}</button>;
      })}
    </div>

    <div style={{flex:1}}/>

    <div style={{display:'inline-flex', alignItems:'center', gap:8, height:32, padding:'0 12px', border:'1px solid #E2E8F0', borderRadius:6, background:'#fff', color:'#293548', fontFamily:'Pretendard,sans-serif', fontSize:13, fontWeight:500}}>
      <Icon name="Calendar" size={16} color="#64748B"/>
      Mar 1 – Mar 31, 2026
      <Icon name="CaretDown" size={14} color="#94A3B8"/>
    </div>
    <Button type="solid" usage="secondary" size="sm"><Icon name="DownloadSimple" size={14} color="#293548"/>Export</Button>
  </div>
);

Object.assign(window, { PageHeader, Filters });

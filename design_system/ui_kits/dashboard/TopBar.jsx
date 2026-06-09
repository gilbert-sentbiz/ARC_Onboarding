// TopBar.jsx — breadcrumbs, search, actions, avatar
const TopBar = ({ screenLabel }) => {
  const [q, setQ] = React.useState('');
  return <header style={{
    height:64, flexShrink:0, background:'#fff',
    borderBottom:'1px solid #E2E8F0',
    display:'flex', alignItems:'center', padding:'0 24px', gap:16,
  }}>
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <span style={{fontFamily:'Pretendard,sans-serif', fontSize:13, color:'#94A3B8', fontWeight:500}}>Workspace</span>
      <Icon name="ArrowRight" size={14} color="#CBD5E1"/>
      <span style={{fontFamily:'Pretendard,sans-serif', fontSize:13, color:'#293548', fontWeight:600}}>{screenLabel}</span>
    </div>

    <div style={{flex:1, display:'flex', justifyContent:'center'}}>
      <div style={{width:420, maxWidth:'100%'}}>
        <Input placeholder="Search transactions, counterparties…" iconLeft="MagnifyingGlass" value={q} onChange={e=>setQ(e.target.value)} width="100%"/>
      </div>
    </div>

    <div style={{display:'flex', alignItems:'center', gap:4}}>
      <IconBtn name="Question" ariaLabel="Help"/>
      <div style={{position:'relative'}}>
        <IconBtn name="Bell" ariaLabel="Notifications"/>
        <span style={{
          position:'absolute', top:7, right:7, width:8, height:8,
          borderRadius:999, background:'#F91C1C', border:'2px solid #fff',
        }}/>
      </div>
      <div style={{width:1, height:24, background:'#E2E8F0', margin:'0 8px'}}/>
      <div style={{display:'flex', alignItems:'center', gap:10, paddingRight:4}}>
        <Avatar name="DL" size={32} bg="#0746CA"/>
        <div style={{display:'flex', flexDirection:'column', lineHeight:1.2}}>
          <span style={{fontFamily:'Pretendard,sans-serif', fontSize:13, fontWeight:600, color:'#0F172A'}}>Delphine Lee</span>
          <span style={{fontFamily:'Pretendard,sans-serif', fontSize:11, color:'#64748B', letterSpacing:'0.3px'}}>SENTBE · Admin</span>
        </div>
      </div>
    </div>
  </header>;
};

window.TopBar = TopBar;

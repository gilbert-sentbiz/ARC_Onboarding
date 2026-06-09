// Drawer.jsx + Modal.jsx — overlays
const Drawer = ({ row, open, onClose, onApprove, onReject }) => {
  if (!open || !row) return null;
  return <>
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.3)',
      animation:'sbFade 200ms ease', zIndex:50,
    }}/>
    <aside style={{
      position:'fixed', top:0, right:0, bottom:0, width:440,
      background:'#fff', boxShadow:'0 0 1px 0 rgba(15,23,42,0.08), 0 6px 24px 6px rgba(15,23,42,0.16)',
      zIndex:51, display:'flex', flexDirection:'column',
      animation:'sbSlideIn 200ms ease',
    }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #F1F5F9'}}>
        <div>
          <div style={{fontFamily:'Pretendard,sans-serif', fontSize:22, fontWeight:700, color:'#0F172A', lineHeight:'34px'}}>{row.party}</div>
          <div style={{fontFamily:'ui-monospace,monospace', fontSize:12, color:'#64748B'}}>{row.id}</div>
        </div>
        <IconBtn name="X" onClick={onClose} ariaLabel="Close"/>
      </div>

      <div style={{flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:20}}>
        <div>
          <div style={{fontFamily:'Pretendard,sans-serif', fontSize:11, fontWeight:600, color:'#64748B', letterSpacing:'0.55px', textTransform:'uppercase', marginBottom:6}}>Status</div>
          <Badge variant={row.statusVariant}>{row.status}</Badge>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          {[
            ['Amount', row.amount],
            ['Amount (KRW)', row.amountKrw],
            ['Route', row.route],
            ['Initiated', row.date + ' · 14:32 KST'],
            ['Reference', row.id],
            ['Method', 'Wire · SWIFT'],
          ].map(([k,v]) => (
            <div key={k}>
              <div style={{fontFamily:'Pretendard,sans-serif', fontSize:11, fontWeight:600, color:'#64748B', letterSpacing:'0.55px', textTransform:'uppercase', marginBottom:4}}>{k}</div>
              <div style={{fontFamily:'Pretendard,sans-serif', fontSize:14, fontWeight:500, color:'#0F172A', lineHeight:'20px'}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:12, padding:16}}>
          <div style={{fontFamily:'Pretendard,sans-serif', fontSize:14, fontWeight:600, color:'#293548', marginBottom:10}}>Timeline</div>
          {[
            ['Created', row.date, 'positive'],
            ['FX locked', row.date, 'progress'],
            ['Pending review', 'Awaiting approval', 'waiting'],
          ].map(([t,d,v],i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0'}}>
              <div style={{width:8, height:8, borderRadius:999, background: v==='positive'?'#00A523':v==='progress'?'#1890FF':'#FF9900'}}/>
              <div style={{flex:1, fontFamily:'Pretendard,sans-serif', fontSize:13, color:'#0F172A', fontWeight:500}}>{t}</div>
              <div style={{fontFamily:'Pretendard,sans-serif', fontSize:12, color:'#64748B'}}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'flex', gap:8, padding:'16px 24px', borderTop:'1px solid #F1F5F9', background:'#fff'}}>
        <Button type="solid" usage="secondary" size="md" onClick={onReject}>Reject</Button>
        <div style={{flex:1}}/>
        <Button type="solid" usage="secondary" size="md" onClick={onClose}>Close</Button>
        <Button type="solid" usage="primary" size="md" onClick={onApprove}>Approve</Button>
      </div>
    </aside>
  </>;
};

const Modal = ({ open, onClose, onConfirm, title, body, confirmLabel='Confirm' }) => {
  if (!open) return null;
  return <>
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:60,
      animation:'sbFade 200ms ease',
    }}/>
    <div style={{
      position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      width:440, background:'#fff', borderRadius:16,
      boxShadow:'0 0 1px 0 rgba(15,23,42,0.08), 0 6px 24px 6px rgba(15,23,42,0.16)',
      zIndex:61, padding:28, animation:'sbPop 200ms ease',
    }}>
      <div style={{fontFamily:'Pretendard,sans-serif', fontSize:20, fontWeight:700, color:'#0F172A', lineHeight:'30px'}}>{title}</div>
      <div style={{fontFamily:'Pretendard,sans-serif', fontSize:14, lineHeight:'22px', color:'#293548', marginTop:10}}>{body}</div>
      <div style={{display:'flex', gap:8, marginTop:24, justifyContent:'flex-end'}}>
        <Button type="solid" usage="secondary" onClick={onClose}>Cancel</Button>
        <Button type="solid" usage="primary" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </>;
};

Object.assign(window, { Drawer, Modal });

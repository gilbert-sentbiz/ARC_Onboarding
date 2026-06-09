// DataTable.jsx — transactions table
const DataTable = ({ rows, onRowClick }) => {
  const cols = [
    { key:'id',     label:'Ref',           width:130 },
    { key:'date',   label:'Date',          width:120 },
    { key:'party',  label:'Counterparty',  width:200 },
    { key:'route',  label:'Route',         width:110 },
    { key:'amount', label:'Amount',        width:150, align:'right' },
    { key:'status', label:'Status',        width:120 },
    { key:'act',    label:'',              width:44 },
  ];

  return <div style={{background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden', margin:'0 32px'}}>
    <div style={{display:'flex', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', padding:'0 20px', height:44, alignItems:'center'}}>
      {cols.map(c => (
        <div key={c.key} style={{
          width:c.width, flex: c.key==='party' ? 1 : 'none',
          fontFamily:'Pretendard,sans-serif', fontSize:12, fontWeight:600,
          color:'#64748B', letterSpacing:'0.06px', textAlign:c.align||'left',
          paddingRight:12, textTransform:'uppercase',
        }}>{c.label}</div>
      ))}
    </div>
    {rows.map((r, i) => (
      <div key={r.id} onClick={()=>onRowClick(r)} style={{
        display:'flex', alignItems:'center', padding:'0 20px', height:56,
        borderBottom: i<rows.length-1 ? '1px solid #F1F5F9' : 'none',
        cursor:'pointer', transition:'background 0.12s',
      }}
      onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <div style={{width:130, fontFamily:'ui-monospace,monospace', fontSize:12, color:'#64748B', paddingRight:12}}>{r.id}</div>
        <div style={{width:120, fontFamily:'Pretendard,sans-serif', fontSize:13, color:'#293548', paddingRight:12}}>{r.date}</div>
        <div style={{flex:1, display:'flex', alignItems:'center', gap:10, paddingRight:12}}>
          <Avatar name={r.initials} size={28} bg={r.color||'#64748B'}/>
          <div style={{display:'flex', flexDirection:'column', lineHeight:1.2, minWidth:0}}>
            <span style={{fontFamily:'Pretendard,sans-serif', fontSize:14, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.party}</span>
            <span style={{fontFamily:'Pretendard,sans-serif', fontSize:11, color:'#94A3B8', letterSpacing:'0.3px'}}>{r.partySub}</span>
          </div>
        </div>
        <div style={{width:110, fontFamily:'Pretendard,sans-serif', fontSize:13, color:'#293548', paddingRight:12}}>{r.route}</div>
        <div style={{width:150, textAlign:'right', paddingRight:12}}>
          <div style={{fontFamily:'Pretendard,sans-serif', fontSize:14, fontWeight:600, color:'#0F172A', fontVariantNumeric:'tabular-nums'}}>{r.amount}</div>
          <div style={{fontFamily:'Pretendard,sans-serif', fontSize:11, color:'#94A3B8', fontVariantNumeric:'tabular-nums'}}>{r.amountKrw}</div>
        </div>
        <div style={{width:120, paddingRight:12}}><Badge variant={r.statusVariant}>{r.status}</Badge></div>
        <div style={{width:44, display:'flex', justifyContent:'flex-end'}}>
          <IconBtn name="DotsThreeVertical" ariaLabel="Row actions"/>
        </div>
      </div>
    ))}
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1px solid #F1F5F9'}}>
      <span style={{fontFamily:'Pretendard,sans-serif', fontSize:12, color:'#64748B'}}>Showing 1–{rows.length} of 248</span>
      <div style={{display:'flex', gap:4}}>
        <IconBtn name="ArrowLeft" ariaLabel="Previous"/>
        <div style={{display:'flex', alignItems:'center', padding:'0 8px', fontFamily:'Pretendard,sans-serif', fontSize:13, color:'#293548'}}>1 of 10</div>
        <IconBtn name="ArrowRight" ariaLabel="Next"/>
      </div>
    </div>
  </div>;
};

window.DataTable = DataTable;

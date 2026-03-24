import { useState, useEffect, useCallback } from "react";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SHOP = { name: "Royal Cuts", tagline: "Where Style Meets Tradition", address: "12, MG Road, Puducherry", phone: "9876543210" };
const ADMIN_PIN = "1234";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const SERVICES = [
  { id:1, name:"Haircut",      icon:"✂️", price:150, duration:"30 min" },
  { id:2, name:"Hair Wash",    icon:"🚿", price:100, duration:"20 min" },
  { id:3, name:"Beard Trim",   icon:"🪒", price:80,  duration:"15 min" },
  { id:4, name:"Shave",        icon:"💈", price:120, duration:"20 min" },
  { id:5, name:"Hair Color",   icon:"🎨", price:500, duration:"60 min" },
  { id:6, name:"Facial",       icon:"✨", price:350, duration:"45 min" },
  { id:7, name:"Head Massage", icon:"💆", price:200, duration:"30 min" },
  { id:8, name:"Hair Spa",     icon:"🌿", price:450, duration:"50 min" },
];

const STAFF_LIST = [
  { id:"s1", name:"Ravi Kumar",   role:"Senior Barber", avatar:"👨‍🦱" },
  { id:"s2", name:"Suresh M",     role:"Barber",         avatar:"🧔" },
  { id:"s3", name:"Karthik P",   role:"Stylist",        avatar:"💇" },
  { id:"s4", name:"Meena S",     role:"Beautician",     avatar:"💆‍♀️" },
];

const DEFAULT_INVENTORY = [
  { id:"i1", name:"Shaving Foam",    icon:"🧴", unit:"bottles", qty:8,  minQty:5,  price:120 },
  { id:"i2", name:"Hair Color",      icon:"🎨", unit:"tubes",   qty:3,  minQty:5,  price:280 },
  { id:"i3", name:"Razor Blades",    icon:"🪒", unit:"packs",   qty:12, minQty:8,  price:50  },
  { id:"i4", name:"Shampoo",         icon:"🚿", unit:"bottles", qty:2,  minQty:4,  price:200 },
  { id:"i5", name:"Hair Wax",        icon:"💆", unit:"jars",    qty:6,  minQty:3,  price:180 },
  { id:"i6", name:"Towels",          icon:"🧻", unit:"pieces",  qty:18, minQty:10, price:80  },
  { id:"i7", name:"Facial Cream",    icon:"✨", unit:"tubes",   qty:4,  minQty:5,  price:350 },
  { id:"i8", name:"Hair Spa Pack",   icon:"🌿", unit:"packs",   qty:1,  minQty:4,  price:420 },
];

// ── QR ─────────────────────────────────────────────────────────────────────────
const QR_URL = (t) => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(t)}&bgcolor=fdf8f0&color=3d2b0e&margin=10`;

// ── SEED DATA ─────────────────────────────────────────────────────────────────
function seedTx() {
  const tx = [];
  const now = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now); date.setDate(date.getDate() - d);
    const count = Math.floor(Math.random()*8)+2;
    for (let i = 0; i < count; i++) {
      const svcs = SERVICES.filter(()=>Math.random()>0.6).slice(0,3);
      if (!svcs.length) svcs.push(SERVICES[0]);
      const sub = svcs.reduce((s,x)=>s+x.price,0);
      const staff = STAFF_LIST[Math.floor(Math.random()*STAFF_LIST.length)];
      tx.push({
        id:`tx_${d}_${i}`, name:["Arjun K","Raj M","Vikram S","Suresh P","Karthik R","Pradeep T","Mohan V","Siva N"][Math.floor(Math.random()*8)],
        phone:`9${Math.floor(Math.random()*900000000+100000000)}`,
        services:svcs, subtotal:sub, gst:Math.round(sub*.18), total:sub+Math.round(sub*.18),
        payMethod:["UPI","Cash","Card","Wallet"][Math.floor(Math.random()*4)],
        staffId:staff.id, staffName:staff.name,
        date:date.toISOString(), dateKey:date.toISOString().slice(0,10),
      });
    }
  }
  return tx;
}

// ── STORAGE ───────────────────────────────────────────────────────────────────
async function load(key) { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function save(key, val) { try { await window.storage.set(key, JSON.stringify(val)); } catch {} }

// ── CHARTS ────────────────────────────────────────────────────────────────────
function BarChart({ data, color="#c8a96e", onClick }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:80 }}>
      {data.map((d,i) => (
        <div key={i} onClick={()=>onClick&&onClick(d)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:onClick?"pointer":"default" }}>
          <div style={{ width:"100%", borderRadius:"3px 3px 0 0", background:d.active?`linear-gradient(180deg,#3d2b0e,#6b4f10)`:`linear-gradient(180deg,${color},${color}88)`, height:`${Math.max((d.value/max)*68, d.value>0?3:0)}px`, transition:"all .4s", boxShadow:d.active?"0 0 10px rgba(61,43,14,.5)":"none", minHeight:d.value>0?3:0 }}/>
          <span style={{ fontSize:".52rem", color:d.active?"#3d2b0e":"#b09878", fontWeight:d.active?700:400 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ slices }) {
  const total = slices.reduce((s,x)=>s+x.value,0)||1;
  const colors = ["#c8a96e","#8b6914","#e8c98e","#6b4f10","#d4b080"];
  let cum = 0;
  const r=38, cx=50, cy=50, sw=13, circ=2*Math.PI*r;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0e8d8" strokeWidth={sw}/>
        {slices.map((sl,i)=>{ const pct=sl.value/total; const off=circ*(1-cum); cum+=pct; return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={colors[i%5]} strokeWidth={sw} strokeDasharray={`${circ*pct} ${circ*(1-pct)}`} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray .6s"}}/>; })}
        <text x={cx} y={cy-3} textAnchor="middle" fontSize="9" fill="#3d2b0e" fontWeight="700">{slices.length}</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize="6" fill="#9e8a72">services</text>
      </svg>
      <div style={{ flex:1 }}>
        {slices.map((sl,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:7,height:7,borderRadius:2,background:["#c8a96e","#8b6914","#e8c98e","#6b4f10","#d4b080"][i%5] }}/><span style={{ fontSize:".7rem", color:"#7a6a50" }}>{sl.label}</span></div>
            <span style={{ fontSize:".7rem", color:"#3d2b0e", fontWeight:700 }}>{sl.count}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── STAT CARD ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, warn }) {
  return (
    <div style={{ background: accent?"linear-gradient(135deg,#c8a96e,#8b6914)":warn?"#fff4e6":"#fff9f2", border: warn?"1px solid #f0a843":accent?"none":"1px solid #e4d8c4", borderRadius:13, padding:"13px 14px", boxShadow:accent?"0 5px 20px rgba(139,105,20,.22)":"none" }}>
      <div style={{ fontSize:"1.3rem", marginBottom:3 }}>{icon}</div>
      <div style={{ fontSize:"1.25rem", fontWeight:800, color:accent?"#fff9f0":warn?"#b06010":"#3d2b0e", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:".7rem", color:accent?"#ffe9b8":warn?"#c07030":"#9e8a72", marginTop:3 }}>{label}</div>
      {sub&&<div style={{ fontSize:".65rem", color:accent?"#ffd98a":warn?"#d08040":"#b09878", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ── WHATSAPP SHARE ─────────────────────────────────────────────────────────────
function shareWhatsApp(tx) {
  const lines = [
    `💈 *${SHOP.name}* – Receipt`,
    `━━━━━━━━━━━━━━`,
    `👤 ${tx.name}`,
    `📱 +91 ${tx.phone}`,
    `👨 Staff: ${tx.staffName}`,
    `📅 ${new Date(tx.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`,
    ``,
    `*Services:*`,
    ...tx.services.map(s=>`  ${s.icon} ${s.name} — ₹${s.price}`),
    ``,
    `Subtotal: ₹${tx.subtotal}`,
    `GST (18%): ₹${tx.gst}`,
    `*Total Paid: ₹${tx.total}* (${tx.payMethod})`,
    ``,
    `Thank you! See you again 🙏`,
    `📍 ${SHOP.address}`,
  ].join("\n");
  const url = `https://wa.me/91${tx.phone}?text=${encodeURIComponent(lines)}`;
  window.open(url, "_blank");
}

// ── PDF PRINT ──────────────────────────────────────────────────────────────────
function printReceipt(tx) {
  const html = `<!DOCTYPE html><html><head><title>Receipt – ${SHOP.name}</title>
  <style>
    body{font-family:Georgia,serif;max-width:320px;margin:20px auto;color:#2c1810;font-size:13px}
    h2{text-align:center;font-size:18px;margin:0 0 2px}
    .sub{text-align:center;color:#7a6a50;font-size:11px;margin:0 0 10px}
    .divider{border:none;border-top:1px dashed #ccc;margin:8px 0}
    .row{display:flex;justify-content:space-between;margin:4px 0}
    .total{font-weight:700;font-size:15px;margin-top:6px}
    .footer{text-align:center;color:#9e8a72;font-size:10px;margin-top:12px}
    .stripe{height:4px;background:repeating-linear-gradient(90deg,#c8a96e 0 20%,#c0392b 20% 40%,#fff 40% 60%,#c0392b 60% 80%,#c8a96e 80% 100%);margin-bottom:12px}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="stripe"></div>
  <h2>💈 ${SHOP.name}</h2>
  <p class="sub">${SHOP.tagline}<br>${SHOP.address}</p>
  <hr class="divider">
  <div class="row"><span>Customer</span><span>${tx.name}</span></div>
  <div class="row"><span>Mobile</span><span>+91 ${tx.phone}</span></div>
  <div class="row"><span>Staff</span><span>${tx.staffName}</span></div>
  <div class="row"><span>Date</span><span>${new Date(tx.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div>
  <div class="row"><span>Time</span><span>${new Date(tx.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span></div>
  <hr class="divider">
  <strong>Services</strong>
  ${tx.services.map(s=>`<div class="row"><span>${s.icon} ${s.name}</span><span>₹${s.price}</span></div>`).join("")}
  <hr class="divider">
  <div class="row"><span>Subtotal</span><span>₹${tx.subtotal}</span></div>
  <div class="row"><span>GST 18%</span><span>₹${tx.gst}</span></div>
  <hr class="divider">
  <div class="row total"><span>TOTAL PAID</span><span>₹${tx.total}</span></div>
  <div class="row"><span>Payment</span><span>${tx.payMethod}</span></div>
  <p class="footer">Thank you for visiting!<br>See you again 🙏</p>
  <script>window.onload=()=>{window.print()}</script>
  </body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]               = useState("owner");
  const [animIn, setAnimIn]           = useState(true);
  const [transactions, setTx]         = useState([]);
  const [inventory, setInventory]     = useState(DEFAULT_INVENTORY);
  const [loaded, setLoaded]           = useState(false);
  const [customer, setCustomer]       = useState({ name:"", phone:"" });
  const [selected, setSelected]       = useState([]);
  const [assignedStaff, setAssignedStaff] = useState(null);
  const [payMethod, setPayMethod]     = useState("");
  const [pickStatus, setPickStatus]   = useState("idle");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPin, setAdminPin]       = useState("");
  const [pinError, setPinError]       = useState(false);
  const [adminTab, setAdminTab]       = useState("overview"); // overview | daily | monthly | staff | inventory
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [lastTx, setLastTx]           = useState(null);
  const [invEdit, setInvEdit]         = useState(null); // item being edited
  const appUrl = typeof window !== "undefined" ? window.location.href.split("?")[0]+"?c=1" : "https://royalcuts.salon/pay";
  const contactSupported = typeof window !== "undefined" && "contacts" in navigator;

  useEffect(() => {
    Promise.all([load("salon_tx"), load("salon_inv")]).then(([txData, invData]) => {
      setTx(txData?.length ? txData : seedTx());
      setInventory(invData || DEFAULT_INVENTORY);
      setLoaded(true);
    });
    if (new URLSearchParams(window.location.search).get("c")==="1") goto("customer_welcome");
  }, []);

  const goto = (p) => { setAnimIn(false); setTimeout(()=>{ setPage(p); setAnimIn(true); },200); };

  const addTx = (tx) => { const u=[...transactions,tx]; setTx(u); save("salon_tx",u); };
  const updateInv = (items) => { setInventory(items); save("salon_inv",items); };

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  const todayKey  = new Date().toISOString().slice(0,10);
  const todayTx   = transactions.filter(t=>t.dateKey===todayKey);
  const todayRev  = todayTx.reduce((s,t)=>s+t.total,0);
  const nm = new Date().getMonth(), ny = new Date().getFullYear();
  const monthTx   = transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===nm&&d.getFullYear()===ny; });
  const monthRev  = monthTx.reduce((s,t)=>s+t.total,0);
  const lowItems  = inventory.filter(i=>i.qty<=i.minQty);

  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); const key=d.toISOString().slice(0,10); return { label:DAYS[d.getDay()], value:transactions.filter(t=>t.dateKey===key).reduce((s,t)=>s+t.total,0), key, active:selectedDay===key }; });
  const last6m = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-(5-i)); const m=d.getMonth(),y=d.getFullYear(); return { label:MONTHS[m], value:transactions.filter(t=>{ const dd=new Date(t.date); return dd.getMonth()===m&&dd.getFullYear()===y; }).reduce((s,t)=>s+t.total,0), month:m, year:y, active:selectedMonth?.month===m&&selectedMonth?.year===y }; });
  const svcCount = {}; transactions.forEach(t=>t.services.forEach(s=>{ svcCount[s.name]=(svcCount[s.name]||0)+1; }));
  const topSvcs = Object.entries(svcCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([label,count])=>({label,count,value:count}));

  // Staff stats
  const staffStats = STAFF_LIST.map(st => {
    const stTx = transactions.filter(t=>t.staffId===st.id);
    const todaySt = stTx.filter(t=>t.dateKey===todayKey);
    return { ...st, totalTx:stTx.length, totalRev:stTx.reduce((s,t)=>s+t.total,0), todayTx:todaySt.length, todayRev:todaySt.reduce((s,t)=>s+t.total,0) };
  }).sort((a,b)=>b.totalRev-a.totalRev);

  const subtotal = selected.reduce((s,i)=>s+i.price,0);
  const gst = Math.round(subtotal*.18);
  const grandTotal = subtotal+gst;

  // ── CONTACT PICKER ─────────────────────────────────────────────────────────
  const pickContact = async () => {
    setPickStatus("loading");
    try {
      const c = await navigator.contacts.select(["name","tel"],{multiple:false});
      if (c?.length) { setCustomer({ name:c[0].name?.[0]||"", phone:(c[0].tel?.[0]||"").replace(/\D/g,"").slice(-10) }); setPickStatus("done"); setTimeout(()=>goto("customer_staff"),800); }
      else setPickStatus("idle");
    } catch { setPickStatus("fallback"); }
  };

  // ── WRAPPER ────────────────────────────────────────────────────────────────
  const wrap = (content, noPad=false) => (
    <div style={g.root}>
      <div style={{ ...g.card, opacity:animIn?1:0, transform:animIn?"translateY(0)":"translateY(16px)", transition:"opacity .22s ease,transform .22s ease" }}>
        <div style={g.stripe}/>
        {noPad ? content : <div style={g.pad}>{content}</div>}
      </div>
    </div>
  );

  // ══════════════ PAGES ══════════════════════════════════════════════════════

  // ── OWNER HOME ─────────────────────────────────────────────────────────────
  if (page==="owner") return wrap(<>
    <div style={{ textAlign:"center" }}>
      <div style={g.badge}>SALON</div>
      <h1 style={g.shopName}>{SHOP.name}</h1>
      <p style={g.muted}>{SHOP.tagline}</p>
      {lowItems.length>0 && <div style={g.alertBanner} onClick={()=>{ setAdminAuthed(true); setAdminTab("inventory"); goto("admin"); }}>⚠️ {lowItems.length} item{lowItems.length>1?"s":""} running low — tap to view</div>}
      <div style={g.qrBox}><img src={QR_URL(appUrl)} alt="QR" style={{ display:"block", borderRadius:8 }}/><p style={{ ...g.muted, fontSize:".72rem", marginTop:6, marginBottom:0 }}>📲 Scan to book & pay</p></div>
      <p style={{ ...g.muted, fontSize:".75rem", marginBottom:20 }}>📍 {SHOP.address}</p>
    </div>
    <Btn onClick={()=>goto("customer_welcome")}>👤 Customer Flow</Btn>
    <Btn onClick={()=>goto("admin")} secondary>📊 Admin Dashboard</Btn>
  </>);

  // ── CUSTOMER WELCOME ───────────────────────────────────────────────────────
  if (page==="customer_welcome") return wrap(<>
    <div style={{ textAlign:"center", marginBottom:22 }}>
      <div style={{ fontSize:"2.2rem" }}>💈</div>
      <h1 style={g.shopName}>{SHOP.name}</h1>
      <p style={g.muted}>Welcome! Let's get you checked in.</p>
    </div>
    {pickStatus==="idle" && <>
      <div style={g.pickCard}>
        <div style={{ textAlign:"center", marginBottom:12 }}>
          <div style={g.phoneIllus}>
            <div style={g.phonePill}/>
            {[0,1,2].map(i=><div key={i} style={{ display:"flex",alignItems:"center",gap:7,marginBottom:7 }}><div style={g.avatarC}>👤</div><div><div style={g.fLine}/><div style={g.fLine2}/></div></div>)}
          </div>
          <div style={{ color:"#9e8a72", fontSize:".68rem", marginTop:4 }}>👆 tap your own name</div>
        </div>
        <h2 style={{ color:"#3d2b0e", fontSize:"1rem", fontWeight:700, textAlign:"center", marginBottom:6 }}>Pick Your Contact</h2>
        <p style={{ color:"#7a6a50", fontSize:".78rem", textAlign:"center", lineHeight:1.6, marginBottom:12 }}>Your phone's contacts open — just tap your name. <strong style={{ color:"#c8a96e" }}>No typing!</strong></p>
        <Btn onClick={pickContact} big>📋 Open My Contacts</Btn>
        <Btn onClick={()=>goto("customer_manual")} secondary>✏️ Enter Manually</Btn>
      </div>
    </>}
    {pickStatus==="loading" && <div style={g.statusBox}><div style={g.spin}/><p style={{ color:"#3d2b0e", fontWeight:600 }}>Opening contacts…</p></div>}
    {pickStatus==="done" && <div style={{ ...g.statusBox, borderColor:"#4caf50" }}><div style={g.greenTick}>✓</div><p style={{ color:"#3d2b0e", fontWeight:700 }}>{customer.name}</p><p style={g.muted}>📱 +91 {customer.phone}</p></div>}
    {pickStatus==="fallback" && <div style={{ ...g.statusBox, borderColor:"#e67e22" }}><p style={{ color:"#e67e22", textAlign:"center", marginBottom:8 }}>⚠️ Cancelled.</p><Btn onClick={()=>goto("customer_manual")} secondary>✏️ Enter Manually</Btn></div>}
  </>);

  // ── MANUAL ENTRY ───────────────────────────────────────────────────────────
  if (page==="customer_manual") return wrap(<>
    <h2 style={g.sHead}>Your Details</h2>
    <label style={g.lbl}>Full Name</label>
    <input style={g.input} placeholder="e.g. Arjun Kumar" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/>
    <label style={{ ...g.lbl, marginTop:13 }}>Mobile Number</label>
    <input style={g.input} placeholder="10-digit number" maxLength={10} value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value.replace(/\D/,"")})}/>
    <div style={{ marginTop:18 }}>
      <Btn onClick={()=>{ if(customer.name.trim()&&/^[6-9]\d{9}$/.test(customer.phone)) goto("customer_staff"); }}>Continue →</Btn>
      <Btn onClick={()=>goto("customer_welcome")} secondary>← Back</Btn>
    </div>
  </>);

  // ── STAFF SELECTION ────────────────────────────────────────────────────────
  if (page==="customer_staff") return wrap(<>
    <CustChip name={customer.name} phone={customer.phone}/>
    <h2 style={g.sHead}>Choose Your Barber</h2>
    <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
      {STAFF_LIST.map(st=>{
        const on = assignedStaff?.id===st.id;
        return (
          <div key={st.id} style={{ ...g.staffCard, ...(on?g.staffOn:{}) }} onClick={()=>setAssignedStaff(st)}>
            <div style={g.staffAvatar}>{st.avatar}</div>
            <div style={{ flex:1 }}>
              <div style={{ color:"#3d2b0e", fontWeight:700, fontSize:".88rem" }}>{st.name}</div>
              <div style={{ color:"#9e8a72", fontSize:".72rem" }}>{st.role}</div>
            </div>
            {on && <div style={g.check}>✓</div>}
          </div>
        );
      })}
    </div>
    <Btn onClick={()=>goto("customer_services")} disabled={!assignedStaff}>Next: Choose Services →</Btn>
    <Btn onClick={()=>goto("customer_welcome")} secondary>← Back</Btn>
  </>);

  // ── SERVICES ───────────────────────────────────────────────────────────────
  if (page==="customer_services") return wrap(<>
    <CustChip name={customer.name} phone={customer.phone}/>
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, padding:"8px 12px", background:"#fef9f2", border:"1px solid #e4d8c4", borderRadius:10 }}>
      <span style={{ fontSize:"1.1rem" }}>{assignedStaff?.avatar}</span>
      <span style={{ color:"#3d2b0e", fontSize:".82rem", fontWeight:600 }}>{assignedStaff?.name}</span>
      <span style={{ color:"#9e8a72", fontSize:".72rem" }}>· {assignedStaff?.role}</span>
    </div>
    <h2 style={g.sHead}>Choose Services</h2>
    <div style={g.svcGrid}>
      {SERVICES.map(svc=>{ const on=!!selected.find(x=>x.id===svc.id); return (
        <div key={svc.id} style={{ ...g.svcCard, ...(on?g.svcOn:{}) }} onClick={()=>setSelected(p=>p.find(s=>s.id===svc.id)?p.filter(s=>s.id!==svc.id):[...p,svc])}>
          {on&&<div style={g.check}>✓</div>}
          <div style={{ fontSize:"1.4rem", marginBottom:2 }}>{svc.icon}</div>
          <div style={{ color:"#3d2b0e", fontSize:".76rem", fontWeight:600, marginBottom:2 }}>{svc.name}</div>
          <div style={{ color:"#b09878", fontSize:".64rem", marginBottom:2 }}>{svc.duration}</div>
          <div style={{ color:"#8b6914", fontWeight:700, fontSize:".86rem" }}>₹{svc.price}</div>
        </div>
      );})}
    </div>
    {selected.length>0 && <div style={g.tray}><span style={g.muted}>{selected.length} selected</span><span style={{ color:"#8b6914", fontWeight:700 }}>₹{subtotal}</span></div>}
    <Btn onClick={()=>goto("customer_bill")} disabled={!selected.length}>View Bill →</Btn>
  </>);

  // ── BILL ───────────────────────────────────────────────────────────────────
  if (page==="customer_bill") return wrap(<>
    <CustChip name={customer.name} phone={customer.phone}/>
    <h2 style={g.sHead}>Your Bill</h2>
    <div style={g.rcpt}>
      <div style={g.rcptHead}><span>💈 {SHOP.name}</span><span style={{ fontSize:".7rem", color:"#b09878" }}>{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div>
      <div style={{ ...g.rRow, color:"#9e8a72", fontSize:".78rem", marginBottom:10 }}><span>👨 {assignedStaff?.name}</span><span>{assignedStaff?.role}</span></div>
      <div style={g.dash}/>
      {selected.map(s=><div key={s.id} style={g.rRow}><span>{s.icon} {s.name}</span><span>₹{s.price}</span></div>)}
      <div style={g.dash}/>
      <div style={g.rRow}><span>Subtotal</span><span>₹{subtotal}</span></div>
      <div style={{ ...g.rRow, color:"#9e8a72", fontSize:".8rem" }}><span>GST 18%</span><span>₹{gst}</span></div>
      <div style={g.dash}/>
      <div style={{ ...g.rRow, color:"#3d2b0e", fontWeight:800, fontSize:".98rem" }}><span>Total</span><span>₹{grandTotal}</span></div>
    </div>
    <p style={{ ...g.lbl, marginTop:16 }}>Payment Method</p>
    <div style={g.payGrid}>
      {[{m:"UPI",i:"📲"},{m:"Cash",i:"💵"},{m:"Card",i:"💳"},{m:"Wallet",i:"👛"}].map(({m,i})=>(
        <div key={m} style={{ ...g.payChip, ...(payMethod===m?g.payOn:{}) }} onClick={()=>setPayMethod(m)}>
          <span style={{ fontSize:"1.2rem" }}>{i}</span><span>{m}</span>
        </div>
      ))}
    </div>
    <Btn disabled={!payMethod} style={{ marginTop:14 }} onClick={()=>{
      const now=new Date();
      const tx={ id:`tx_${Date.now()}`, name:customer.name, phone:customer.phone, services:selected, subtotal, gst, total:grandTotal, payMethod, staffId:assignedStaff.id, staffName:assignedStaff.name, date:now.toISOString(), dateKey:now.toISOString().slice(0,10) };
      addTx(tx); setLastTx(tx); goto("customer_receipt");
    }}>✅ Pay ₹{grandTotal}</Btn>
    <Btn onClick={()=>goto("customer_services")} secondary>← Edit Services</Btn>
  </>);

  // ── RECEIPT ────────────────────────────────────────────────────────────────
  if (page==="customer_receipt") return wrap(<>
    <div style={{ textAlign:"center" }}>
      <div style={g.bigTick}>✓</div>
      <h1 style={{ ...g.shopName, marginTop:10 }}>Payment Done!</h1>
      <p style={g.muted}>Thank you, {customer.name.split(" ")[0]}! 💈</p>
    </div>
    <div style={{ ...g.rcpt, marginTop:14, marginBottom:16 }}>
      <div style={g.rcptHead}><span>🧾 Receipt</span><span style={{ fontSize:".7rem", color:"#b09878" }}>{new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span></div>
      <div style={g.rRow}><span>Name</span><span>{customer.name}</span></div>
      <div style={g.rRow}><span>Mobile</span><span>+91 {customer.phone}</span></div>
      <div style={g.rRow}><span>Staff</span><span>{assignedStaff?.name}</span></div>
      <div style={g.rRow}><span>Paid via</span><span>{payMethod}</span></div>
      <div style={g.dash}/>
      {selected.map(s=><div key={s.id} style={g.rRow}><span>{s.icon} {s.name}</span><span>₹{s.price}</span></div>)}
      <div style={g.dash}/>
      <div style={{ ...g.rRow, color:"#3d2b0e", fontWeight:800, fontSize:".98rem" }}><span>Total Paid</span><span>₹{grandTotal}</span></div>
    </div>
    {/* Action buttons */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
      <button style={g.actionBtn} onClick={()=>lastTx&&shareWhatsApp(lastTx)}>
        <span style={{ fontSize:"1.3rem" }}>📲</span>
        <span style={{ fontSize:".78rem", fontWeight:700 }}>WhatsApp</span>
        <span style={{ fontSize:".65rem", color:"#8b6914" }}>Send Receipt</span>
      </button>
      <button style={g.actionBtn} onClick={()=>lastTx&&printReceipt(lastTx)}>
        <span style={{ fontSize:"1.3rem" }}>🖨️</span>
        <span style={{ fontSize:".78rem", fontWeight:700 }}>Print</span>
        <span style={{ fontSize:".65rem", color:"#8b6914" }}>PDF Receipt</span>
      </button>
    </div>
    <Btn style={{ marginTop:4 }} onClick={()=>{ setCustomer({name:"",phone:""}); setSelected([]); setPayMethod(""); setPickStatus("idle"); setAssignedStaff(null); setLastTx(null); goto("owner"); }}>🏠 Back to Home</Btn>
  </>);

  // ── ADMIN LOGIN ────────────────────────────────────────────────────────────
  if (page==="admin" && !adminAuthed) return wrap(<>
    <div style={{ textAlign:"center", marginBottom:22 }}>
      <div style={{ fontSize:"2rem", marginBottom:8 }}>🔐</div>
      <h2 style={{ color:"#3d2b0e", fontSize:"1.1rem", fontWeight:700 }}>Admin Access</h2>
      <p style={g.muted}>Enter your 4-digit PIN</p>
    </div>
    <PinPad pin={adminPin} setPin={setAdminPin} error={pinError} onSubmit={(enteredPin)=>{
      if (enteredPin===ADMIN_PIN) { setAdminAuthed(true); setPinError(false); }
      else { setPinError(true); setAdminPin(""); setTimeout(()=>setPinError(false),900); }
    }}/>
    <Btn onClick={()=>goto("owner")} secondary style={{ marginTop:14 }}>← Back</Btn>
  </>);

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  if (page==="admin") return wrap(<>
    {/* Header */}
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
      <div><div style={g.badge}>ADMIN</div><h2 style={{ color:"#3d2b0e", fontSize:"1.05rem", fontWeight:800, margin:"3px 0 0" }}>Dashboard</h2></div>
      <button onClick={()=>{ setAdminAuthed(false); goto("owner"); }} style={{ background:"none", border:"none", color:"#9e8a72", cursor:"pointer", fontSize:".75rem", marginTop:4 }}>Sign Out</button>
    </div>

    {/* Tab Bar */}
    <div style={g.tabBar}>
      {[["overview","📊"],["daily","📅"],["monthly","📆"],["staff","👨"],["inventory","📦"]].map(([t,ic])=>(
        <button key={t} style={{ ...g.tabBtn, ...(adminTab===t?g.tabOn:{}) }} onClick={()=>setAdminTab(t)}>{ic} {t.charAt(0).toUpperCase()+t.slice(1)}</button>
      ))}
    </div>

    {/* ── OVERVIEW TAB ── */}
    {adminTab==="overview" && <>
      {lowItems.length>0 && <div style={g.alertBanner} onClick={()=>setAdminTab("inventory")}>⚠️ {lowItems.length} item{lowItems.length>1?"s":""} running low — tap to restock</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:16 }}>
        <StatCard icon="📅" label="Today's Revenue" value={`₹${todayRev.toLocaleString()}`} sub={`${todayTx.length} customers`} accent/>
        <StatCard icon="📆" label="This Month" value={`₹${(monthRev/1000).toFixed(1)}k`} sub={`${monthTx.length} visits`}/>
        <StatCard icon="✂️" label="Services Today" value={todayTx.reduce((s,t)=>s+t.services.length,0)} sub="total"/>
        <StatCard icon="💰" label="Avg Bill Today" value={`₹${todayTx.length?Math.round(todayRev/todayTx.length):0}`} sub="per customer"/>
      </div>
      <div style={{ ...g.chartCard, marginBottom:12 }}>
        <p style={g.cTitle}>📊 Last 7 Days</p>
        <BarChart data={last7} color="#c8a96e"/>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
          <span style={{ fontSize:".68rem", color:"#9e8a72" }}>₹{last7.reduce((s,d)=>s+d.value,0).toLocaleString()} total</span>
          <button style={g.lnkBtn} onClick={()=>setAdminTab("daily")}>Daily →</button>
        </div>
      </div>
      <div style={{ ...g.chartCard, marginBottom:12 }}>
        <p style={g.cTitle}>📈 Last 6 Months</p>
        <BarChart data={last6m} color="#8b6914"/>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
          <span style={{ fontSize:".68rem", color:"#9e8a72" }}>₹{last6m.reduce((s,d)=>s+d.value,0).toLocaleString()} total</span>
          <button style={g.lnkBtn} onClick={()=>setAdminTab("monthly")}>Monthly →</button>
        </div>
      </div>
      {topSvcs.length>0 && <div style={{ ...g.chartCard, marginBottom:12 }}><p style={g.cTitle}>🏆 Top Services</p><DonutChart slices={topSvcs}/></div>}
      <p style={g.cTitle}>🧾 Today's Transactions</p>
      {todayTx.length===0 ? <p style={{ color:"#b09878", textAlign:"center", padding:"12px 0", fontSize:".82rem" }}>No transactions today.</p>
        : todayTx.slice().reverse().map(tx=><TxCard key={tx.id} tx={tx}/>)}
    </>}

    {/* ── DAILY TAB ── */}
    {adminTab==="daily" && <>
      <div style={{ ...g.chartCard, marginBottom:12 }}>
        <p style={g.cTitle}>Tap a day to see transactions</p>
        <BarChart data={last7} color="#c8a96e" onClick={d=>setSelectedDay(selectedDay===d.key?null:d.key)}/>
      </div>
      {selectedDay && (() => {
        const dTx = transactions.filter(t=>t.dateKey===selectedDay);
        const dRev = dTx.reduce((s,t)=>s+t.total,0);
        return <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <p style={g.cTitle}>{new Date(selectedDay+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"2-digit",month:"long"})}</p>
            <span style={{ color:"#8b6914", fontWeight:700, fontSize:".9rem" }}>₹{dRev.toLocaleString()}</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <StatCard icon="👥" label="Customers" value={dTx.length}/>
            <StatCard icon="✂️" label="Services" value={dTx.reduce((s,t)=>s+t.services.length,0)}/>
          </div>
          {dTx.slice().reverse().map(tx=><TxCard key={tx.id} tx={tx}/>)}
        </>;
      })()}
      <p style={{ ...g.cTitle, marginTop:16 }}>30-Day History</p>
      {Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10); const txs=transactions.filter(t=>t.dateKey===key); const rev=txs.reduce((s,t)=>s+t.total,0); if(!txs.length) return null; return (
        <div key={key} style={{ ...g.txCard, cursor:"pointer", ...(selectedDay===key?{borderColor:"#c8a96e",background:"#fef2d8"}:{}) }} onClick={()=>setSelectedDay(selectedDay===key?null:key)}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div><div style={{ color:"#3d2b0e", fontWeight:600, fontSize:".82rem" }}>{d.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"})}</div><div style={{ color:"#9e8a72", fontSize:".68rem" }}>{txs.length} customer{txs.length>1?"s":""}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ color:"#8b6914", fontWeight:800, fontSize:".88rem" }}>₹{rev.toLocaleString()}</div><div style={{ color:"#b09878", fontSize:".66rem" }}>{txs.reduce((s,t)=>s+t.services.length,0)} services</div></div>
          </div>
        </div>
      );})}
    </>}

    {/* ── MONTHLY TAB ── */}
    {adminTab==="monthly" && <>
      <div style={{ ...g.chartCard, marginBottom:12 }}>
        <p style={g.cTitle}>Tap a month to expand</p>
        <BarChart data={last6m} color="#8b6914" onClick={d=>setSelectedMonth(selectedMonth?.month===d.month?null:d)}/>
      </div>
      {selectedMonth && (() => {
        const mTx = transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===selectedMonth.month&&d.getFullYear()===selectedMonth.year; });
        const mRev = mTx.reduce((s,t)=>s+t.total,0);
        const pc={}; mTx.forEach(t=>{ pc[t.payMethod]=(pc[t.payMethod]||0)+1; });
        const daysInMonth = new Date(selectedMonth.year, selectedMonth.month+1, 0).getDate();
        const dayBars = Array.from({length:daysInMonth},(_,i)=>{ const key=`${selectedMonth.year}-${String(selectedMonth.month+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`; return { label:String(i+1), value:transactions.filter(t=>t.dateKey===key).reduce((s,t)=>s+t.total,0) }; });
        return <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <p style={g.cTitle}>{MONTHS[selectedMonth.month]} {selectedMonth.year}</p>
            <span style={{ color:"#8b6914", fontWeight:700, fontSize:".9rem" }}>₹{mRev.toLocaleString()}</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            <StatCard icon="👥" label="Customers" value={mTx.length}/>
            <StatCard icon="✂️" label="Services" value={mTx.reduce((s,t)=>s+t.services.length,0)}/>
            <StatCard icon="💰" label="Avg/Day" value={`₹${Math.round(mRev/daysInMonth)}`}/>
          </div>
          <div style={{ ...g.chartCard, marginBottom:12 }}><p style={g.cTitle}>Daily breakdown</p><BarChart data={dayBars} color="#c8a96e"/></div>
          <div style={{ ...g.chartCard, marginBottom:12 }}>
            <p style={g.cTitle}>Payment Split</p>
            {Object.entries(pc).map(([m,c])=>(
              <div key={m} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><span style={{ fontSize:".78rem", color:"#3d2b0e" }}>{m}</span><span style={{ fontSize:".78rem", color:"#8b6914", fontWeight:700 }}>{c} ({Math.round(c/mTx.length*100)}%)</span></div>
                <div style={{ height:5, background:"#f0e8d8", borderRadius:4 }}><div style={{ height:"100%", width:`${c/mTx.length*100}%`, background:"linear-gradient(90deg,#c8a96e,#8b6914)", borderRadius:4, transition:"width .5s" }}/></div>
              </div>
            ))}
          </div>
          {mTx.slice().reverse().slice(0,15).map(tx=><TxCard key={tx.id} tx={tx} showDate/>)}
          {mTx.length>15 && <p style={{ color:"#b09878", fontSize:".72rem", textAlign:"center" }}>Showing latest 15 of {mTx.length}</p>}
        </>;
      })()}
    </>}

    {/* ── STAFF TAB ── */}
    {adminTab==="staff" && <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:16 }}>
        <StatCard icon="👨‍💼" label="Staff Members" value={STAFF_LIST.length} sub="active"/>
        <StatCard icon="✂️" label="Today's Work" value={`${todayTx.length} cuts`} sub={`by ${[...new Set(todayTx.map(t=>t.staffId))].length} staff`}/>
      </div>
      {staffStats.map(st=>{
        const pct = staffStats[0]?.totalRev ? (st.totalRev/staffStats[0].totalRev*100) : 0;
        return (
          <div key={st.id} style={g.txCard}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#c8a96e,#8b6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>{st.avatar}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#3d2b0e", fontWeight:700, fontSize:".88rem" }}>{st.name}</div>
                <div style={{ color:"#9e8a72", fontSize:".72rem" }}>{st.role}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:"#8b6914", fontWeight:800, fontSize:".92rem" }}>₹{st.totalRev.toLocaleString()}</div>
                <div style={{ color:"#9e8a72", fontSize:".68rem" }}>all time</div>
              </div>
            </div>
            <div style={{ height:5, background:"#f0e8d8", borderRadius:4, marginBottom:8 }}>
              <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#c8a96e,#8b6914)", borderRadius:4, transition:"width .6s" }}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              <div style={{ background:"#fef9f2", borderRadius:8, padding:"7px 8px", textAlign:"center" }}><div style={{ color:"#3d2b0e", fontWeight:700, fontSize:".82rem" }}>{st.totalTx}</div><div style={{ color:"#9e8a72", fontSize:".6rem" }}>Total Visits</div></div>
              <div style={{ background:"#fef9f2", borderRadius:8, padding:"7px 8px", textAlign:"center" }}><div style={{ color:"#3d2b0e", fontWeight:700, fontSize:".82rem" }}>{st.todayTx}</div><div style={{ color:"#9e8a72", fontSize:".6rem" }}>Today</div></div>
              <div style={{ background:"#fef9f2", borderRadius:8, padding:"7px 8px", textAlign:"center" }}><div style={{ color:"#8b6914", fontWeight:700, fontSize:".82rem" }}>₹{st.todayRev}</div><div style={{ color:"#9e8a72", fontSize:".6rem" }}>Today ₹</div></div>
            </div>
          </div>
        );
      })}
    </>}

    {/* ── INVENTORY TAB ── */}
    {adminTab==="inventory" && <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:14 }}>
        <StatCard icon="📦" label="Total Items" value={inventory.length} sub="in stock"/>
        <StatCard icon="⚠️" label="Low Stock" value={lowItems.length} sub="need restock" warn={lowItems.length>0}/>
      </div>
      {lowItems.length>0 && <div style={{ ...g.alertBanner, marginBottom:12 }}>⚠️ Low Stock Alert: {lowItems.map(i=>i.name).join(", ")}</div>}
      {inventory.map(item=>{
        const isLow = item.qty<=item.minQty;
        const pct = Math.min((item.qty/Math.max(item.minQty*2,10))*100, 100);
        return (
          <div key={item.id} style={{ ...g.txCard, ...(isLow?{borderColor:"#f0a843",background:"#fffaf2"}:{}) }}>
            {invEdit===item.id ? (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:"1.2rem" }}>{item.icon}</span>
                    <span style={{ color:"#3d2b0e", fontWeight:700, fontSize:".86rem" }}>{item.name}</span>
                  </div>
                  <button onClick={()=>setInvEdit(null)} style={{ background:"none", border:"none", color:"#9e8a72", cursor:"pointer" }}>✕</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div>
                    <label style={g.lbl}>Current Qty</label>
                    <input type="number" style={{ ...g.input, padding:"8px 10px" }} value={item.qty} onChange={e=>{ const ni=inventory.map(x=>x.id===item.id?{...x,qty:parseInt(e.target.value)||0}:x); updateInv(ni); }}/>
                  </div>
                  <div>
                    <label style={g.lbl}>Min Alert Qty</label>
                    <input type="number" style={{ ...g.input, padding:"8px 10px" }} value={item.minQty} onChange={e=>{ const ni=inventory.map(x=>x.id===item.id?{...x,minQty:parseInt(e.target.value)||0}:x); updateInv(ni); }}/>
                  </div>
                </div>
                <button onClick={()=>setInvEdit(null)} style={{ ...g.input, marginTop:8, background:"linear-gradient(135deg,#c8a96e,#8b6914)", color:"#fff9f0", fontWeight:700, border:"none", cursor:"pointer", padding:"10px" }}>Save</button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:"1.3rem" }}>{item.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:"#3d2b0e", fontWeight:700, fontSize:".84rem" }}>{item.name}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {isLow && <span style={{ background:"#f0a843", color:"#fff", fontSize:".58rem", fontWeight:700, padding:"2px 6px", borderRadius:8 }}>LOW</span>}
                      <span style={{ color:isLow?"#b06010":"#8b6914", fontWeight:800, fontSize:".86rem" }}>{item.qty} {item.unit}</span>
                    </div>
                  </div>
                  <div style={{ height:4, background:"#f0e8d8", borderRadius:3, marginBottom:3 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:isLow?"linear-gradient(90deg,#f0a843,#e67e22)":"linear-gradient(90deg,#c8a96e,#8b6914)", borderRadius:3, transition:"width .5s" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"#b09878", fontSize:".64rem" }}>Min: {item.minQty} {item.unit}</span>
                    <button onClick={()=>setInvEdit(item.id)} style={{ background:"none", border:"none", color:"#8b6914", cursor:"pointer", fontSize:".68rem", fontWeight:700 }}>✏️ Edit</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>}
  </>, false);
}

// ── PIN PAD ────────────────────────────────────────────────────────────────────
function PinPad({ pin, setPin, error, onSubmit }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:22 }}>
        {[0,1,2,3].map(i=><div key={i} style={{ width:13,height:13,borderRadius:"50%",background:i<pin.length?"#c8a96e":"#e4d8c4",transition:"background .2s",boxShadow:i<pin.length?"0 0 8px rgba(200,169,110,.5)":"none" }}/>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:9 }}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
          <button key={i} onClick={()=>{ if(k==="") return; if(k==="⌫"){setPin(p=>p.slice(0,-1));return;} const np=pin+k; setPin(np); if(np.length===4) setTimeout(()=>onSubmit(np),100); }}
            style={{ padding:"15px",borderRadius:11,border:"1px solid #e4d8c4",background:k===""?"transparent":"#fff9f2",color:"#3d2b0e",fontSize:"1.15rem",fontWeight:700,cursor:k===""?"default":"pointer",fontFamily:"inherit",animation:error?"shake .3s ease":"none" }}>
            {k}
          </button>
        ))}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}`}</style>
    </div>
  );
}

// ── TX CARD ────────────────────────────────────────────────────────────────────
function TxCard({ tx, showDate }) {
  return (
    <div style={g.txCard}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div>
          <div style={{ color:"#3d2b0e", fontWeight:700, fontSize:".85rem" }}>{tx.name}</div>
          <div style={{ color:"#9e8a72", fontSize:".68rem" }}>
            {showDate ? new Date(tx.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})+" · " : ""}
            {tx.staffName} · {tx.payMethod}
          </div>
          <div style={{ color:"#b09878", fontSize:".66rem", marginTop:2 }}>{tx.services.map(s=>s.icon).join(" ")} {tx.services.map(s=>s.name).join(", ")}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#8b6914", fontWeight:800, fontSize:".92rem" }}>₹{tx.total}</div>
          <div style={{ color:"#b09878", fontSize:".65rem" }}>{new Date(tx.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
        </div>
      </div>
    </div>
  );
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────────
function CustChip({ name, phone }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fef4e1", border:"1px solid #e4d8c4", borderRadius:20, padding:"5px 13px 5px 7px", marginBottom:14 }}>
      <div style={{ width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#c8a96e,#8b6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".8rem" }}>👤</div>
      <div><div style={{ color:"#3d2b0e",fontWeight:700,fontSize:".8rem",lineHeight:1.2 }}>{name}</div><div style={{ color:"#9e8a72",fontSize:".68rem" }}>+91 {phone}</div></div>
    </div>
  );
}

function Btn({ children, onClick, disabled, secondary, big, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:big?"16px":"12px", background:disabled?"#e4d8c4":secondary?"transparent":"linear-gradient(135deg,#c8a96e 0%,#8b6914 100%)", color:disabled?"#b09878":secondary?"#9e8a72":"#fff9f0", border:secondary?"1px solid #e4d8c4":"none", borderRadius:12, cursor:disabled?"not-allowed":"pointer", fontWeight:700, fontSize:".88rem", fontFamily:"inherit", letterSpacing:.3, marginTop:7, boxShadow:disabled||secondary?"none":"0 4px 14px rgba(139,105,20,.22)", transition:"opacity .2s", ...style }}>
      {children}
    </button>
  );
}

// ── GLOBAL STYLES ──────────────────────────────────────────────────────────────
const g = {
  root:{ minHeight:"100vh", background:"linear-gradient(160deg,#f5f0e8 0%,#ede4d3 100%)", display:"flex", justifyContent:"center", alignItems:"flex-start", padding:"18px 12px 48px", fontFamily:"'Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif" },
  card:{ width:"100%", maxWidth:430, background:"#fff9f2", borderRadius:22, overflow:"hidden", boxShadow:"0 10px 44px rgba(80,50,20,.13),0 2px 8px rgba(80,50,20,.07)", border:"1px solid #e4d8c4" },
  stripe:{ height:5, background:"repeating-linear-gradient(90deg,#c8a96e 0 20%,#c0392b 20% 40%,#fff 40% 60%,#c0392b 60% 80%,#c8a96e 80% 100%)" },
  pad:{ padding:"20px 18px 26px" },
  badge:{ display:"inline-block",background:"#3d2b0e",color:"#c8a96e",fontSize:".57rem",fontWeight:700,letterSpacing:3,padding:"3px 10px",borderRadius:20,marginBottom:7 },
  shopName:{ fontSize:"1.55rem",fontWeight:800,color:"#3d2b0e",margin:"0 0 3px",letterSpacing:.4 },
  muted:{ color:"#9e8a72",fontSize:".78rem",marginBottom:6 },
  qrBox:{ background:"#f5f0e8",borderRadius:13,padding:13,display:"inline-block",margin:"0 auto 11px",border:"1px solid #e4d8c4" },
  alertBanner:{ background:"linear-gradient(90deg,#fff4e6,#fff8ee)",border:"1px solid #f0a843",borderRadius:10,padding:"10px 13px",color:"#b06010",fontSize:".78rem",fontWeight:600,marginBottom:12,cursor:"pointer" },
  pickCard:{ background:"#fef9f2",border:"1px solid #e4d8c4",borderRadius:15,padding:"18px 15px" },
  phoneIllus:{ width:96,margin:"0 auto 5px",background:"#3d2b0e",borderRadius:15,padding:"9px 9px 13px" },
  phonePill:{ width:18,height:3,background:"#c8a96e",borderRadius:4,margin:"0 auto 7px" },
  avatarC:{ width:22,height:22,borderRadius:"50%",background:"#c8a96e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",flexShrink:0 },
  fLine:{ height:4,width:48,background:"#c8a96e",borderRadius:3,marginBottom:2,opacity:.7 },
  fLine2:{ height:3,width:32,background:"#8b6914",borderRadius:3,opacity:.35 },
  statusBox:{ background:"#fef9f2",border:"1px solid #e4d8c4",borderRadius:13,padding:"22px 15px",textAlign:"center" },
  spin:{ width:30,height:30,borderRadius:"50%",border:"3px solid #e4d8c4",borderTopColor:"#c8a96e",animation:"spin .7s linear infinite",margin:"0 auto 10px" },
  greenTick:{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#c8a96e,#8b6914)",color:"#fff",fontWeight:800,fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 9px",boxShadow:"0 4px 12px rgba(139,105,20,.3)" },
  staffCard:{ background:"#fef9f2",border:"1.5px solid #e4d8c4",borderRadius:12,padding:"13px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,position:"relative",transition:"all .15s" },
  staffOn:{ border:"1.5px solid #c8a96e",background:"#fef2d8" },
  staffAvatar:{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#c8a96e,#8b6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.15rem",flexShrink:0 },
  sHead:{ color:"#3d2b0e",fontSize:"1rem",fontWeight:700,marginBottom:11,marginTop:0 },
  input:{ width:"100%",boxSizing:"border-box",border:"1.5px solid #e4d8c4",borderRadius:10,padding:"11px 12px",fontSize:".88rem",fontFamily:"inherit",color:"#3d2b0e",background:"#fff9f2",outline:"none" },
  lbl:{ display:"block",color:"#9e8a72",fontSize:".73rem",marginBottom:5,letterSpacing:.3 },
  svcGrid:{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:11 },
  svcCard:{ background:"#fef9f2",border:"1.5px solid #e4d8c4",borderRadius:12,padding:"11px 8px",cursor:"pointer",textAlign:"center",position:"relative",transition:"all .15s" },
  svcOn:{ border:"1.5px solid #c8a96e",background:"#fef2d8",transform:"scale(1.03)" },
  check:{ position:"absolute",top:6,right:6,background:"#c8a96e",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:".58rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" },
  tray:{ display:"flex",justifyContent:"space-between",background:"#fef2d8",border:"1px solid #e4d8c4",borderRadius:9,padding:"8px 12px",fontSize:".82rem",marginBottom:6 },
  rcpt:{ background:"#fdf7ee",border:"1px solid #e4d8c4",borderRadius:12,padding:13 },
  rcptHead:{ display:"flex",justifyContent:"space-between",color:"#3d2b0e",fontWeight:700,fontSize:".83rem",paddingBottom:8,marginBottom:8,borderBottom:"1px dashed #e4d8c4" },
  rRow:{ display:"flex",justifyContent:"space-between",color:"#7a6a50",fontSize:".8rem",marginBottom:5 },
  dash:{ borderTop:"1px dashed #e4d8c4",margin:"8px 0" },
  payGrid:{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7 },
  payChip:{ background:"#fef9f2",border:"1.5px solid #e4d8c4",borderRadius:10,padding:"11px 7px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:"#7a6a50",fontSize:".78rem",transition:"all .15s" },
  payOn:{ border:"1.5px solid #c8a96e",background:"#fef2d8",color:"#8b6914" },
  bigTick:{ width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#c8a96e,#8b6914)",color:"#fff",fontSize:"1.7rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",margin:"12px auto 0",boxShadow:"0 7px 22px rgba(139,105,20,.3)" },
  actionBtn:{ background:"#fff9f2",border:"1.5px solid #e4d8c4",borderRadius:12,padding:"12px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .15s",fontFamily:"inherit" },
  tabBar:{ display:"flex",gap:4,overflowX:"auto",marginBottom:16,paddingBottom:4 },
  tabBtn:{ flexShrink:0,padding:"7px 10px",borderRadius:9,border:"1px solid #e4d8c4",background:"#fef9f2",color:"#9e8a72",fontSize:".68rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" },
  tabOn:{ background:"#3d2b0e",color:"#c8a96e",border:"1px solid #3d2b0e" },
  chartCard:{ background:"#fdf7ee",border:"1px solid #e4d8c4",borderRadius:12,padding:"13px 13px 11px" },
  cTitle:{ color:"#3d2b0e",fontWeight:700,fontSize:".8rem",marginBottom:9,marginTop:0 },
  lnkBtn:{ background:"none",border:"none",color:"#8b6914",fontSize:".72rem",cursor:"pointer",fontFamily:"inherit",fontWeight:700 },
  txCard:{ background:"#fdf7ee",border:"1px solid #e4d8c4",borderRadius:10,padding:"10px 12px",marginBottom:7 },
  backBtn:{ background:"#fef2d8",border:"1px solid #e4d8c4",borderRadius:9,width:34,height:34,cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 },
};

if (typeof document !== "undefined") {
  const st = document.createElement("style");
  st.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(st);
}

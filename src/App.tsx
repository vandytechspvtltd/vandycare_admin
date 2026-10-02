import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, UserCheck, Users, Calendar, CreditCard, LogOut, RefreshCw,
  CheckCircle2, XCircle, Eye, Menu, X
} from 'lucide-react'
import { adminApi, adminLogin, getToken, logout } from './api'

type Tab = 'overview' | 'verifications' | 'doctors' | 'patients' | 'appointments' | 'payments'

function Login({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const result = await adminLogin(email, password)
      const token = result?.access_token || result?.data?.accessToken
      if (!token) throw new Error('Login succeeded but no access token was returned.')
      localStorage.setItem('admin_access_token', token)
      localStorage.setItem('admin_user', JSON.stringify(result?.data?.user || {}))
      onLogin(token, result?.data?.user || {})
    } catch (e: any) {
      setError(e.message || 'Unable to login')
    } finally { setLoading(false) }
  }

  return <div className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="brand">VANDYCINS</div>
      <h1>Admin Control Center</h1>
      <p>Sign in to manage doctors and patients.</p>
      {error && <div className="error">{error}</div>}
      <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="admin" required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" required /></label>
      <button className="primary full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
    </form>
  </div>
}

function App() {
  const [authed, setAuthed] = useState(!!getToken())
  const [tab, setTab] = useState<Tab>('overview')
  const [pending, setPending] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [mobileNav, setMobileNav] = useState(false)

  async function refresh() {
    if (!getToken()) return
    setLoading(true); setError('')
    try {
      const [p, d, pt] = await Promise.all([
        adminApi.pendingDoctors(), adminApi.doctors(), adminApi.patients()
      ])
      setPending(p?.data || [])
      setDoctors(d?.data || [])
      setPatients(pt?.data || [])
    } catch (e: any) { setError(e.message || 'Failed to load admin data') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (authed) refresh() }, [authed])

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  async function action(fn: () => Promise<any>) {
    try { setError(''); await fn(); await refresh() }
    catch (e: any) { setError(e.message || 'Action failed') }
  }

  const nav = [
    ['overview','Dashboard Overview',Activity],
    ['verifications','Doctor Verification',UserCheck],
    ['doctors','Manage Doctors',Users],
    ['patients','Manage Patients',Users],
    ['appointments','Appointments Registry',Calendar],
    ['payments','Payments & Refunds',CreditCard],
  ] as const

  const activeTitle = nav.find(n => n[0] === tab)?.[1]

  return <div className="app">
    <header className="topbar">
      <div className="brand">VANDYCINS <span>Admin Control Center</span></div>
      <div className="top-actions">
        <button className="icon-btn mobile-only" onClick={()=>setMobileNav(!mobileNav)}>{mobileNav?<X/>:<Menu/>}</button>
        <button className="secondary" onClick={refresh}><RefreshCw size={15}/> Refresh</button>
        <button className="secondary" onClick={()=>{logout();setAuthed(false)}}><LogOut size={15}/> Logout</button>
      </div>
    </header>
    <div className="layout">
      <aside className={`sidebar ${mobileNav?'open':''}`}>
        {nav.map(([id,label,Icon]) => <button key={id} className={tab===id?'nav active':'nav'} onClick={()=>{setTab(id);setMobileNav(false)}}><Icon size={17}/><span>{label}</span>{id==='verifications'&&pending.length>0&&<b>{pending.length}</b>}</button>)}
      </aside>
      <main className="content">
        {error && <div className="error banner">{error}</div>}
        <div className="page-head"><div><h1>{activeTitle}</h1><p>Vandycins administration portal</p></div></div>

        {tab==='overview' && <div className="grid cards">
          <Card label="Total Patients" value={patients.length}/>
          <Card label="Registered Doctors" value={doctors.length}/>
          <Card label="Pending Verifications" value={pending.length}/>
          <Card label="Active Doctors" value={doctors.filter(d=>d.isActive !== false).length}/>
        </div>}

        {tab==='verifications' && <Section title={`Pending Doctor Registrations (${pending.length})`}>
          <Table headers={['Doctor','Specialization','Registration','Status','Actions']}>
            {pending.map((d,i)=><tr key={d.id||i}><td><strong>{d.name||'—'}</strong><small>{d.email||d.mobile||''}</small></td><td>{d.specialization||d.specialty||'—'}</td><td>{d.registrationNumber||d.registration_number||'—'}</td><td><span className="badge pending">PENDING</span></td><td className="actions"><button className="success" onClick={()=>action(()=>adminApi.approveDoctor(d.id))}><CheckCircle2 size={14}/>Approve</button><button className="danger" onClick={()=>{const reason=prompt('Rejection reason','Registration rejected by admin.')||'Registration rejected by admin.';action(()=>adminApi.rejectDoctor(d.id,reason))}}><XCircle size={14}/>Reject</button></td></tr>)}
          </Table>
        </Section>}

        {tab==='doctors' && <Section title={`Doctors (${doctors.length})`}>
          <Table headers={['Doctor','Specialization','Experience','Status','Actions']}>
            {doctors.map((d,i)=><tr key={d.id||i}><td><strong>{d.name||'—'}</strong><small>{d.email||d.mobile||''}</small></td><td>{d.specialization||d.specialty||'—'}</td><td>{d.experience??d.experience_years??'—'} years</td><td><span className={`badge ${d.status==='APPROVED'?'approved':'inactive'}`}>{d.status|| (d.isActive===false?'INACTIVE':'APPROVED')}</span></td><td className="actions"><button className="secondary" onClick={async()=>{try{const r=await adminApi.doctorDetails(d.id);setSelected(r?.data||r)}catch(e:any){setError(e.message)}}}><Eye size={14}/>View</button>{d.isActive===false?<button className="success" onClick={()=>action(()=>adminApi.activateDoctor(d.id))}>Activate</button>:<button className="danger" onClick={()=>action(()=>adminApi.deactivateDoctor(d.id))}>Deactivate</button>}</td></tr>)}
          </Table>
        </Section>}

        {tab==='patients' && <Section title={`Patients (${patients.length})`}>
          <Table headers={['Patient','Email','Mobile','Status','Actions']}>
            {patients.map((p,i)=><tr key={p.id||i}><td><strong>{p.name||'—'}</strong><small>{p.id||''}</small></td><td>{p.email||'—'}</td><td>{p.mobile||p.phone||'—'}</td><td><span className="badge approved">ACTIVE</span></td><td><button className="secondary" onClick={async()=>{try{const r=await adminApi.patientDetails(p.id);setSelected(r?.data||r)}catch(e:any){setError(e.message)}}}><Eye size={14}/>View</button></td></tr>)}
          </Table>
        </Section>}

        {(tab==='appointments'||tab==='payments') && <Section title={activeTitle!}><div className="empty"><Calendar size={30}/><p>Connect the corresponding backend API when it is available.</p></div></Section>}

        {selected && <div className="modal-bg" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button><h2>Details</h2><pre>{JSON.stringify(selected,null,2)}</pre></div></div>}
      </main>
    </div>
  </div>
}

function Card({label,value}:{label:string,value:number}){return <div className="card"><span>{label}</span><strong>{value}</strong></div>}
function Section({title,children}:{title:string,children:React.ReactNode}){return <section className="section"><h2>{title}</h2>{children}</section>}
function Table({headers,children}:{headers:string[],children:React.ReactNode}){return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}

export default App

import React, { useEffect, useState } from 'react'
import {
  Activity,
  UserCheck,
  Users,
  Calendar,
  CreditCard,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Menu,
  X,
  Stethoscope,
  ShieldCheck,
  UserRound,
  Clock3,
  ArrowUpRight,
} from 'lucide-react'

import {
  adminApi,
  adminLogin,
  getToken,
  logout,
} from './api'

type Tab =
  | 'overview'
  | 'verifications'
  | 'doctors'
  | 'patients'
  | 'appointments'
  | 'payments'

function Login({
  onLogin,
}: {
  onLogin: (token: string, user: any) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await adminLogin(email, password)

      const token =
        result?.access_token ||
        result?.data?.accessToken

      if (!token) {
        throw new Error(
          'Login succeeded but no access token was returned.'
        )
      }

      localStorage.setItem(
        'admin_access_token',
        token
      )

      localStorage.setItem(
        'admin_user',
        JSON.stringify(result?.data?.user || {})
      )

      onLogin(
        token,
        result?.data?.user || {}
      )
    } catch (e: any) {
      setError(
        e.message || 'Unable to login'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <div className="login-shell">
        <div className="login-brand-area">
          <div className="login-logo">
            <Stethoscope size={24} />
          </div>

          <div>
            <div className="login-brand">
              VANDYCARE
            </div>

            <span>
              Healthcare Administration
            </span>
          </div>
        </div>

        <form
          className="login-card"
          onSubmit={submit}
        >
          <div className="login-heading">
            <div>
              <div className="eyebrow">
                ADMIN PORTAL
              </div>

              <h1>Welcome back</h1>

              <p>
                Sign in to manage doctors,
                patients and healthcare operations.
              </p>
            </div>
          </div>

          {error && (
            <div className="error login-error">
              {error}
            </div>
          )}

          <label>
            Email address

            <input
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              type="email"
              placeholder="admin@vandycins.com"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password

            <input
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="primary full"
            disabled={loading}
          >
            {loading
              ? 'Signing in...'
              : 'Sign in to Admin Portal'}
          </button>

          <div className="login-security">
            <ShieldCheck size={16} />

            <span>
              Secure administrator access
            </span>
          </div>
        </form>

        <div className="login-footer">
          © 2026 VandyCare · Admin Control Center
        </div>
      </div>
    </div>
  )
}

function App() {
  const [authed, setAuthed] =
    useState(!!getToken())

  const [tab, setTab] =
    useState<Tab>('overview')

  const [pending, setPending] =
    useState<any[]>([])

  const [doctors, setDoctors] =
    useState<any[]>([])

  const [patients, setPatients] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [selected, setSelected] =
    useState<any>(null)

  const [mobileNav, setMobileNav] =
    useState(false)

  async function refresh() {
    if (!getToken()) return

    setLoading(true)
    setError('')

    try {
      const [p, d, pt] =
        await Promise.all([
          adminApi.pendingDoctors(),
          adminApi.doctors(),
          adminApi.patients(),
        ])

      setPending(p?.data || [])
      setDoctors(d?.data || [])
      setPatients(pt?.data || [])
    } catch (e: any) {
      setError(
        e.message ||
        'Failed to load admin data'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authed) {
      refresh()
    }
  }, [authed])

  if (!authed) {
    return (
      <Login
        onLogin={() => setAuthed(true)}
      />
    )
  }

  async function action(
    fn: () => Promise<any>
  ) {
    try {
      setError('')
      await fn()
      await refresh()
    } catch (e: any) {
      setError(
        e.message || 'Action failed'
      )
    }
  }

  const nav = [
    ['overview', 'Dashboard', Activity],
    [
      'verifications',
      'Doctor Verification',
      UserCheck,
    ],
    ['doctors', 'Doctors', Stethoscope],
    ['patients', 'Patients', Users],
    ['appointments', 'Appointments', Calendar],
    ['payments', 'Payments', CreditCard],
  ] as const

  const activeTitle =
    nav.find(n => n[0] === tab)?.[1]

  const activeDoctors =
    doctors.filter(
      d => d.isActive !== false
    ).length

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="icon-btn mobile-only"
            onClick={() =>
              setMobileNav(!mobileNav)
            }
          >
            {mobileNav ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

          <div className="brand-mark">
            <Stethoscope size={19} />
          </div>

          <div className="brand-text">
            <strong>VANDYCARE</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        <div className="top-actions">
          <div className="admin-status">
            <span className="online-dot" />

            <div>
              <strong>Administrator</strong>
              <small>Admin account</small>
            </div>
          </div>

          <button
            className="secondary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={
                loading ? 'spin' : ''
              }
            />
            <span>Refresh</span>
          </button>

          <button
            className="secondary logout-btn"
            onClick={() => {
              logout()
              setAuthed(false)
            }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <aside
          className={`sidebar ${
            mobileNav ? 'open' : ''
          }`}
        >
      

          <nav>
            {nav.map(
              ([id, label, Icon]) => (
                <button
                  key={id}
                  className={
                    tab === id
                      ? 'nav active'
                      : 'nav'
                  }
                  onClick={() => {
                    setTab(id)
                    setMobileNav(false)
                  }}
                >
                  <Icon size={18} />

                  <span>{label}</span>

                  {id === 'verifications' &&
                    pending.length > 0 && (
                      <b>{pending.length}</b>
                    )}
                </button>
              )
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="secure-badge">
              <ShieldCheck size={20} />

              <div>
                <strong>Secure Portal</strong>
                <span>
                  Protected admin access
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="content">
          {error && (
            <div className="error banner">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <XCircle size={17} />
                <span>{error}</span>
              </div>

              <button
                onClick={() => setError('')}
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="page-head">
            <div>
              <div className="eyebrow">
                VANDYCARE ADMINISTRATION
              </div>

              <h1>{activeTitle}</h1>

              <p>
                Manage your healthcare platform
                from one place.
              </p>
            </div>

            <div className="head-status">
              <span className="status-dot" />
              System Active
            </div>
          </div>

          {tab === 'overview' && (
            <>
              <div className="hero-card">
                <div>
                  <div className="hero-label">
                    ADMIN DASHBOARD
                  </div>

                  <h2>
                    Healthcare at a glance
                  </h2>

                  <p>
                    Monitor doctors, patients
                    and verification activity
                    from the VandyCare
                    administration portal.
                  </p>
                </div>

                <div className="hero-icon">
                  <Activity size={38} />
                </div>
              </div>

              <div className="grid cards">
                <StatCard
                  icon={<Users />}
                  label="Total Patients"
                  value={patients.length}
                  description="Registered patients"
                />

                <StatCard
                  icon={<Stethoscope />}
                  label="Registered Doctors"
                  value={doctors.length}
                  description="Doctors on platform"
                />

                <StatCard
                  icon={<Clock3 />}
                  label="Pending Verification"
                  value={pending.length}
                  description="Require admin review"
                  highlight
                />

                <StatCard
                  icon={<UserCheck />}
                  label="Active Doctors"
                  value={activeDoctors}
                  description="Currently active"
                />
              </div>

              <Section
                title="Platform Overview"
                subtitle="Current administration activity"
              >
                <div className="quick-grid">
                  <OverviewItem
                    icon={<Stethoscope />}
                    title="Doctor Management"
                    description="Review and manage registered doctors."
                    value={doctors.length}
                    action={() =>
                      setTab('doctors')
                    }
                  />

                  <OverviewItem
                    icon={<UserRound />}
                    title="Patient Management"
                    description="View registered patient accounts."
                    value={patients.length}
                    action={() =>
                      setTab('patients')
                    }
                  />

                  <OverviewItem
                    icon={<UserCheck />}
                    title="Doctor Verification"
                    description="Review pending doctor registrations."
                    value={pending.length}
                    action={() =>
                      setTab('verifications')
                    }
                  />
                </div>
              </Section>
            </>
          )}

          {tab === 'verifications' && (
            <Section
              title={`Pending Doctor Registrations (${pending.length})`}
              subtitle="Review and approve new doctor registrations"
            >
              <Table
                headers={[
                  'Doctor',
                  'Specialization',
                  'Registration',
                  'Status',
                  'Actions',
                ]}
              >
                {pending.map((d, i) => (
                  <tr key={d.id || i}>
                    <td>
                      <PersonCell
                        type="doctor"
                        name={d.name}
                        secondary={
                          d.email ||
                          d.mobile ||
                          ''
                        }
                      />
                    </td>

                    <td>
                      {d.specialization ||
                        d.specialty ||
                        '—'}
                    </td>

                    <td>
                      {d.registrationNumber ||
                        d.registration_number ||
                        '—'}
                    </td>

                    <td>
                      <span className="badge pending">
                        Pending
                      </span>
                    </td>

                    <td className="actions">
                      <button
                        className="success"
                        onClick={() =>
                          action(() =>
                            adminApi.approveDoctor(
                              d.id
                            )
                          )
                        }
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>

                      <button
                        className="danger"
                        onClick={() => {
                          const reason =
                            prompt(
                              'Rejection reason',
                              'Registration rejected by admin.'
                            ) ||
                            'Registration rejected by admin.'

                          action(() =>
                            adminApi.rejectDoctor(
                              d.id,
                              reason
                            )
                          )
                        }}
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            </Section>
          )}

          {tab === 'doctors' && (
            <Section
              title={`Doctors (${doctors.length})`}
              subtitle="Manage registered healthcare professionals"
            >
              <Table
                headers={[
                  'Doctor',
                  'Specialization',
                  'Experience',
                  'Status',
                  'Actions',
                ]}
              >
                {doctors.map((d, i) => (
                  <tr key={d.id || i}>
                    <td>
                      <PersonCell
                        type="doctor"
                        name={d.name}
                        secondary={
                          d.email ||
                          d.mobile ||
                          ''
                        }
                      />
                    </td>

                    <td>
                      {d.specialization ||
                        d.specialty ||
                        '—'}
                    </td>

                    <td>
                      {d.experience ??
                        d.experience_years ??
                        '—'}{' '}
                      years
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          d.status === 'APPROVED'
                            ? 'approved'
                            : 'inactive'
                        }`}
                      >
                        {d.status ||
                          (d.isActive === false
                            ? 'INACTIVE'
                            : 'APPROVED')}
                      </span>
                    </td>

                    <td className="actions">
                      <button
                        className="secondary"
                        onClick={async () => {
                          try {
                            const r =
                              await adminApi.doctorDetails(
                                d.id
                              )

                            setSelected(
                              r?.data || r
                            )
                          } catch (e: any) {
                            setError(
                              e.message
                            )
                          }
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>

                      {d.isActive === false ? (
                        <button
                          className="success"
                          onClick={() =>
                            action(() =>
                              adminApi.activateDoctor(
                                d.id
                              )
                            )
                          }
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          className="danger"
                          onClick={() =>
                            action(() =>
                              adminApi.deactivateDoctor(
                                d.id
                              )
                            )
                          }
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </Section>
          )}

          {tab === 'patients' && (
            <Section
              title={`Patients (${patients.length})`}
              subtitle="View and manage registered patients"
            >
              <Table
                headers={[
                  'Patient',
                  'Email',
                  'Mobile',
                  'Status',
                  'Actions',
                ]}
              >
                {patients.map((p, i) => (
                  <tr key={p.id || i}>
                    <td>
                      <PersonCell
                        type="patient"
                        name={p.name}
                        secondary={p.id || ''}
                      />
                    </td>

                    <td>
                      {p.email || '—'}
                    </td>

                    <td>
                      {p.mobile ||
                        p.phone ||
                        '—'}
                    </td>

                    <td>
                      <span className="badge approved">
                        Active
                      </span>
                    </td>

                    <td>
                      <button
                        className="secondary"
                        onClick={async () => {
                          try {
                            const r =
                              await adminApi.patientDetails(
                                p.id
                              )

                            setSelected(
                              r?.data || r
                            )
                          } catch (e: any) {
                            setError(
                              e.message
                            )
                          }
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            </Section>
          )}

          {(tab === 'appointments' ||
            tab === 'payments') && (
            <Section
              title={activeTitle!}
              subtitle="Coming soon"
            >
              <div className="empty">
                <div className="empty-icon">
                  {tab === 'appointments' ? (
                    <Calendar size={28} />
                  ) : (
                    <CreditCard size={28} />
                  )}
                </div>

                <h3>
                  {tab === 'appointments'
                    ? 'Appointments Registry'
                    : 'Payments & Refunds'}
                </h3>

                <p>
                  Connect the corresponding
                  backend API when it is available.
                </p>
              </div>
            </Section>
          )}

          {selected && (
            <div
              className="modal-bg"
              onClick={() =>
                setSelected(null)
              }
            >
              <div
                className="modal"
                onClick={e =>
                  e.stopPropagation()
                }
              >
                <button
                  className="close"
                  onClick={() =>
                    setSelected(null)
                  }
                >
                  <X size={18} />
                </button>

                <div className="modal-title">
                  <div className="modal-icon">
                    <Eye size={18} />
                  </div>

                  <div>
                    <span>ADMIN VIEW</span>
                    <h2>Details</h2>
                  </div>
                </div>

                <pre>
                  {JSON.stringify(
                    selected,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  description,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: number
  description: string
  highlight?: boolean
}) {
  return (
    <div
      className={`card ${
        highlight ? 'highlight' : ''
      }`}
    >
      <div
        className={`card-icon ${
          highlight ? 'amber' : 'blue'
        }`}
      >
        {icon}
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{description}</small>
    </div>
  )
}

function OverviewItem({
  icon,
  title,
  description,
  value,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  value: number
  action: () => void
}) {
  return (
    <button
      className="quick-item"
      onClick={action}
    >
      <div className="quick-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>

        <span>{description}</span>
      </div>

      <div className="quick-arrow">
        <strong>{value}</strong>
        <ArrowUpRight size={15} />
      </div>
    </button>
  )
}

function PersonCell({
  type,
  name,
  secondary,
}: {
  type: 'doctor' | 'patient'
  name?: string
  secondary?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          flex: '0 0 36px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 10,
          color:
            type === 'doctor'
              ? 'var(--blue)'
              : 'var(--green-dark)',
          background:
            type === 'doctor'
              ? 'var(--soft-blue)'
              : 'var(--soft-green)',
        }}
      >
        {type === 'doctor' ? (
          <Stethoscope size={17} />
        ) : (
          <UserRound size={17} />
        )}
      </div>

      <div>
        <strong>{name || '—'}</strong>
        <small>{secondary || ''}</small>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="section">
      <div className="section-head">
        <span>ADMINISTRATION</span>

        <h2>{title}</h2>

        {subtitle && (
          <p
            style={{
              margin: '5px 0 0',
              color: 'var(--muted)',
              fontSize: 11,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  )
}

function Table({
  headers,
  children,
}: {
  headers: string[]
  children: React.ReactNode
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export default App

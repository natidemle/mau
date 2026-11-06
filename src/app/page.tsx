"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardData, Service, ServiceAction } from "@/lib/dashboard-data";

type IconName =
  | "grid"
  | "book"
  | "calendar"
  | "folder"
  | "help"
  | "search"
  | "bell"
  | "chevron"
  | "arrow"
  | "meal"
  | "check"
  | "card"
  | "spark"
  | "pin"
  | "clock"
  | "close";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h7M8 10h7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    folder: <><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 10h18" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.7 1.2c-.9 1.1-2.3 1.5-2.3 3.3M12 17h.01" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    meal: <><path d="M7 3v7M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 9.5V21M16 3v18M16 3c3 2 4 5 4 8h-4" /></>,
    check: <><path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="9" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2z" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const navigation: { label: string; icon: IconName; href: string }[] = [
  { label: "Overview", icon: "grid", href: "#overview" },
  { label: "My academics", icon: "book", href: "#academics" },
  { label: "My schedule", icon: "calendar", href: "#schedule" },
  { label: "Student records", icon: "folder", href: "#services" },
];

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [today, setToday] = useState("");
  const [busyAction, setBusyAction] = useState<ServiceAction | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  useEffect(() => {
    let active = true;
    setToday(
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    );

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("The dashboard service is unavailable. Please try again.");
        }
        const data = (await response.json()) as DashboardData;
        if (active) setDashboard(data);
      } catch {
        if (active) setLoadError("We couldn’t load your dashboard. Check your connection and refresh.");
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    if (!dashboard) return [];
    const query = search.trim().toLowerCase();
    if (!query) return dashboard.services;
    return dashboard.services.filter((service) =>
      `${service.title} ${service.description} ${service.category}`.toLowerCase().includes(query),
    );
  }, [dashboard, search]);

  async function runServiceAction(action: ServiceAction) {
    setBusyAction(action);
    setNotice("");

    try {
      const response = await fetch("/api/service-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "The service action failed.");
      setNotice(result.message ?? "Demo action completed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The service action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  if (!dashboard) {
    return (
      <main className="loading-screen" aria-live="polite">
        <div className="loading-mark">M</div>
        <p>{loadError || "Loading your student dashboard…"}</p>
        {loadError && <button className="button button-primary" onClick={() => window.location.reload()}>Try again</button>}
      </main>
    );
  }

  const { student, stats } = dashboard;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="MAU ISIMS home">
          <span className="brand-mark">M</span>
          <span className="brand-copy"><strong>MAU <i>ISIMS</i></strong><small>STUDENT PORTAL</small></span>
        </a>

        <div className="campus-label">CAMPUS</div>
        <button className="campus-select" type="button" aria-label={`Current campus: ${student.campus}`}>
          <span className="campus-dot"><Icon name="pin" size={16} /></span>
          <span><strong>{student.campus}</strong><small>Main campus</small></span>
          <Icon name="chevron" size={16} />
        </button>

        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              className={`nav-link ${activeNav === item.label ? "active" : ""}`}
              href={item.href}
              key={item.label}
              onClick={() => setActiveNav(item.label)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {activeNav === item.label && <span className="nav-indicator" />}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Icon name="help" size={18} /></span>
            <strong>Need a hand?</strong>
            <p>Find help with campus services and your student account.</p>
            <a href="mailto:student.services@mau.edu.et">Contact student services <Icon name="arrow" size={13} /></a>
          </div>
          <div className="sidebar-user">
            <span className="avatar avatar-small">{student.initials}</span>
            <span className="sidebar-user-copy"><strong>{student.name}</strong><small>{student.id}</small></span>
            <span className="online-dot" aria-label="Online" />
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb">Student portal <span>/</span> <strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <label className="search-box">
              <Icon name="search" size={18} />
              <input
                type="search"
                placeholder="Search services..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search services"
              />
              <kbd>/</kbd>
            </label>
            <div className="notification-wrap">
              <button
                type="button"
                className={`icon-button ${notificationsOpen ? "selected" : ""}`}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Icon name="bell" size={19} /><span className="notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <strong>You’re all caught up</strong>
                  <p>Your next class starts at 09:00. Have a great day on campus.</p>
                  <button type="button" onClick={() => setNotificationsOpen(false)}>Close</button>
                </div>
              )}
            </div>
            <button type="button" className="topbar-profile" onClick={() => setActiveNav("Overview")} aria-label="Student profile">
              <span className="avatar">{student.initials}</span>
              <span className="topbar-profile-name"><strong>{student.name}</strong><small>{student.year}</small></span>
              <Icon name="chevron" size={15} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot" /> YOUR CAMPUS, CONNECTED</div>
              <h1>Welcome back, {student.name.split(" ")[0]} <span className="wave">✦</span></h1>
              <p className="welcome-subtitle">Here&apos;s what&apos;s happening with your university life today.</p>
            </div>
            <div className="date-chip"><Icon name="calendar" size={17} /> {today || "Today"}</div>
          </div>

          <section className="hero-card" aria-label="Student profile">
            <div className="hero-orb hero-orb-one" />
            <div className="hero-orb hero-orb-two" />
            <div className="hero-content">
              <span className="hero-kicker"><Icon name="spark" size={15} /> YOUR STUDENT PROFILE</span>
              <h2>Make this semester<br />count.</h2>
              <p>Your academic journey and campus services, all in one place.</p>
              <div className="hero-student">
                <span className="hero-avatar">{student.initials}</span>
                <span><strong>{student.name}</strong><small>{student.department} <b>·</b> {student.id}</small></span>
              </div>
            </div>
            <div className="hero-side">
              <div className="hero-campus"><Icon name="pin" size={16} /> {student.campus} Campus</div>
              <div className="progress-ring" style={{ "--progress": `${stats.clearance}%` } as React.CSSProperties}>
                <div><strong>{stats.clearance}%</strong><span>COMPLETE</span></div>
              </div>
              <p className="ring-caption">Clearance progress</p>
              <a className="hero-link" href="#services">View your services <Icon name="arrow" size={15} /></a>
            </div>
          </section>

          {notice && (
            <div className="notice" role="status">
              <span><Icon name="spark" size={17} /> {notice}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><Icon name="close" size={17} /></button>
            </div>
          )}

          <section className="stats-grid" id="academics" aria-label="Student highlights">
            <StatCard label="Current GPA" value={stats.gpa} helper="Good academic standing" icon="spark" tone="purple" />
            <StatCard label="Credits earned" value={`${stats.credits}`} helper={`of ${stats.totalCredits} total credits`} icon="book" tone="blue" />
            <StatCard label="Books borrowed" value={`${stats.books}`} helper="No overdue items" icon="folder" tone="orange" />
            <StatCard label="Clearance" value={`${stats.clearance}%`} helper="Finance office pending" icon="check" tone="green" />
          </section>

          <section className="services-section" id="services">
            <div className="section-heading">
              <div><span className="section-overline">HERE FOR YOU</span><h2>Campus services</h2><p>Everything you need to make campus life easier.</p></div>
              <span className="section-count">{filteredServices.length} SERVICES <Icon name="arrow" size={14} /></span>
            </div>
            {filteredServices.length ? (
              <div className="service-grid">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    busy={busyAction === service.action}
                    onAction={runServiceAction}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-search">No services match “{search}”. Try a different search.</div>
            )}
          </section>

          <section className="lower-grid" id="schedule">
            <div className="schedule-card">
              <div className="card-heading">
                <div><span className="section-overline">SAMPLE TIMETABLE</span><h2>Today&apos;s schedule</h2></div>
                <a href="#schedule" className="text-link">Full timetable <Icon name="arrow" size={14} /></a>
              </div>
              <div className="schedule-list">
                {dashboard.schedule.map((item) => (
                  <div className="schedule-item" key={item.time}>
                    <span className="schedule-time">{item.time}</span>
                    <span className={`schedule-marker ${item.tone}`} />
                    <span className="schedule-details"><strong>{item.title}</strong><small>{item.detail}</small></span>
                    <Icon name="chevron" size={16} />
                  </div>
                ))}
              </div>
            </div>
            <div className="profile-card" id="profile">
              <div className="profile-card-top"><span className="section-overline">YOUR DETAILS</span><span className="profile-shield"><Icon name="check" size={18} /></span></div>
              <h2>Student profile</h2>
              <p className="profile-card-copy">Your university identity at a glance.</p>
              <div className="profile-detail"><span>Department</span><strong>{student.department}</strong></div>
              <div className="profile-detail"><span>Campus</span><strong>{student.campus}</strong></div>
              <div className="profile-detail"><span>Academic year</span><strong>{student.year}</strong></div>
              <div className="profile-detail"><span>Student ID</span><strong>{student.id}</strong></div>
            </div>
          </section>

          <footer className="page-footer" id="support">
            <span>MAU ISIMS <b>·</b> Mekdela Amba University</span>
            <span><span className="footer-dot" /> Demo workspace · Sample data only</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: IconName;
  tone: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-helper">{helper}</span>
    </article>
  );
}

function ServiceCard({
  service,
  busy,
  onAction,
}: {
  service: Service;
  busy: boolean;
  onAction: (action: ServiceAction) => void;
}) {
  const icon = service.icon === "meal" ? "meal" : service.icon === "book" ? "book" : service.icon;
  return (
    <article className="service-card">
      <div className="service-card-top">
        <div className={`service-icon ${service.iconTone}`}><Icon name={icon} size={21} /></div>
        <span className={`status-pill ${service.statusTone}`}><span />{service.status}</span>
      </div>
      <span className="service-category">{service.category}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <button
        type="button"
        className="service-action"
        onClick={() => onAction(service.action)}
        disabled={busy}
      >
        {busy ? "Working…" : service.actionLabel}
        {!busy && <Icon name="arrow" size={15} />}
      </button>
    </article>
  );
}

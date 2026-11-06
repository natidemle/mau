import "server-only";

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { dashboardData, type ServiceAction } from "@/lib/dashboard-data";

const demoStudentId = dashboardData.student.id;

export type StudentServiceRequest = {
  id: number;
  type: "id-card";
  reason: string;
  status: "processing" | "approved" | "rejected";
  createdAt: string;
};

declare global {
  var mauIsimsDatabase: Database.Database | undefined;
}

function openDatabase() {
  const filename =
    process.env.DATABASE_PATH ?? join(process.cwd(), "data", "mau-isims.sqlite");
  mkdirSync(dirname(filename), { recursive: true });

  const database = new Database(filename);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS students (
      student_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      campus TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      gpa REAL NOT NULL CHECK (gpa >= 0 AND gpa <= 4),
      credits_earned INTEGER NOT NULL CHECK (credits_earned >= 0),
      total_credits INTEGER NOT NULL CHECK (total_credits >= credits_earned)
    );

    CREATE TABLE IF NOT EXISTS library_loans (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(student_id),
      title TEXT NOT NULL,
      returned_at TEXT
    );

    CREATE TABLE IF NOT EXISTS clearance_steps (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(student_id),
      office TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('complete', 'pending'))
    );

    CREATE TABLE IF NOT EXISTS service_action_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL REFERENCES students(student_id),
      action TEXT NOT NULL CHECK (
        action IN ('meal-scan', 'library-search', 'clearance-details', 'id-card-request')
      ),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL REFERENCES students(student_id),
      type TEXT NOT NULL CHECK (type = 'id-card'),
      reason TEXT NOT NULL CHECK (length(reason) BETWEEN 10 AND 500),
      status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const seed = database.transaction(() => {
    database
      .prepare(`
        INSERT INTO students
          (student_id, name, department, campus, academic_year, gpa, credits_earned, total_credits)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id) DO UPDATE SET name = excluded.name
      `)
      .run(
        dashboardData.student.id,
        dashboardData.student.name,
        dashboardData.student.department,
        dashboardData.student.campus,
        dashboardData.student.year,
        Number(dashboardData.stats.gpa),
        dashboardData.stats.credits,
        dashboardData.stats.totalCredits,
      );

    const addLoan = database.prepare(
      "INSERT OR IGNORE INTO library_loans (id, student_id, title) VALUES (?, ?, ?)",
    );
    addLoan.run("demo-loan-1", demoStudentId, "Introduction to Algorithms");
    addLoan.run("demo-loan-2", demoStudentId, "Design Patterns");

    const addClearanceStep = database.prepare(
      "INSERT OR IGNORE INTO clearance_steps (id, student_id, office, status) VALUES (?, ?, ?, ?)",
    );
    addClearanceStep.run("demo-clearance-department", demoStudentId, "Department", "complete");
    addClearanceStep.run("demo-clearance-library", demoStudentId, "Library", "complete");
    addClearanceStep.run("demo-clearance-registrar", demoStudentId, "Registrar", "complete");
    addClearanceStep.run("demo-clearance-finance", demoStudentId, "Finance Office", "pending");
  });

  seed();
  return database;
}

export function getDatabase() {
  if (!globalThis.mauIsimsDatabase || globalThis.mauIsimsDatabase.open === false) {
    globalThis.mauIsimsDatabase = openDatabase();
  }
  return globalThis.mauIsimsDatabase;
}

export function getDashboardFromDatabase() {
  const database = getDatabase();
  const student = database
    .prepare("SELECT * FROM students WHERE student_id = ?")
    .get(demoStudentId) as
    | {
        student_id: string;
        name: string;
        department: string;
        campus: string;
        academic_year: string;
        gpa: number;
        credits_earned: number;
        total_credits: number;
      }
    | undefined;

  if (!student) {
    throw new Error(`Demo student ${demoStudentId} was not found in the database.`);
  }

  const openLoans = database
    .prepare("SELECT COUNT(*) AS count FROM library_loans WHERE student_id = ? AND returned_at IS NULL")
    .get(demoStudentId) as { count: number };
  const clearance = database
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS completed
      FROM clearance_steps
      WHERE student_id = ?
    `)
    .get(demoStudentId) as { total: number; completed: number | null };
  const latestRequest = getLatestServiceRequest();

  return {
    ...dashboardData,
    student: {
      name: student.name,
      initials: student.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      id: student.student_id,
      department: student.department,
      campus: student.campus,
      year: student.academic_year,
    },
    stats: {
      gpa: student.gpa.toFixed(2),
      credits: student.credits_earned,
      totalCredits: student.total_credits,
      books: openLoans.count,
      clearance:
        clearance.total === 0
          ? 0
          : Math.round(((clearance.completed ?? 0) / clearance.total) * 100),
    },
    services: dashboardData.services.map((service) =>
      service.id === "id-card"
        ? {
            ...service,
            status: latestRequest ? `Request ${latestRequest.status}` : "No active request",
            statusTone: latestRequest ? "blue" : "amber",
            description: latestRequest
              ? `Your ID card request is ${latestRequest.status}.`
              : "No ID card request is currently on file.",
          }
        : service,
    ),
  };
}

export function recordServiceAction(action: ServiceAction) {
  getDatabase()
    .prepare("INSERT INTO service_action_events (student_id, action) VALUES (?, ?)")
    .run(demoStudentId, action);
}

export function getLatestServiceRequest() {
  return getDatabase()
    .prepare(`
      SELECT id, type, reason, status, created_at AS createdAt
      FROM service_requests
      WHERE student_id = ?
      ORDER BY id DESC
      LIMIT 1
    `)
    .get(demoStudentId) as StudentServiceRequest | undefined;
}

export function listServiceRequests() {
  return getDatabase()
    .prepare(`
      SELECT id, type, reason, status, created_at AS createdAt
      FROM service_requests
      WHERE student_id = ?
      ORDER BY id DESC
    `)
    .all(demoStudentId) as StudentServiceRequest[];
}

export function createIdCardRequest(reason: string) {
  const database = getDatabase();
  const result = database
    .prepare("INSERT INTO service_requests (student_id, type, reason) VALUES (?, 'id-card', ?)")
    .run(demoStudentId, reason);

  const request = database
    .prepare(`
      SELECT id, type, reason, status, created_at AS createdAt
      FROM service_requests
      WHERE id = ?
    `)
    .get(Number(result.lastInsertRowid)) as StudentServiceRequest | undefined;

  if (!request) {
    throw new Error("The ID card request was saved but could not be read back.");
  }
  return request;
}

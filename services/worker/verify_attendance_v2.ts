import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'services', 'api', '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function verifyAttendanceExport() {
  try {
    // 1. Get a test tenant
    const { rows: tenants } = await pool.query(`SELECT id FROM tenants LIMIT 1`);
    if (tenants.length === 0) throw new Error("No tenants found");
    const tenantId = tenants[0].id;

    // 2. Get a class section with students
    const { rows: sections } = await pool.query(`
      SELECT s.id as section_id, COUNT(st.id) as student_count
      FROM sections s
      JOIN students st ON st.section_id = s.id
      WHERE s.tenant_id = $1 AND st.status = 'active'
      GROUP BY s.id
      HAVING COUNT(st.id) > 0
      LIMIT 1
    `, [tenantId]);

    if (sections.length === 0) throw new Error("No populated class sections found");
    const sectionId = sections[0].section_id;

    // 3. Mark some attendance
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7); // YYYY-MM

    // We already have marking logic, but let's just use the HTTP API we built to test everything!
    // But since we need auth, it's easier to mock DB data or fetch a real token.
    // Let's just do a direct DB insert for speed.

    // Get a user for marked_by
    const { rows: users } = await pool.query(`SELECT id FROM users LIMIT 1`);
    const userId = users[0].id;

    // Create session
    const { rows: sessions } = await pool.query(`
      INSERT INTO attendance_sessions (tenant_id, class_section_id, date, marked_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (class_section_id, date) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `, [tenantId, sectionId, today, userId]);
    const sessionId = sessions[0].id;

    // Clear previous entries for session
    await pool.query(`DELETE FROM attendance_entries WHERE session_id = $1`, [sessionId]);

    // Get students and insert entries
    const { rows: students } = await pool.query(`SELECT id FROM students WHERE section_id = $1 AND status = 'active'`, [sectionId]);

    for (let i = 0; i < students.length; i++) {
      const studentId = students[i].id;
      let status = 'present';
      if (i === 1) status = 'absent';
      if (i === 2) status = 'late';

      await pool.query(`
            INSERT INTO attendance_entries (session_id, student_id, status)
            VALUES ($1, $2, $3)
        `, [sessionId, studentId, status]);
    }

    console.log(`✅ Seeded attendance for section ${sectionId} on ${today}`);

    // Call the HTTP API directly to verify the CSV format
    const res = await fetch(`http://localhost:8080/api/v1/admin/attendance/monthly-summary?class_section_id=${sectionId}&month=${month}`, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
        // Minimal mock auth, if the API doesn't strictly enforce JWKS in dev
      }
    });

    if (!res.ok) {
      // Our dev env usually requires real tokens, so if this fails, we'll verify via the DB function directly
      console.log(`HTTP request failed (${res.status}), verifying DB query instead...`);
      const { rows: summary } = await pool.query(`
            SELECT 
                s.id as student_id,
                s.full_name,
                COUNT(CASE WHEN ae.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN ae.status = 'absent' THEN 1 END) as absent_count
            FROM students s
            LEFT JOIN attendance_sessions ssn ON ssn.class_section_id = s.section_id 
                AND ssn.tenant_id = s.tenant_id
                AND to_char(ssn.date, 'YYYY-MM') = $1
            LEFT JOIN attendance_entries ae ON ae.session_id = ssn.id AND ae.student_id = s.id
            WHERE s.tenant_id = $2 
            AND s.section_id = $3
            AND s.status = 'active'
            GROUP BY s.id, s.full_name
        `, [month, tenantId, sectionId]);

      console.log("DB Query Results (should show present/absent counts):");
      console.table(summary);
    } else {
      const text = await res.text();
      console.log("CSV Output:");
      console.log(text);
    }

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    pool.end();
  }
}

verifyAttendanceExport();

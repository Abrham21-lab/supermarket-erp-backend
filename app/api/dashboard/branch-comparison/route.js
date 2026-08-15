import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT
        b.id,
        b.name,
        COALESCE(SUM(s.total_amount), 0) AS sales
      FROM branches b
      LEFT JOIN sales s
        ON s.branch_id = b.id
      GROUP BY b.id, b.name
      ORDER BY sales DESC;
    `);

    return Response.json(result.rows);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to load branch comparison" },
      { status: 500 }
    );
  }
}
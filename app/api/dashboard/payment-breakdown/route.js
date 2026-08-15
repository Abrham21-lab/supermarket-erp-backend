import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT
        pm.name,
        COALESCE(SUM(s.total_amount),0) AS amount
      FROM payment_methods pm
      LEFT JOIN sales s
        ON s.payment_method_id = pm.id
      GROUP BY pm.id, pm.name
      ORDER BY amount DESC;
    `);

    return Response.json(result.rows);

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Failed to load payment breakdown"
      },
      {
        status: 500
      }
    );
  }
}
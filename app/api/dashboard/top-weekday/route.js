import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT
        EXTRACT(DOW FROM created_at) AS dow,
        SUM(total_amount) AS sales
      FROM sales
      GROUP BY EXTRACT(DOW FROM created_at)
      ORDER BY EXTRACT(DOW FROM created_at);
    `);

    const week = [
      { day: "Sunday", sales: 0 },
      { day: "Monday", sales: 0 },
      { day: "Tuesday", sales: 0 },
      { day: "Wednesday", sales: 0 },
      { day: "Thursday", sales: 0 },
      { day: "Friday", sales: 0 },
      { day: "Saturday", sales: 0 },
    ];

    result.rows.forEach((row) => {
      week[Number(row.dow)].sales = Number(row.sales);
    });

    return Response.json(week);

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to load weekday sales" },
      { status: 500 }
    );
  }
}
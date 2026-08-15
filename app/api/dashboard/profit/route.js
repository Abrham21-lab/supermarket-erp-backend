import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT
        COALESCE(
          SUM(
            (si.unit_price - p.purchase_price) * si.quantity
          ),
          0
        ) AS profit
      FROM sale_items si
      JOIN products p
        ON p.id = si.product_id;
    `);

    return Response.json({
      profit: Number(result.rows[0].profit),
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Failed to load profit",
      },
      {
        status: 500,
      }
    );
  }
}
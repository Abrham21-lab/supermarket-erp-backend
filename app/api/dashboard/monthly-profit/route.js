import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT
        TO_CHAR(s.created_at,'Mon') AS month,
        DATE_TRUNC('month', s.created_at) AS month_order,

        SUM(
          (si.unit_price - p.purchase_price)
          * si.quantity
        ) AS profit

      FROM sale_items si

      JOIN sales s
        ON si.sale_id = s.id

      JOIN products p
        ON si.product_id = p.id

      GROUP BY
        month,
        month_order

      ORDER BY
        month_order;
    `);

    return Response.json(
      result.rows.map(item => ({
        month: item.month,
        profit: Number(item.profit)
      }))
    );

  } catch (error) {

    console.error(error);

    return Response.json(
      {
        error: "Failed to load monthly profit"
      },
      {
        status: 500
      }
    );
  }
}
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";

export async function GET(req) {
  try {

    verifyRequestToken(req);

    const totalProducts = await pool.query(
      "SELECT COUNT(*) FROM products"
    );

    const totalCustomers = await pool.query(
      "SELECT COUNT(*) FROM customers"
    );

    const totalSuppliers = await pool.query(
      "SELECT COUNT(*) FROM suppliers"
    );

    const totalSales = await pool.query(
      `
      SELECT COALESCE(SUM(total_amount),0) AS total
      FROM sales
      `
    );

    return NextResponse.json({
      total_products: Number(
        totalProducts.rows[0].count
      ),
      total_customers: Number(
        totalCustomers.rows[0].count
      ),
      total_suppliers: Number(
        totalSuppliers.rows[0].count
      ),
      total_sales: Number(
        totalSales.rows[0].total
      )
    });

  } catch(error) {

    return NextResponse.json(
      { message:error.message },
      { status:500 }
    );

  }
}
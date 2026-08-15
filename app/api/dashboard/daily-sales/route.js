import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";

export async function GET(req) {
  try {

    verifyRequestToken(req);
    const {searchParams}=
new URL(req.url);


const period =
searchParams.get("period")
|| "week";


let filter="";


if(period==="week")
filter=
"WHERE created_at >= NOW() - INTERVAL '7 days'";


if(period==="month")
filter=
"WHERE created_at >= NOW() - INTERVAL '1 month'";


if(period==="year")
filter=
"WHERE created_at >= NOW() - INTERVAL '1 year'";

    const result = await pool.query(
      `
      SELECT
      DATE(created_at) AS date,
      SUM(total_amount) AS total_sales
      FROM sales
${filter}

GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
      `
    );

    return NextResponse.json(
      result.rows
    );

  } catch(error) {

    return NextResponse.json(
      { message:error.message },
      { status:500 }
    );

  }
}
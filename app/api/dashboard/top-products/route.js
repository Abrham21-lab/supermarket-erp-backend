import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";


export async function GET(req) {

  try {


    verifyRequestToken(req);



    const {searchParams} =
    new URL(req.url);



    const period =
    searchParams.get("period") || "week";



    let condition = "";



    if(period === "week") {

      condition =
      "AND s.created_at >= NOW() - INTERVAL '7 days'";

    }



    if(period === "month") {

      condition =
      "AND s.created_at >= NOW() - INTERVAL '1 month'";

    }



    if(period === "year") {

      condition =
      "AND s.created_at >= NOW() - INTERVAL '1 year'";

    }



    if(period === "all") {

      condition = "";

    }




    const result = await pool.query(

      `
      SELECT

      p.name,

      SUM(si.quantity) AS total_sold


      FROM sale_items si



      JOIN products p

      ON si.product_id = p.id



      JOIN sales s

      ON si.sale_id = s.id



      WHERE 1=1

      ${condition}



      GROUP BY p.name


      ORDER BY total_sold DESC


      LIMIT 5

      `

    );




    return NextResponse.json(

      result.rows

    );




  } catch(error) {


    return NextResponse.json(

      {
        message:error.message
      },

      {
        status:500
      }

    );


  }

}
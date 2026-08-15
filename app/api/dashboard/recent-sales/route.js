import { NextResponse } from "next/server";
import pool from "../../../../lib/db";


export async function GET(req) {

  try {


    const { searchParams } =
    new URL(req.url);



    const period =
    searchParams.get("period") || "week";



    let dateFilter = "";



    if(period === "week") {

      dateFilter =
      "WHERE s.created_at >= NOW() - INTERVAL '7 days'";

    }



    else if(period === "month") {

      dateFilter =
      "WHERE s.created_at >= NOW() - INTERVAL '1 month'";

    }



    else if(period === "year") {

      dateFilter =
      "WHERE s.created_at >= NOW() - INTERVAL '1 year'";

    }





    const result = await pool.query(`

      SELECT

        s.id,

        s.total_amount,

        s.branch_id,

        s.payment_method_id,

        s.created_at,


        b.name AS branch_name,


        pm.name AS payment_method


      FROM sales s



      LEFT JOIN branches b

      ON s.branch_id = b.id



      LEFT JOIN payment_methods pm

      ON s.payment_method_id = pm.id



      ${dateFilter}



      ORDER BY s.id DESC



      LIMIT 10

    `);



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
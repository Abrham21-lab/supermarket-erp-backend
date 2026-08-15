import {
  NextResponse
} from "next/server";


import pool from "@/lib/db";


import {
  verifyRequestToken
} from "@/lib/auth";





export async function GET(req) {


  try {


    verifyRequestToken(req);



    const {
      searchParams
    } = new URL(req.url);



    const report =
      searchParams.get("report") || "sales";


    const period =
      searchParams.get("period") || "all";


    const from =
      searchParams.get("from");


    const to =
      searchParams.get("to");


    const payment =
      searchParams.get("payment");




    /*
    =====================================================
    SALES REPORT
    =====================================================
    */


    if(report === "sales"){



      let conditions = [];

      let values = [];




      if(period !== "all"){



        if(period === "today"){


          values.push(

            new Date()
            .toISOString()
            .split("T")[0]

          );


          conditions.push(

            `DATE(s.created_at) = $${values.length}`

          );

        }



        if(period === "week"){


          conditions.push(

            `
            s.created_at >= NOW() - INTERVAL '7 days'
            `

          );

        }



        if(period === "month"){


          conditions.push(

            `
            s.created_at >= NOW() - INTERVAL '30 days'
            `

          );

        }



        if(period === "year"){


          conditions.push(

            `
            s.created_at >= NOW() - INTERVAL '1 year'
            `

          );

        }


      }




      if(from){


        values.push(from);


        conditions.push(

          `DATE(s.created_at) >= $${values.length}`

        );

      }



      if(to){


        values.push(to);


        conditions.push(

          `DATE(s.created_at) <= $${values.length}`

        );

      }




      if(payment && payment !== "all"){


        values.push(payment);


        conditions.push(

          `s.payment_method_id = $${values.length}`

        );

      }




      let whereClause = "";



      if(conditions.length){


        whereClause =

        "WHERE " +

        conditions.join(" AND ");

      }






      const summaryQuery = `


      SELECT


      COUNT(*) AS total_sales,


      COALESCE(
        SUM(s.total_amount),
        0
      ) AS total_revenue,


      COALESCE(
        AVG(s.total_amount),
        0
      ) AS average_sale



      FROM sales s


      ${whereClause}


      `;



      const summaryResult =

      await pool.query(

        summaryQuery,

        values

      );






      const salesQuery = `


      SELECT


      s.id,


      s.created_at,


      pm.name AS payment_method,


      s.total_amount



      FROM sales s



      LEFT JOIN payment_methods pm


      ON pm.id = s.payment_method_id



      ${whereClause}



      ORDER BY s.created_at DESC



      `;



      const salesResult =

      await pool.query(

        salesQuery,

        values

      );






      const productQuery = `


      SELECT


      p.name,


      SUM(si.quantity) AS quantity,


      SUM(
        si.quantity * si.unit_price
      ) AS revenue



      FROM sale_items si



      JOIN products p


      ON p.id = si.product_id



      JOIN sales s


      ON s.id = si.sale_id



      ${whereClause}



      GROUP BY p.name



      ORDER BY revenue DESC



      LIMIT 10



      `;



      const productResult =

      await pool.query(

        productQuery,

        values

      );





      return NextResponse.json({


        summary:
        summaryResult.rows[0],


        sales:
        salesResult.rows,


        products:
        productResult.rows


      });


    }









    /*
    =====================================================
    INVENTORY REPORT
    =====================================================
    */



    if(report === "inventory"){



      const inventorySummaryQuery = `


      SELECT


      COUNT(p.id) AS total_products,


      COALESCE(
        SUM(ps.quantity),
        0
      ) AS total_stock,



      COALESCE(
        SUM(
          ps.quantity * p.purchase_price
        ),
        0
      ) AS stock_cost,



      COALESCE(
        SUM(
          ps.quantity * p.selling_price
        ),
        0
      ) AS stock_value,



      SUM(

        CASE

        WHEN COALESCE(ps.quantity,0)<=20

        THEN 1

        ELSE 0

        END

      ) AS low_stock_products



      FROM products p



      LEFT JOIN product_stock ps


      ON ps.product_id=p.id



      `;




      const inventorySummaryResult =

      await pool.query(

        inventorySummaryQuery

      );








      const inventoryQuery = `


      SELECT


      p.id,


      p.name,


      c.name AS category,


      s.name AS supplier,


      u.symbol AS unit,


      b.name AS branch,


      COALESCE(
        ps.quantity,
        0
      ) AS quantity,



      p.purchase_price,


      p.selling_price,



      (
      COALESCE(ps.quantity,0)
      *
      p.purchase_price
      ) AS stock_cost,



      (
      COALESCE(ps.quantity,0)
      *
      p.selling_price
      ) AS stock_value,



      CASE


      WHEN COALESCE(ps.quantity,0)=0

      THEN 'Out of Stock'


      WHEN COALESCE(ps.quantity,0)<=20

      THEN 'Low Stock'


      ELSE 'In Stock'


      END AS stock_status



      FROM products p



      LEFT JOIN categories c

      ON c.id=p.category_id



      LEFT JOIN suppliers s

      ON s.id=p.supplier_id



      LEFT JOIN units u

      ON u.id=p.unit_id



      LEFT JOIN product_stock ps

      ON ps.product_id=p.id



      LEFT JOIN branches b

      ON b.id=ps.branch_id



      ORDER BY p.name



      `;




      const inventoryResult =

      await pool.query(

        inventoryQuery

      );






      return NextResponse.json({


        summary:

        inventorySummaryResult.rows[0],


        inventory:

        inventoryResult.rows


      });



    }









    /*
    =====================================================
    PROFIT LOSS REPORT
    =====================================================
    */



    if(report === "profit"){



      let conditions = [];

      let values = [];




      if(period === "week"){


        conditions.push(

          `
          s.created_at >= NOW() - INTERVAL '7 days'
          `

        );


      }



      if(period === "month"){


        conditions.push(

          `
          s.created_at >= NOW() - INTERVAL '30 days'
          `

        );


      }




      if(period === "year"){


        conditions.push(

          `
          s.created_at >= NOW() - INTERVAL '1 year'
          `

        );


      }





      let whereClause="";



      if(conditions.length){


        whereClause=

        "WHERE " +

        conditions.join(" AND ");

      }






      const profitSummaryQuery = `


      SELECT



      COALESCE(

      SUM(s.total_amount),

      0

      ) AS total_sales,



      COALESCE(

      (

      SELECT SUM(subtotal)

      FROM purchase_items

      ),

      0

      ) AS total_cost,



      COALESCE(

      SUM(s.total_amount),

      0

      )

      -

      COALESCE(

      (

      SELECT SUM(subtotal)

      FROM purchase_items

      ),

      0

      ) AS profit



      FROM sales s



      ${whereClause}



      `;





      const profitSummaryResult =

      await pool.query(

        profitSummaryQuery,

        values

      );






      const profitTableQuery = `


      SELECT



      p.name AS product,


      SUM(si.quantity) AS quantity,



      SUM(
      si.quantity * si.unit_price
      ) AS revenue,



      SUM(
      si.quantity * p.purchase_price
      ) AS cost,



      SUM(

      (

      si.unit_price -

      p.purchase_price

      )

      *

      si.quantity

      ) AS profit



      FROM sale_items si



      JOIN products p


      ON p.id=si.product_id



      JOIN sales s


      ON s.id=si.sale_id



      ${whereClause}



      GROUP BY p.name



      ORDER BY profit DESC



      `;




      const profitTableResult =

      await pool.query(

        profitTableQuery,

        values

      );






      return NextResponse.json({


        summary:

        profitSummaryResult.rows[0],



        profit:

        profitTableResult.rows



      });



    }







    return NextResponse.json(

      {
        message:"Invalid report type"
      },

      {
        status:400
      }

    );





  }

  catch(error){



    console.error(

      "Reports API Error:",

      error.message

    );



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
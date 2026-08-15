import { query } from "@/lib/db"; // adjust if your db helper is different

export async function GET() {

  try {

    // helper function
    const sumSales = async (startDate, endDate) => {
      const result = await query(
        `
        SELECT COALESCE(SUM(total_amount),0) as total
        FROM sales
        WHERE created_at >= $1 AND created_at <= $2
        `,
        [startDate, endDate]
      );

      return parseFloat(result.rows[0].total);
    };



    const now = new Date();

    // ---------------- TODAY ----------------
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);



    // ---------------- WEEK ----------------
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(now.getDate() - 14);

    const prevWeekEnd = weekStart;



    // ---------------- MONTH ----------------
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const prevMonthEnd = monthStart;



    // ---------------- YEAR ----------------
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);

    const prevYearEnd = yearStart;



    // EXECUTE QUERIES

    const today = await sumSales(todayStart, todayEnd);
    const yesterday = await sumSales(yesterdayStart, yesterdayEnd);

    const week = await sumSales(weekStart, todayEnd);
    const prevWeek = await sumSales(prevWeekStart, prevWeekEnd);

    const month = await sumSales(monthStart, todayEnd);
    const prevMonth = await sumSales(prevMonthStart, prevMonthEnd);

    const year = await sumSales(yearStart, todayEnd);
    const prevYear = await sumSales(prevYearStart, prevYearEnd);



    return Response.json({
      today: {
        current: today,
        previous: yesterday
      },

      week: {
        current: week,
        previous: prevWeek
      },

      month: {
        current: month,
        previous: prevMonth
      },

      year: {
        current: year,
        previous: prevYear
      }
    });



  } catch (error) {

    return Response.json(
      { error: "Failed to load sales comparison" },
      { status: 500 }
    );

  }
}
import pool from "./db";


export async function getUsersByRoles(roles){


const result = await pool.query(

`
SELECT 
u.id

FROM users u

JOIN roles r

ON u.role_id=r.id

WHERE r.name = ANY($1)

AND u.is_active=true

`,
[
roles
]

);


return result.rows.map(
user=>user.id
);


}
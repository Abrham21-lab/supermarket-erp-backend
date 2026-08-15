import pool from "./db";


export async function createNotification({
    userIds,
    type,
    title,
    message,
    reference_id
}) {


    for(const userId of userIds){


        await pool.query(
`
INSERT INTO notifications
(
user_id,
type,
title,
message,
reference_id
)

VALUES
(
$1,
$2,
$3,
$4,
$5
)

`,
[
userId,
type,
title,
message,
reference_id
]

);


    }


}
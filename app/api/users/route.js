import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import bcrypt from "bcryptjs";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  createUserSchema
} from "../../../lib/validations/userValidation";

import {
  validate
} from "../../../lib/validations/validate";

// ===============================
// GET ALL USERS
// ===============================
export async function GET(req) {
  try {
    const currentUser = verifyRequestToken(req);
    let result;

    // ===============================
    // SYSTEM ADMIN - sees all users
    // ===============================
    if (currentUser.isSystemAdmin) {
      result = await pool.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.is_active,
          u.created_at,
          u.tenant_id,
          u.is_system_admin,
          t.name AS tenant_name,
          COALESCE(
            json_agg(
              json_build_object('id', r.id, 'name', r.name)
            ) FILTER (WHERE r.id IS NOT NULL), 
            '[]'::json
          ) AS roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        GROUP BY u.id, t.name
        ORDER BY u.id ASC
        `
      );
    }

    // ===============================
    // TENANT USERS - own tenant only
    // ===============================
    else {
      if (!currentUser.tenantId) {
        throw new Error("Tenant not found in token");
      }

      result = await pool.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.is_active,
          u.created_at,
          u.tenant_id,
          u.is_system_admin,
          t.name AS tenant_name,
          COALESCE(
            json_agg(
              json_build_object('id', r.id, 'name', r.name)
            ) FILTER (WHERE r.id IS NOT NULL), 
            '[]'::json
          ) AS roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE u.tenant_id = $1
        GROUP BY u.id, t.name
        ORDER BY u.id ASC
        `,
        [currentUser.tenantId]
      );
    }

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// ===============================
// CREATE USER (with Transaction)
// ===============================
// ===============================
// CREATE USER (with Transaction)
// ===============================
export async function POST(req) {
  const client = await pool.connect();

  try {

    const currentUser = verifyRequestToken(req);


    if (!currentUser.isSystemAdmin) {
      requireRole(currentUser, ["admin"]);
    }


    const body = await req.json();

    const data = validate(
      createUserSchema,
      body
    );


    if (data instanceof Response) {
      return data;
    }


    const {
      full_name,
      email,
      password,
      role_ids,
      tenant_id
    } = data;



    const existing = await pool.query(
      `SELECT id FROM users WHERE email=$1`,
      [email]
    );


    if(existing.rows.length){
      return NextResponse.json(
        {
          message:"User already exists"
        },
        {
          status:400
        }
      );
    }



    let assignedTenant;



    if(currentUser.isSystemAdmin){

      if(!tenant_id){
        return NextResponse.json(
          {
            message:"Tenant is required"
          },
          {
            status:400
          }
        );
      }


      assignedTenant=Number(tenant_id);

    }
    else{

      if(!currentUser.tenantId){
        throw new Error(
          "Tenant not found in token"
        );
      }


      assignedTenant=currentUser.tenantId;

    }




    const tenantCheck = await pool.query(
      `
      SELECT id 
      FROM tenants
      WHERE id=$1
      `,
      [
        assignedTenant
      ]
    );


    if(!tenantCheck.rows.length){

      return NextResponse.json(
        {
          message:"Invalid tenant"
        },
        {
          status:400
        }
      );

    }



    const uniqueRoles=[
      ...new Set(role_ids || [])
    ];



    if(uniqueRoles.length){

      const rolesCheck=await pool.query(
        `
        SELECT id
        FROM roles
        WHERE id = ANY($1)
        `,
        [
          uniqueRoles
        ]
      );


      if(
        rolesCheck.rows.length !== uniqueRoles.length
      ){

        return NextResponse.json(
          {
            message:"One or more roles are invalid"
          },
          {
            status:400
          }
        );

      }

    }




    const hashedPassword =
      await bcrypt.hash(password,10);



    await client.query("BEGIN");



    const userResult =
      await client.query(
        `
        INSERT INTO users
        (
          full_name,
          email,
          password_hash,
          tenant_id,
          is_active,
          is_system_admin
        )
        VALUES
        (
          $1,$2,$3,$4,true,false
        )
        RETURNING
        id,
        full_name,
        email,
        tenant_id
        `,
        [
          full_name,
          email,
          hashedPassword,
          assignedTenant
        ]
      );



    const newUserId =
      userResult.rows[0].id;



    if(uniqueRoles.length){


      const values =
      uniqueRoles
      .map(
        (_,i)=>`($1,$${i+2})`
      )
      .join(",");



      await client.query(
        `
        INSERT INTO user_roles
        (
          user_id,
          role_id
        )
        VALUES ${values}
        `,
        [
          newUserId,
          ...uniqueRoles
        ]
      );

    }




    await client.query("COMMIT");



    return NextResponse.json(
      {
        success:true,
        user:{
          ...userResult.rows[0],
          role_ids:uniqueRoles
        }
      },
      {
        status:201
      }
    );



  }
  catch(error){

    try{
      await client.query("ROLLBACK");
    }
    catch{}


    console.error(
      "CREATE USER ERROR:",
      error
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
  finally{

    client.release();

  }
}
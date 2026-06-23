import { NextResponse } from "next/server";

export function validate(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      },
      {
        status: 400,
      }
    );
  }

  return result.data;
}
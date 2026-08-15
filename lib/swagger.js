export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Supermarket ERP API",
    version: "1.0.0",
    description: "Complete ERP backend system",
  },

  tags: [
  {
    name: "Authentication",
    description: "User authentication and authorization endpoints",
  },
  {
  name: "Purchases",
  description: "Supplier purchases and stock replenishment"
},
  {
  name: "Reference Data",
  description: "Master data used throughout the ERP system such as categories, suppliers, branches, units, and payment methods",
},
  {
    name: "Users",
    description: "Manage system users, roles assignment, and account status",
  },
  {
    name: "Roles",
    description: "Manage user roles and permissions",
  },
  {
    name: "Tenants",
    description: "Manage companies, branches, and tenant information",
  },
  {
    name: "Products",
    description: "Manage products and product information",
  },
  {
    name: "Inventory",
    description:
"Manage product stock, stock transactions, and branch-to-branch inventory transfers",
  },
  {
    name: "Sales",
    description: "Manage sales transactions and sales records",
  },
  {
    name: "Dashboard",
    description: "ERP dashboard analytics, reports, and KPIs",
  },
  {
  name: "Customers",
  description: "Customer management and customer records"
},
{
  name: "Notifications",
  description: "Manage user notifications and read/unread status",
},
{
  name: "Reports",
  description: "ERP reports and analytics",
},

{
  name: "Settings",
  description: "System configuration settings",
},

{
  name: "Taxes",
  description: "Tax configuration and VAT management",
},
{
  name: "Revenue Targets",
  description: "the current revenue target data",
},

],

  servers: [
    { url: "http://localhost:3000" },
  ],

   components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token",
      },
    },
  },

  // ADD THIS
  security: [
    {
      BearerAuth: [],
    },
  ],

  paths: {
    "/api/reference": {
  get: {
    tags: ["Reference Data"],
    summary: "Get all reference data",
    responses: {
      200: {
        description: "Reference data retrieved"
      }
    }
  }
},

"/api/suppliers": {

  get: {

    tags: ["Reference Data"],

    summary: "Get all suppliers",

    responses: {

      200: {
        description: "Suppliers retrieved"
      }

    }

  },


  post: {

    tags: ["Reference Data"],

    summary: "Create supplier",


    requestBody: {

      required: true,

      content: {

        "application/json": {

          example: {

            name: "ABC Trading",

            contact_person: "John Doe",

            phone: "+251911111111",

            email: "supplier@example.com",

            address: "Addis Ababa"

          }

        }

      }

    },


    responses: {

      201: {

        description: "Supplier created"

      }

    }

  }

},



"/api/suppliers/{id}": {


  get: {

    tags: ["Reference Data"],

    summary: "Get supplier by ID",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],


    responses: {


      200: {

        description: "Supplier found"

      },


      404: {

        description: "Supplier not found"

      }

    }

  },



  put: {

    tags: ["Reference Data"],

    summary: "Update supplier",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],



    requestBody: {

      required: true,

      content: {

        "application/json": {

          example: {

            name: "ABC Trading Updated",

            contact_person: "Abebe Kebede",

            phone: "+251922222222",

            email: "updated@example.com",

            address: "Bole Addis Ababa"

          }

        }

      }

    },


    responses: {


      200: {

        description: "Supplier updated"

      },


      404: {

        description: "Supplier not found"

      }


    }

  },




  delete: {

    tags: ["Reference Data"],

    summary: "Delete supplier",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],


    responses: {


      200: {

        description: "Supplier deleted"

      },


      404: {

        description: "Supplier not found"

      }


    }

  }


},

"/api/branches": {
  get: {
    tags: ["Reference Data"],
    summary: "Get all branches",

    responses: {
      200: {
        description: "Branches retrieved"
      }
    }
  },

  post: {
    tags: ["Reference Data"],
    summary: "Create branch",

    requestBody: {
      required: true,
      content: {
        "application/json": {
          example: {
            name: "Addis Branch",
            address: "Bole",
            phone: "+251922222222",
            tenant_id: 1
          }
        }
      }
    },

    responses: {
      201: {
        description: "Branch created"
      }
    }
  }
},
"/api/branches/{id}": {

  get: {
    tags: ["Reference Data"],
    summary: "Get branch by ID",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Branch found"
      }
    }
  },

  put: {
  tags: ["Reference Data"],
  summary: "Update branch",

  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: {
        type: "integer"
      }
    }
  ],

  requestBody: {
    required: true,
    content: {
      "application/json": {
        example: {
          tenant_id: 1,
          name: "Main Branch",
          address: "Bole",
          phone: "0911223344",
          status: true
        }
      }
    }
  },

  responses: {
    200: {
      description: "Branch updated"
    },
    404: {
      description: "Branch not found"
    }
  }
},
  delete: {
    tags: ["Reference Data"],
    summary: "Delete branch",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Branch deleted"
      }
    }
  }

},

"/api/units": {

  get: {
    tags: ["Reference Data"],
    summary: "Get all units",

    responses: {
      200: {
        description: "Units retrieved"
      }
    }
  },

  post: {
    tags: ["Reference Data"],
    summary: "Create unit",

    requestBody: {
      required: true,

      content: {
        "application/json": {
          example: {
            name: "Piece",
            abbreviation: "PCS"
          }
        }
      }
    },

    responses: {
      201: {
        description: "Unit created"
      }
    }
  }

},
"/api/units/{id}": {

  get: {
  tags: ["Reference Data"],
  summary: "Get unit by ID",

  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: {
        type: "integer"
      }
    }
  ],

  responses: {
    200: {
      description: "Unit retrieved successfully"
    },
    404: {
      description: "Unit not found"
    }
  }
},

   put: {
    tags: ["Reference Data"],
    summary: "Update unit",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    requestBody: {
      required: true,
      content: {
        "application/json": {
          example: {
            name: "Kilogram",
            symbol: "KG"
          }
        }
      }
    },

    responses: {
      200: {
        description: "Unit updated"
      }
    }
  },
      

  delete: {
  tags: ["Reference Data"],
  summary: "Delete unit",

  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      description: "Unit ID",
      schema: {
        type: "integer",
        example: 1
      }
    }
  ],

  responses: {
    200: {
      description: "Unit deleted successfully",
      content: {
        "application/json": {
          example: {
            message: "Unit deleted successfully"
          }
        }
      }
    },

    404: {
      description: "Unit not found"
    },

    500: {
      description: "Internal server error"
    }
  }
}

},

"/api/payment-methods": {

  get: {
    tags: ["Reference Data"],
    summary: "Get all payment methods",

    responses: {
      200: {
        description: "Payment methods retrieved"
      }
    }
  },

  post: {
    tags: ["Reference Data"],
    summary: "Create payment method",

    requestBody: {
      required: true,

      content: {
        "application/json": {
          example: {
            name: "Telebirr",
            is_active: true
          }
        }
      }
    },

    responses: {
      201: {
        description: "Payment method created"
      }
    }
  }

},

"/api/payment-methods/{id}": {

  get: {
    tags: ["Reference Data"],
    summary: "Get payment method by ID",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Payment method retrieved successfully",

        content: {
          "application/json": {
            example: {
              id: 1,
              name: "Telebirr",
              is_active: true
            }
          }
        }
      },

      404: {
        description: "Payment method not found"
      }
    }
  },



  put: {
    tags: ["Reference Data"],
    summary: "Update payment method",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    requestBody: {
      required: true,

      content: {
        "application/json": {
          example: {
            name: "Telebirr Updated",
            is_active: true
          }
        }
      }
    },

    responses: {
      200: {
        description: "Payment method updated successfully",

        content: {
          "application/json": {
            example: {
              id: 1,
              name: "Telebirr Updated",
              is_active: true
            }
          }
        }
      },

      400: {
        description: "Validation failed"
      },

      404: {
        description: "Payment method not found"
      }
    }
  },



  delete: {
    tags: ["Reference Data"],
    summary: "Delete payment method",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Payment method deleted successfully",

        content: {
          "application/json": {
            example: {
              message: "Payment method deleted successfully"
            }
          }
        }
      },

      404: {
        description: "Payment method not found"
      }
    }
  }

},

    // ================= PRODUCTS =================
    "/api/products": {

  get: {

    tags: ["Products"],

    summary: "Get all products",

    responses: {

      200: {

        description: "Products retrieved"

      }

    }

  },


  post: {

    tags: ["Products"],

    summary: "Create product",


    requestBody: {

      required: true,

      content: {

        "application/json": {

          example: {

            name: "Milk",

            barcode: "MILK001",

            category_id: 1,

            supplier_id: 2,

            unit_id: 1,

            purchase_price: 40,

            selling_price: 50,
            status:true,
            tax_id:1

          }

        }

      }

    },


    responses: {

      201: {

        description: "Product created"

      }

    }

  }

},



"/api/products/{id}": {


  get: {

    tags: ["Products"],

    summary: "Get product by ID",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],


    responses: {


      200: {

        description: "Product found"

      },


      404: {

        description: "Product not found"

      }


    }

  },




  put: {

    tags: ["Products"],

    summary: "Update product",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],



    requestBody: {

      required: true,

      content: {

        "application/json": {

          example: {

            name: "Updated Milk",

            barcode: "MILK002",

            category_id: 1,

            supplier_id: 2,

            unit_id: 1,

            purchase_price: 45,

            selling_price: 55,
            status: true

          }

        }

      }

    },


    responses: {


      200: {

        description: "Product updated"

      },


      404: {

        description: "Product not found"

      }


    }

  },



},


    // ================= SALES =================
    "/api/sales": {

  get: {

    tags: ["Sales"],

    summary: "Get all sales",

    responses: {

      200: {

        description: "Sales retrieved",

        content: {

          "application/json": {

            example: [

              {

                id: 1,

                customer_id: 1,

                total: 1000,

                created_at: "2026-06-22T10:00:00.000Z"

              }

            ]

          }

        }

      }

    }

  },



  post: {

    tags: ["Sales"],

    summary: "Create sale",


    requestBody: {

      required:true,


      content: {

        "application/json": {

          example: {
  branch_id: 1,
  payment_method_id: 1,
  items: [
    {
      product_id: 1,
      quantity: 2,
      unit_price: 50
    },
    {
      product_id: 2,
      quantity: 3,
      unit_price: 100
    }
  ]
},

          

        }

      }

    },



    responses:{


      201:{

        description:"Sale created",

        content:{

          "application/json":{

            example:{


              id:1,

              total:400,

              message:"Sale created successfully"


            }

          }

        }

      },


      400:{

        description:"Invalid sale data"

      }

    }

  }

},





"/api/sales/{id}": {


  get:{


    tags:["Sales"],


    summary:"Get sale by ID",



    parameters:[


      {

        name:"id",

        in:"path",

        required:true,


        schema:{

          type:"integer"

        }

      }


    ],




    responses:{



      200:{


        description:"Sale found",


        content:{


          "application/json":{


            example:{


              sale:{


                id:1,

                total:400,

                created_at:"2026-06-22T10:00:00.000Z"


              },


              items:[


                {


                  product_name:"Milk",

                  quantity:2,

                  price:50


                }


              ]

            }


          }


        }


      },



      404:{


        description:"Sale not found"


      }



    }



  }



},
    // ================= INVENTORY =================
   "/api/inventory": {

  get: {

    tags: ["Inventory"],

    summary: "Get inventory transactions",

    responses: {

      200: {

        description: "Inventory transactions retrieved",

        content: {

          "application/json": {

            example: [

              {

                id: 1,

                product_id: 1,

                branch_id: 1,

                transaction_type: "STOCK_IN",

                quantity: 100,

                reference: "Purchase invoice #001",

                created_at: "2026-06-22T10:00:00.000Z"

              },

              {

                id: 2,

                product_id: 1,

                branch_id: 1,

                transaction_type: "STOCK_OUT",

                quantity: 10,

                reference: "Sale #1001",

                created_at: "2026-06-22T11:00:00.000Z"

              }

            ]

          }

        }

      }

    }

  },



  post: {

    tags: ["Inventory"],

    summary: "Create stock transaction",


    requestBody: {

      required: true,


      content: {

        "application/json": {

          example: {

            product_id: 1,

            branch_id: 1,

            transaction_type: "STOCK_IN",

            quantity: 100,

            reference: "Purchase invoice #001"

          }

        }

      }

    },


    responses: {

      201: {

        description: "Inventory transaction created",

        content: {

          "application/json": {

            example: {

              id: 1,

              product_id: 1,

              branch_id: 1,

              transaction_type: "STOCK_IN",

              quantity: 100,

              reference: "Purchase invoice #001",

              created_at: "2026-06-22T10:00:00.000Z"

            }

          }

        }

      },



      400: {

        description: "Invalid request data"

      },



      500: {

        description: "Internal server error"

      }

    }

  }

},
"/api/stock-adjustments": {


get: {

tags:["Inventory"],

summary:"Get all stock adjustments",


responses:{


200:{

description:"Stock adjustments retrieved"

}


}

},



post:{


tags:["Inventory"],


summary:"Create stock adjustment",


requestBody:{


required:true,


content:{


"application/json":{


example:{


product_id:1,

branch_id:1,

adjustment_type:"DECREASE",

quantity:20,

reason:"Damaged products"


}


}


}


},


responses:{


201:{

description:"Stock adjustment created"

}


}


}



},
    // ================= AUTH =================
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                email: "admin@test.com",
                password: "123456",
              },
            },
          },
        },
        responses: { 200: { description: "Token returned" } },
      },
    },


  "/api/dashboard/summary": {
  get: {
    tags: ["Dashboard"],
    summary: "Dashboard Summary",
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: "Success" }
    }
  }
},

"/api/dashboard/daily-sales": {
  get: {
    tags: ["Dashboard"],
    summary: "Daily Sales Report",
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: "Success" }
    }
  }
},

"/api/dashboard/weekly-sales": {
  get: {
    tags: ["Dashboard"],
    summary: "Weekly Sales Report",
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: "Success" }
    }
  }
},

"/api/dashboard/monthly-sales": {
  get: {
    tags: ["Dashboard"],
    summary: "Monthly Sales Report",
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: "Success" }
    }
  }
},

"/api/dashboard/top-products": {
  get: {
    tags: ["Dashboard"],
    summary: "Top Selling Products",
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: "Success" }
    }
  }
},

"/api/dashboard/low-stock": {
  get: {
    tags: ["Dashboard"],
    summary: "Low Stock Products",
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: "Success" }
    }
  }
},

"/api/dashboard/branch-stock-value": {
  get: {
    tags: ["Dashboard"],
    summary: "Inventory value by branch",
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "Branch stock values retrieved"
      }
    }
  }
},

"/api/dashboard/recent-sales": {


get: {

tags:["Dashboard"],


summary:"Get recent sales",


responses:{


200:{

description:
"Recent sales retrieved"

}


}


}


},


// ================= ROLES =================

"/api/roles": {

  get: {
    tags: ["Roles"],
    summary: "Get all roles",
    responses:{
      200:{
        description:"Roles retrieved"
      }
    }
  },


  post:{
    tags: ["Roles"],
    summary:"Create role",

    requestBody:{
      required:true,

      content:{
        "application/json":{

          example:{
            name:"Supervisor",
            description:"Manage branch operations"
          }

        }
      }
    },


    responses:{
      201:{
        description:"Role created"
      }
    }

  }

},


"/api/roles/{id}":{


  get:{
    tags: ["Roles"],
    summary:"Get role by id",

    parameters:[
      {
        name:"id",
        in:"path",
        required:true,
        schema:{
          type:"integer"
        }
      }
    ],

    responses:{
      200:{
        description:"Role found"
      }
    }
  },



  put:{
    tags: ["Roles"],
    summary:"Update role",

    parameters:[
      {
        name:"id",
        in:"path",
        required:true,
        schema:{
          type:"integer"
        }
      }
    ],


    requestBody:{
      required:true,

      content:{
        "application/json":{

          example:{
            name:"Manager",
            description:"Updated description"
          }

        }
      }
    },


    responses:{
      200:{
        description:"Role updated"
      }
    }

  },



  delete:{
    tags: ["Roles"],

    summary:"Delete role",

    parameters:[
      {
        name:"id",
        in:"path",
        required:true,
        schema:{
          type:"integer"
        }
      }
    ],


    responses:{
      200:{
        description:"Role deleted"
      }
    }

  }


},

// ================= USERS =================


"/api/users":{

get:{
tags:["Users"],
summary:"Get all users",

responses:{
200:{
description:"Users retrieved"
}
}

},



post:{
tags:["Users"],
summary:"Create user",


requestBody:{
required:true,


content:{

"application/json":{


example:{

full_name:"John Cashier",

email:"john@erp.com",

password:"123456",

tenant_id:1,

role_ids:[3]

}


}

}

},


responses:{

201:{
description:"User created"
}

}

}


},






"/api/users/{id}":{


get:{
tags:["Users"],
summary:"Get user by id",


parameters:[

{

name:"id",

in:"path",

required:true,

schema:{
type:"integer"
}

}

],


responses:{

200:{
description:"User found"
}

}

},





put:{

tags:["Users"],

summary:"Update user",


parameters:[

{

name:"id",

in:"path",

required:true,

schema:{
type:"integer"
}

}

],



requestBody:{

required:true,


content:{


"application/json":{


example:{


full_name:"Updated Name",

email:"updated@email.com",

tenant_id:1,

role_ids:[2,3],

is_active:true


}


}

}

},


responses:{

200:{
description:"User updated"
}

}

},







delete:{

tags:["Users"],

summary:"Delete user",


parameters:[

{

name:"id",

in:"path",

required:true,

schema:{
type:"integer"
}

}

],


responses:{

200:{
description:"User deleted"
}

}

}


},

"/api/tenants": {
  get: {
    tags: ["Tenants"],
    summary: "Get all tenants",

    responses: {
      200: {
        description: "Tenants retrieved successfully",

        content: {
          "application/json": {
            example: [
              {
                id: 1,
                name: "Emawa Hypermarket",
                logo: "",
                contact_email: "freshcorner@gmail.com",
                phone: "0910103456",
                address: "Addis Ababa",
                status: true,
                created_at: "2026-06-18T12:00:00Z"
              },
              {
                id: 2,
                name: "Fresh Corner",
                logo: "",
                contact_email: "admin@freshcorner.com",
                phone: "0911223344",
                address: "Bahir Dar",
                status: true,
                created_at: "2026-06-18T12:10:00Z"
              }
            ]
          }
        }
      },

      500: {
        description: "Internal server error"
      }
    }
  },

  post: {
  tags: ["Tenants"],
  summary: "Create tenant",

  requestBody: {
  required: true,

  content: {

    "multipart/form-data": {

      schema: {

        type: "object",

        required: [
          "name",
          "contact_email",
          "phone"
        ],

        properties: {

          name: {
            type:"string",
            example:"Emawa Hypermarket"
          },


          logo: {

            type:"string",

            format:"binary",

            description:
            "Tenant logo image"

          },


          contact_email: {

            type:"string",

            example:
            "freshcorner@gmail.com"

          },


          phone: {

            type:"string",

            example:
            "0910103456"

          },


          address: {

            type:"string",

            example:
            "Addis Ababa"

          },


          status: {

            type:"boolean",

            example:true

          }

        }

      }

    }

  }

},

  responses: {
    201: {
      description: "Tenant created",

      content: {
        "application/json": {
          example: {
            id: 1,
            name: "Emawa Hypermarket",
            logo: "",
            contact_email: "freshcorner@gmail.com",
            phone: "0910103456",
            address: "Addis Ababa",
            status: true,
            created_at: "2026-06-18T12:00:00Z"
          }
        }
      }
    },

    400: {
      description: "Validation error"
    },

    500: {
      description: "Internal server error"
    }
  }
}
},

"/api/tenants/{id}": {

  get: {
    tags: ["Tenants"],
    summary: "Get tenant by ID",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Tenant found"
      },
      404: {
        description: "Tenant not found"
      }
    }
  },



  put: {
    tags: ["Tenants"],
    summary: "Update tenant",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {

type:"object",

properties:{


name:{
type:"string",
example:"Updated Tenant"
},


logo:{
type:"string",
format:"binary",
description:"New tenant logo"
},


contact_email:{
type:"string",
example:"admin@tenant.com"
},


phone:{
type:"string",
example:"+251911111111"
},


address:{
type:"string",
example:"Addis Ababa"
},


status:{
type:"boolean",
example:true
}


}

}
        }
      }
    },

    responses: {
      200: {
        description: "Tenant updated"
      },
      404: {
        description: "Tenant not found"
      }
    }
  },



  delete: {
    tags: ["Tenants"],
    summary: "Delete tenant",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Tenant deleted"
      },
      404: {
        description: "Tenant not found"
      }
    }
  }

},


// ================= INVENTORY TRANSFERS =================

"/api/inventory-transfers":{

get:{
tags:["Inventory"],
summary:"Get all inventory transfers",

responses:{
200:{
description:"Transfers retrieved"
}
}

},


post:{

tags:["Inventory"],

summary:"Create inventory transfer",


requestBody:{

required:true,

content:{

"application/json":{

example:{

product_id:1,

from_branch_id:1,

to_branch_id:2,

quantity:50,

reference:"Transfer to Bole branch"

}

}

}

},


responses:{

201:{
description:"Transfer created"
}

}

}

},



"/api/inventory-transfers/{id}":{


get:{

tags:["Inventory"],

summary:"Get transfer by ID",

parameters:[

{

name:"id",

in:"path",

required:true,

schema:{
type:"integer"
}

}

],


responses:{

200:{
description:"Transfer found"
},

404:{
description:"Transfer not found"
}

}

}

},
"/api/purchases": {

  get: {
    tags: ["Purchases"],
    summary: "Get all purchases",

    responses: {
      200: {
        description: "Purchases retrieved"
      }
    }
  },

  post: {
    tags: ["Purchases"],
    summary: "Create purchase",

    requestBody: {
      required: true,

      content: {
        "application/json": {

          example: {

            supplier_id: 1,

            branch_id: 1,

            invoice_number: "INV-001",

            items: [

              {
                product_id: 1,
                quantity: 100,
                purchase_price: 40
              },

              {
                product_id: 2,
                quantity: 50,
                purchase_price: 25
              }

            ]

          }

        }
      }
    },

    responses: {
      201: {
        description: "Purchase created"
      }
    }
  }

},

"/api/purchases/{id}": {

  get: {

    tags:["Purchases"],

    summary:"Get purchase by ID",

    parameters:[
      {
        name:"id",
        in:"path",
        required:true,
        schema:{
          type:"integer"
        }
      }
    ],

    responses:{
      200:{
        description:"Purchase found"
      },
      404:{
        description:"Purchase not found"
      }
    }

  }

},
"/api/categories": {

  get: {
    tags: ["Reference Data"],
    summary: "Get all categories",

    responses: {
      200: {
        description: "Categories retrieved",

        content: {
          "application/json": {
            example: [
              {
                id: 1,
                name: "Beverages"
              },
              {
                id: 2,
                name: "Food"
              }
            ]
          }
        }
      }
    }
  },

  post: {
    tags: ["Reference Data"],
    summary: "Create category",

    requestBody: {
      required: true,

      content: {
        "application/json": {
          example: {
            name: "Beverages"
          }
        }
      }
    },

    responses: {
      201: {
        description: "Category created",

        content: {
          "application/json": {
            example: {
              id: 1,
              name: "Beverages"
            }
          }
        }
      }
    }
  }

},

"/api/categories/{id}": {

  get: {
    tags: ["Reference Data"],
    summary: "Get category by ID",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Category found",

        content: {
          "application/json": {
            example: {
              id: 1,
              name: "Beverages"
            }
          }
        }
      }
    }
  },

  put: {
    tags: ["Reference Data"],
    summary: "Update category",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    requestBody: {
      required: true,

      content: {
        "application/json": {
          example: {
            name: "Updated Category"
          }
        }
      }
    },

    responses: {
      200: {
        description: "Category updated"
      }
    }
  },

  delete: {
    tags: ["Reference Data"],
    summary: "Delete category",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Category deleted"
      }
    }
  }

},

"/api/customers": {

  get: {
    tags: ["Customers"],
    summary: "Get all customers",

    responses: {
      200: {
        description: "Customers retrieved",

        content: {
          "application/json": {
            example: [
              {
                id: 1,
                full_name: "Abebe Kebede",
                phone: "0911000000",
                email: "abebe@gmail.com",
                address: "Addis Ababa"
              }
            ]
          }
        }
      }
    }
  },

  post: {
    tags: ["Customers"],
    summary: "Create customer",

    requestBody: {
      required: true,

      content: {
        "application/json": {
          example: {
            full_name: "Abebe Kebede",
            phone: "0911000000",
            email: "abebe@gmail.com",
            address: "Addis Ababa"
          }
        }
      }
    },

    responses: {
      201: {
        description: "Customer created",

        content: {
          "application/json": {
            example: {
              id: 1,
              full_name: "Abebe Kebede",
              phone: "0911000000",
              email: "abebe@gmail.com",
              address: "Addis Ababa",
              created_at: "2026-06-18T12:00:00Z"
            }
          }
        }
      }
    }
  }

},

"/api/customers/{id}": {

  get: {
    tags: ["Customers"],
    summary: "Get customer by ID",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Customer found",

        content: {
          "application/json": {
            example: {
              id: 1,
              full_name: "Abebe Kebede",
              phone: "0911000000",
              email: "abebe@gmail.com",
              address: "Addis Ababa"
            }
          }
        }
      }
    }
  },

  put: {
    tags: ["Customers"],
    summary: "Update customer",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    requestBody: {
      required: true,

      content: {
        "application/json": {
          example: {
            full_name: "Updated Customer",
            phone: "0911223344",
            email: "updated@gmail.com",
            address: "Bole Addis Ababa"
          }
        }
      }
    },

    responses: {
      200: {
        description: "Customer updated"
      }
    }
  },

  delete: {
    tags: ["Customers"],
    summary: "Delete customer",

    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "integer"
        }
      }
    ],

    responses: {
      200: {
        description: "Customer deleted"
      }
    }
  }

},

"/api/brands": {

  get: {
    tags: ["Reference Data"],
    summary: "Get all brands",

    responses: {

      200: {
        description: "Brands retrieved",

        content: {
          "application/json": {

            example: [
              {
                id: 1,
                name: "Samsung"
              },
              {
                id: 2,
                name: "Apple"
              }
            ]

          }
        }
      }

    }

  },


  post: {

    tags: ["Reference Data"],
    summary: "Create brand",


    requestBody: {

      required: true,

      content: {

        "application/json": {

          example: {

            name: "Samsung"

          }

        }

      }

    },


    responses: {

      201: {

        description: "Brand created",

        content: {

          "application/json": {

            example: {

              id:1,
              name:"Samsung"

            }

          }

        }

      },


      400:{
        description:"Validation failed"
      }

    }

  }

},



"/api/brands/{id}": {


  get: {

    tags:["Reference Data"],

    summary:"Get brand by ID",


    parameters:[

      {

        name:"id",

        in:"path",

        required:true,


        schema:{

          type:"integer"

        }

      }

    ],


    responses:{


      200:{

        description:"Brand found",


        content:{

          "application/json":{

            example:{

              id:1,

              name:"Samsung"

            }

          }

        }

      },


      404:{

        description:"Brand not found"

      }


    }


  },



  put:{


    tags:["Reference Data"],

    summary:"Update brand",



    parameters:[

      {

        name:"id",

        in:"path",

        required:true,

        schema:{

          type:"integer"

        }

      }

    ],



    requestBody:{


      required:true,


      content:{


        "application/json":{


          example:{


            name:"Updated Brand"


          }


        }


      }


    },



    responses:{


      200:{


        description:"Brand updated"


      },


      400:{


        description:"Validation failed"


      }


    }


  },




  delete:{


    tags:["Reference Data"],


    summary:"Delete brand",




    parameters:[


      {

        name:"id",


        in:"path",


        required:true,


        schema:{


          type:"integer"


        }


      }


    ],



    responses:{


      200:{


        description:"Brand deleted",


        content:{


          "application/json":{


            example:{


              message:"Brand deleted"


            }


          }


        }


      }


    }


  }


},

"/api/settings": {


get: {


tags:["Settings"],


summary:"Get system settings",


security:[
{
BearerAuth:[]
}
],



responses:{


200:{


description:"Settings retrieved",


content:{


"application/json":{


example:{


general:{


company_name:"ABC Supermarket",

company_email:"info@abc.com",

company_phone:"0912345678",

company_address:"Addis Ababa",

currency:"ETB",

timezone:"Africa/Addis_Ababa"


},


inventory:{


allow_negative_stock:false,


low_stock_limit:10


},


sales:{


tax_rate:15,


invoice_prefix:"INV"


}


}


}


}


}


}



},







put:{


tags:["Settings"],


summary:"Update settings",


security:[

{

BearerAuth:[]

}

],




requestBody:{


required:true,



content:{


"application/json":{


example:{


category:"general",



settings:{



company_name:"ABC Supermarket",


company_email:"info@abc.com",


company_phone:"0912345678",


company_address:"Addis Ababa",


currency:"ETB",


timezone:"Africa/Addis_Ababa"


}



}



}



}



},






responses:{



200:{



description:"Settings updated"


},



400:{



description:"Validation error"


},


401:{



description:"Unauthorized"


}



}



}



},


"/api/product-stock": {

  get: {

    tags: ["Inventory"],

    summary: "Get all product stock",

    responses: {

      200: {

        description: "Stock retrieved"

      }

    }

  },


  post: {

    tags: ["Inventory"],

    summary: "Create or update product stock",


    requestBody: {

      required: true,

      content: {

        "application/json": {

          example: {

            product_id: 1,

            branch_id: 1,

            quantity: 100

          }

        }

      }

    },


    responses: {

      201: {

        description: "Stock created or updated"

      }

    }

  }

},



"/api/product-stock/{id}": {


  get: {

    tags: ["Inventory"],

    summary: "Get stock by ID",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],


    responses: {


      200: {

        description: "Stock found"

      },


      404: {

        description: "Stock not found"

      }


    }

  },



  put: {

    tags: ["Inventory"],

    summary: "Update stock quantity",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],



    requestBody: {

      required: true,

      content: {

        "application/json": {

          example: {

            quantity: 150

          }

        }

      }

    },


    responses: {


      200: {

        description: "Stock updated"

      },


      404: {

        description: "Stock not found"

      }


    }

  },



  delete: {

    tags: ["Inventory"],

    summary: "Delete stock record",


    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],


    responses: {


      200: {

        description: "Stock deleted"

      },


      404: {

        description: "Stock not found"

      }


    }

  }


},
"/api/reports": {


get:{

tags:["Reports"],


summary:"Get ERP reports dashboard",


responses:{


200:{

description:"Reports retrieved",

content:{


"application/json":{


example:{


sales:{
transactions:100,
total_sales:50000
},


purchases:{
transactions:20,
total_purchase:20000
},


inventory:{
stock_records:300,
total_quantity:5000
},


profitLoss:{
profit:30000
}


}


}


}


}


}


}


},

"/api/taxes": {

  get: {

    tags:["Taxes"],

    summary:"Get all taxes",


    responses:{

      200:{

        description:"Taxes retrieved successfully",

        content:{

          "application/json":{

            example:[

              {

                id:1,

                name:"VAT",

                rate:15,

                is_active:true

              },

              {

                id:2,

                name:"Non VAT",

                rate:0,

                is_active:true

              }

            ]

          }

        }

      },


      500:{

        description:"Internal server error"

      }


    }

  },




  post:{


    tags:["Taxes"],


    summary:"Create tax",



    requestBody:{


      required:true,


      content:{


        "application/json":{


          example:{


            name:"VAT",

            rate:15,

            is_active:true


          }


        }


      }


    },



    responses:{


      201:{


        description:"Tax created successfully"


      },


      400:{


        description:"Validation error"


      },


      500:{


        description:"Internal server error"


      }


    }


  }


},







"/api/taxes/{id}":{


get:{


tags:["Taxes"],


summary:"Get tax by id",



parameters:[


{

name:"id",

in:"path",

required:true,

schema:{

type:"integer"

}

}


],



responses:{


200:{


description:"Tax found"


},


404:{


description:"Tax not found"


}


}


},







put:{


tags:["Taxes"],


summary:"Update tax",



parameters:[


{

name:"id",

in:"path",

required:true,

schema:{

type:"integer"

}

}


],



requestBody:{


required:true,


content:{


"application/json":{


example:{


name:"VAT",

rate:15,

is_active:true


}


}


}


},



responses:{


200:{


description:"Tax updated"


},


400:{


description:"Validation error"


}


}



},







delete:{


tags:["Taxes"],


summary:"Delete tax",



parameters:[


{

name:"id",

in:"path",

required:true,

schema:{

type:"integer"

}

}


],



responses:{


200:{


description:"Tax deleted"


},


404:{


description:"Tax not found"


}



}



}



},

"/api/notifications": {

  get: {

    tags: ["Notifications"],

    summary: "Get current user's notifications",

    security: [
      {
        BearerAuth: []
      }
    ],

    responses: {

      200: {

        description: "Notifications retrieved",

        content: {

          "application/json": {

            example: [

              {
                id: 15,
                user_id: 3,
                type: "SALE",
                title: "New Sale",
                message: "Sale #25 has been completed.",
                reference_id: 25,
                is_read: false,
                created_at: "2026-06-30T08:40:00Z"
              },

              {
                id: 16,
                user_id: 3,
                type: "LOW_STOCK",
                title: "Low Stock",
                message: "Milk is running low.",
                reference_id: 12,
                is_read: true,
                created_at: "2026-06-30T09:00:00Z"
              }

            ]

          }

        }

      }

    }

  }

},



"/api/notifications/{id}/read": {

  patch: {

    tags: ["Notifications"],

    summary: "Mark notification as read",

    security: [
      {
        BearerAuth: []
      }
    ],

    parameters: [

      {

        name: "id",

        in: "path",

        required: true,

        schema: {

          type: "integer"

        }

      }

    ],

    responses: {

      200: {

        description: "Notification marked as read",

        content: {

          "application/json": {

            example: {

              success: true,

              message: "Notification marked as read"

            }

          }

        }

      },

      404: {

        description: "Notification not found"

      }

    }

  }

},

"/api/revenue-targets/current": {

  get: {

    tags: ["Revenue Targets"],

    summary: "Get current revenue target KPI",

    security: [
      {
        BearerAuth: []
      }
    ],


    responses: {

      200: {

        description: "Current revenue target retrieved successfully",

        content: {

          "application/json": {

            example: {

              id: 1,

              target_name: "Monthly Sales Target",

              target_amount: 500000,

              current_revenue: 320000,

              achievement: 64,

              target_period: "Monthly",

              start_date: "2026-07-01",

              end_date: "2026-07-31"

            }

          }

        }

      },


      404: {

        description: "No active revenue target found"

      },


      500: {

        description: "Internal server error"

      }

    }

  }

},
"/api/revenue-targets": {


get: {

tags:["Revenue Targets"],

summary:"Get all revenue targets",

responses:{

200:{
description:"Revenue targets retrieved"
}

}

},



post:{

tags:["Revenue Targets"],

summary:"Create monthly revenue target",


requestBody:{

required:true,


content:{


"application/json":{


example:{


month:7,

year:2026,

target_amount:500000


}


}

}

},



responses:{


201:{
description:"Revenue target created"
},


400:{
description:"Target already exists"
}


}


},





put:{


tags:["Revenue Targets"],

summary:"Update revenue target",


requestBody:{


required:true,


content:{


"application/json":{


example:{


id:1,

target_amount:600000


}


}


}


},


responses:{


200:{
description:"Revenue target updated"
}


}



}


},

"/api/profile": {
  get: {
    tags: ["Users"],
    summary: "Get logged-in user profile",
    security: [{ BearerAuth: [] }],

    responses: {
      200: {
        description: "Profile retrieved successfully",
        content: {
          "application/json": {
            example: {
              id: 1,
              full_name: "John Doe",
              email: "john@erp.com",
              role: "Admin",
              avatar: "/uploads/profiles/1.jpg"
            }
          }
        }
      },

      401: {
        description: "Unauthorized"
      }
    }
  }
},

"/api/profile": {
  put: {
    tags: ["Users"],
    summary: "Update user profile",
    security: [{ BearerAuth: [] }],

    requestBody: {
      required: true,
      content: {
        "application/json": {
          example: {
            full_name: "John Updated",
            email: "john@erp.com"
          }
        }
      }
    },

    responses: {
      200: {
        description: "Profile updated successfully",
        content: {
          "application/json": {
            example: {
              success: true,
              message: "Profile updated"
            }
          }
        }
      },

      400: {
        description: "Invalid input"
      }
    }
  }
},

"/api/profile/upload-photo": {
  post: {
    tags: ["Users"],
    summary: "Upload profile picture",
    security: [{ BearerAuth: [] }],

    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              image: {
                type: "string",
                format: "binary"
              }
            }
          }
        }
      }
    },

    responses: {
      200: {
        description: "Profile image uploaded",
        content: {
          "application/json": {
            example: {
              success: true,
              avatar: "/uploads/profiles/1.png"
            }
          }
        }
      },

      400: {
        description: "Upload failed"
      }
    }
  }
}

  },
};


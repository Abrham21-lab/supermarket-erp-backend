import {NextResponse} from "next/server";


export function success(data,message="Success"){

return NextResponse.json({

success:true,

message,

data

});

}



export function error(message,status=500){

return NextResponse.json({

success:false,

message

},
{
status
});

}
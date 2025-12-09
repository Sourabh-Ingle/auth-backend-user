import { ApiResponse } from "../utils/app-response.js";
import { asyncHandle } from "../utils/async-handler.js";


// const healthCheck = async (req, res, next) => {
//     try {
//         res
//             .status(200)
//             .json(new ApiResponse(200,{message:"Server is running !!!"})
//         )
//         next();
        
//     } catch (error) {
        
//     }
// }

const healthCheck = asyncHandle((req, res) => {
    res
        .status(200)
        .json(new ApiResponse(200, { message: "Server is runnig !!!" }));
})

export { healthCheck }
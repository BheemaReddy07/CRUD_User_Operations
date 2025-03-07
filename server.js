import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'


//app configuration

const app  = express()
const PORT = process.env.PORT || 4000

connectDB()



//middlewares
app.use(express.json())
app.use(cors())


//api endpoints
app.use("/api/user",userRouter)



app.get('/',(req,res)=>{
    res.send("Your API is working")
})


app.listen(PORT,()=>console.log("Server Started on",PORT))
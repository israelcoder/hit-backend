import { registerUser, loginUser } from "../services/userService.js";
import { verifyEmailToken } from "../services/userService.js";
import { generateToken } from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import {db} from '../config/database.js';

export let pendingUsers = {}

export async function userRegister(req, reply) {
    const{name, email, password, role} = req.body
    if(!name|| !email || !password || !role){
        return reply.status(400).send({error:'Todos os campos são obrigatórios!'})
    }

    const[existing] = await db.query(`SELECT * FROM users WHERE email = ?`,[email])
    if(existing.length > 0){
        return reply.status(400).send({error:'email já cadastrado.'})
    }
    try {
        const verificationToken = generateToken(8)

        //salva os dados temporariamente
        pendingUsers[email] = {name, email, password, role, verificationToken}

        await sendEmail(
            email,
            "Codigo de verificação - HIT",
            `Seu código de verificação é :${verificationToken}`
        )
        return reply.status(200).send({message: "Token enviado por email."})
    }catch(error) {
        console.error("Erro no registro", error)
        return reply.status(400).send({error: error.message})
    }
}
    
export async function userLogin(req, reply){
    try {
        const {email,password} = req.body
        const data = await loginUser(email, password)
        return reply.send(data)
    } catch(error){
        return reply.status(400).send({error: error.message})
    }
}
    
export async function confirmEmail(req, reply){
    const {email, token} = req.body

    if(!email || !token){
        return reply.status(400).send({error:'Email e token são obrigatórios.'})
    }

    try{
        const result = await verifyEmailToken(email, token)
        return reply.send(result)
    }
    catch (error){
        return reply.status(400).send({error: error.message})
    }
}

import { z } from "zod"



export const SignupValidation = z.object({
    name: z.string().min(2, {message : 'Too Short'}),
    username: z.string().min(2, {message: 'Too short '}).max(50, {message: 'Too big'}),
    email: z.string().email(),
    password: z.string().min(8, {message: 'must contains atleast 8 chars'})
  })

  






'use server'

import { object, z } from "zod";
import db from "@/db/db";
import fs from "fs/promises"
import { redirect } from "next/navigation";

const fileSchema = z.instanceof(File, { message: "Required!!" });
const imageSchema = fileSchema.refine(
  (file) => file.size === 0 || file.type.startsWith("image/")
);

const formSchema = z.object({
  name: z.string().min(1),
  desc: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
  file: fileSchema.refine((file) => file.size > 0, "Required!"),
  image: imageSchema.refine((file) => file.size > 0, "Required!"),
});


export async function AddProduct(prevState: unknown, formdata: FormData){ 
    const result = formSchema.safeParse(Object.fromEntries(formdata.entries()))
    if(result.success === false){
        return result.error.formErrors.fieldErrors
    }

    const data = result.data

    await fs.mkdir("products", {recursive:true})
    const filePath = `/products/${crypto.randomUUID()}-${data.file.name}`
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()))

    await fs.mkdir("public/products", {recursive:true})
    const imagePath = `products/${crypto.randomUUID()}-${data.image.name}`
    await fs.writeFile(`public${imagePath}`, Buffer.from(await data.image.arrayBuffer()))

    await db.product.create({data : {
        isAvailableForPurchase: false,
        name: data.name,
        description: data.desc,
        priceInCents: data.priceInCents,
        filePath,
        imagePath
    }})

    redirect("/admin/products")
}
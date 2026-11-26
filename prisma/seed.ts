import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(){
  const categories = new Map<string, string>();
  for(const name of ["Textile","Pottery","Painting"]){
    const category=await prisma.handicraftCategory.upsert({where:{name},update:{},create:{name}});
    categories.set(name, category.id);
  }
  const crafts=[
    {slug:"pashmina",name:"Kashmiri Pashmina",state:"Jammu & Kashmir",region:"Kashmir Valley",category:"Textile",description:"Fine handwoven woolen textile traditionally associated with the Kashmir Valley."},
    {slug:"banarasi-saree",name:"Banarasi Saree",state:"Uttar Pradesh",region:"Varanasi",category:"Textile",description:"A celebrated silk saree known for brocade, zari work and complex woven motifs."},
    {slug:"phulkari",name:"Phulkari",state:"Punjab",region:"Punjab region",category:"Textile",description:"Vibrant embroidered textile with counted-thread geometric and floral motifs."},
    {slug:"blue-pottery",name:"Jaipur Blue Pottery",state:"Rajasthan",region:"Jaipur",category:"Pottery",description:"Distinctive glazed ceramic ware characterized by cobalt blue and white decoration."},
    {slug:"madhubani",name:"Madhubani Painting",state:"Bihar",region:"Madhubani",category:"Painting",description:"Fine-line folk painting with symbolic, nature-inspired and geometric compositions."}
  ];
  for(const {category,...craft} of crafts){
    const handicraft=await prisma.handicraft.upsert({
      where:{slug:craft.slug},
      update:{name:craft.name,state:craft.state,region:craft.region,description:craft.description,categoryId:categories.get(category)!},
      create:{...craft,categoryId:categories.get(category)!},
    });
    await prisma.gIInformation.upsert({
      where:{handicraftId:handicraft.id},
      update:{status:"REGISTERED",origin:`${craft.region}, ${craft.state}`,history:craft.description},
      create:{handicraftId:handicraft.id,status:"REGISTERED",origin:`${craft.region}, ${craft.state}`,history:craft.description},
    });
  }
}

main().finally(()=>prisma.$disconnect());

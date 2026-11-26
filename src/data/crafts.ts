export type Craft = {
  slug: string;
  name: string;
  category: string;
  state: string;
  region: string;
  giStatus: "GI registered" | "GI status unverified";
  image: string;
  description: string;
  techniques: string[];
  materials: string[];
};

export const crafts: Craft[] = [
  { slug:"pashmina", name:"Kashmiri Pashmina", category:"Textile", state:"Jammu & Kashmir", region:"Kashmir Valley", giStatus:"GI registered", image:"https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=85", description:"Fine handwoven woolen textile traditionally associated with the Kashmir Valley.", techniques:["Hand spinning","Sozni embroidery","Twill weaving"], materials:["Pashm wool","Natural or certified dyes"] },
  { slug:"banarasi-saree", name:"Banarasi Saree", category:"Textile", state:"Uttar Pradesh", region:"Varanasi", giStatus:"GI registered", image:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85", description:"A celebrated silk saree known for brocade, zari work and complex woven motifs.", techniques:["Hand weaving","Jangla brocade","Zari inlay"], materials:["Silk","Metallic zari"] },
  { slug:"phulkari", name:"Phulkari", category:"Textile", state:"Punjab", region:"Punjab region", giStatus:"GI registered", image:"https://images.unsplash.com/photo-1601221990723-9a3a8a891f01?auto=format&fit=crop&w=900&q=85", description:"Vibrant embroidered textile with counted-thread geometric and floral motifs.", techniques:["Darning stitch","Counted-thread embroidery"], materials:["Cotton base cloth","Silk floss"] },
  { slug:"blue-pottery", name:"Jaipur Blue Pottery", category:"Pottery", state:"Rajasthan", region:"Jaipur", giStatus:"GI registered", image:"https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85", description:"Distinctive glazed ceramic ware characterized by cobalt blue and white decoration.", techniques:["Hand painting","Glazing","Kiln firing"], materials:["Quartz","Glass","Multani mitti"] },
  { slug:"madhubani", name:"Madhubani Painting", category:"Painting", state:"Bihar", region:"Madhubani", giStatus:"GI registered", image:"https://images.unsplash.com/photo-1577083552431-6e5fd01988a5?auto=format&fit=crop&w=900&q=85", description:"Fine-line folk painting with symbolic, nature-inspired and geometric compositions.", techniques:["Natural pigment painting","Line work","Pattern filling"], materials:["Pigments","Paper or cloth"] },
];

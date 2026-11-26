"use client";
import { useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, RotateCcw, Sparkles, Upload } from "lucide-react";
import { Nav } from "@/components/Nav";
import { AnalysisCard, AnalysisLoadingCard } from "@/components/AnalysisCard";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/analysis-result";

export default function ScanPage(){
  const inputRef=useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState("");
  const [busy,setBusy]=useState(false);
  const [drag,setDrag]=useState(false);
  const [error,setError]=useState("");
  const [loginNeeded,setLoginNeeded]=useState(false);
  const [result,setResult]=useState<AnalysisResult|null>(null);

  async function compressForVercel(source:File) {
    const bitmap = await createImageBitmap(source);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("This browser could not prepare the image for upload.");
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    for (const quality of [0.86, 0.74, 0.62]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= 4 * 1024 * 1024) {
        return new File([blob], `${source.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
      }
    }
    throw new Error("This image is too large to upload safely. Please choose a smaller or lower-resolution image.");
  }

  async function choose(f?:File){
    setError(""); setLoginNeeded(false); setResult(null);
    if(!f)return;
    if(!["image/jpeg","image/png","image/webp"].includes(f.type)){setError("Choose a JPG, PNG or WEBP image.");return;}
    if(f.size>10*1024*1024){setError("Image must be smaller than 10 MB.");return;}
    try {
      const prepared = await compressForVercel(f);
      setFile(prepared); setPreview(URL.createObjectURL(prepared));
    } catch (e:unknown) {
      setError(e instanceof Error ? e.message : "Could not prepare this image.");
    }
  }
  async function analyze(){
    if(!file)return;
    setBusy(true); setError("");
    try{
      const form=new FormData(); form.append("image",file);
      const res=await fetch("/api/analyze",{method:"POST",body:form});
      const data=await res.json();
      if(!res.ok) {
        setLoginNeeded(res.status===401);
        throw new Error(data.error || "Analysis failed");
      }
      setResult(data);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Analysis failed")}
    finally{setBusy(false)}
  }
  function reset(){setFile(null);setPreview("");setResult(null);setError("");if(inputRef.current)inputRef.current.value=""}

  return <div className="shell"><Nav/><main className="container">
    <header className="page-head"><span className="eyebrow">Visual check</span><h1>Analyze a handicraft</h1><p className="section-lead">Use a clear image of the full object or a characteristic detail.</p></header>
    <div className="scanner-layout"><div className="panel">
      <div className={`dropzone ${drag?"dragging":""}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files[0])}}>
        {preview?<img className="preview" src={preview} alt="Uploaded craft preview"/>:<div className="dropzone-content"><div className="dropzone-icon"><ImagePlus/></div><h3 className="dropzone-title">Drop an image here</h3><p className="dropzone-copy">JPG, PNG or WEBP · maximum 10 MB</p><button className="btn btn-primary" onClick={()=>inputRef.current?.click()}><Upload size={17}/> Choose image</button></div>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={e=>choose(e.target.files?.[0])}/>
      {error&&<div role="alert" className="scan-error">{error} {loginNeeded&&<Link href="/sign-in" style={{fontWeight:800,textDecoration:"underline"}}>Sign in</Link>}</div>}
      <div className="scan-actions">{file&&<><button className="btn btn-primary" onClick={analyze} disabled={busy}>{busy?<LoaderCircle size={18} className="animate-spin"/>:<Camera size={18}/>} {busy?"Analyzing...":"Analyze handicraft"}</button><button className="btn btn-outline" onClick={reset}><RotateCcw size={16}/> Remove</button></>}</div>
    </div>
    <aside className={`panel scanner-insight ${busy?"is-thinking":""}`}>{busy?<AnalysisLoadingCard/>:result?<AnalysisCard result={result}/>:<div className="scanner-intro"><div className="intro-orbit"><ImagePlus size={22}/><span/></div><span className="eyebrow">Visual intelligence</span><h3>What the image can tell us</h3><p>Karigar identifies visible object categories and characteristics. Category identification is separate from verifying authenticity, material or provenance.</p><div className="intro-divider"/><span className="intro-hint"><Sparkles size={15}/> A little detail can reveal a lot.</span></div>}</aside></div>
  </main></div>;
}

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { BadgeCheck, CircleHelp, Flower2, Gem, Sparkles } from "lucide-react";

type AnalysisResult = {
  status: string;
  category: string;
  classificationConfidence: number | null;
  visualSimilarity: number | null;
  matchingIndicators: string[];
  uncertainIndicators: string[];
  notice: string;
  verificationStatus: string;
  explanation: string;
};

const stages = ["Reading the image", "Finding visible details", "Preparing your craft notes"];

export function AnalysisLoadingCard() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setStage(value => (value + 1) % stages.length), 2100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="analysis-loading">
      <div className="loading-art" aria-hidden="true">
        <span className="orbit orbit-one"/><span className="orbit orbit-two"/>
        <span className="loading-loom"/>
        <span className="loading-core"><Sparkles size={25}/></span>
        <Flower2 className="loading-flower" size={22}/>
        <span className="firefly firefly-one"/><span className="firefly firefly-two"/><span className="firefly firefly-three"/>
      </div>
      <span className="eyebrow">A closer look</span>
      <h3>{stages[stage]}<span className="loading-ellipsis">...</span></h3>
      <p>Noticing patterns and shapes. This can take a few seconds.</p>
      <div className="loading-track"><span/></div>
    </div>
  );
}

export function AnalysisCard({ result }: { result: AnalysisResult }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setRevealed(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const identified = result.status === "Category identified";

  return (
    <div className={`analysis-result ${revealed ? "is-revealed" : ""}`}>
      <div className="result-orb" aria-hidden="true"><span><Gem size={24}/></span><i/><i/><i/></div>
      <span className={`result-status ${identified ? "status-found" : "status-unknown"}`}>
        {identified ? <BadgeCheck size={15}/> : <CircleHelp size={15}/>}
        {result.status}
      </span>
      <p className="result-kicker">Karigar noticed</p>
      <h2 className="result-category">{result.category}</h2>
      {result.classificationConfidence !== null && (
        <div className="confidence-line">
          <div className="confidence-copy"><span>AI-estimated category confidence</span><strong>{result.classificationConfidence}%</strong></div>
          <div className="confidence-meter"><span style={{ width: `${result.classificationConfidence}%` }}/></div>
          <small>Estimate only · not independently calibrated</small>
        </div>
      )}
      <div className="verification-note"><Sparkles size={15}/><span>{result.verificationStatus}</span></div>
      <p className="result-explanation">{result.explanation}</p>
      {result.matchingIndicators?.length > 0 && (
        <div className="insight-block">
          <h3><span className="insight-icon">✳</span> Visible clues</h3>
          {result.matchingIndicators.map((item, index) => <p className="insight-row" style={{"--row-index": index} as CSSProperties} key={item}><span/> {item}</p>)}
        </div>
      )}
      {result.uncertainIndicators?.length > 0 && (
        <div className="insight-block uncertain-block">
          <h3><CircleHelp size={15}/> What a photo can&apos;t tell us</h3>
          {result.uncertainIndicators.map(item => <p className="uncertain-row" key={item}>{item}</p>)}
        </div>
      )}
      <div className="result-footnote">Visual learning, not an authenticity certificate.</div>
      <button className="btn btn-outline report-button no-print" onClick={() => {
        const previousTitle = document.title;
        document.title = `Karigar craft report - ${result.category}`;
        window.addEventListener("afterprint", () => { document.title = previousTitle; }, { once: true });
        window.print();
      }}>Download report</button>
    </div>
  );
}

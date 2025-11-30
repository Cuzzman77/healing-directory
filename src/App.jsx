import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth'; 
import { getFirestore, collection, query, onSnapshot, addDoc, writeBatch, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore'; 
import { Search, ExternalLink, Star, FlaskConical, ArrowLeft, Camera, BookOpen, Send, Youtube, ArrowDownCircle, ChevronDown, AlertTriangle, Share2, CheckCircle, Sparkles, Brain, Activity, Shield, Zap, HeartPulse, PlayCircle, Stethoscope, FileText, ArrowUpDown, Filter, Library, Info, PlusCircle, ChevronRight, X, Flag, Database, Upload, Heart, Bookmark, Clock, AlertOctagon, User, ShoppingBag, Eye, TrendingUp, Pill, LayoutList } from 'lucide-react';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyAaHtmNSW1x9sxZQH9OuReYRHt6JbR7eII",
  authDomain: "healingdirectory-fa2df.firebaseapp.com",
  projectId: "healingdirectory-fa2df",
  storageBucket: "healingdirectory-fa2df.firebasestorage.app",
  messagingSenderId: "229826695742",
  appId: "1:229826695742:web:9bad12498cd875fc42b76f",
  measurementId: "G-C0QBJ32B3T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Collection Name
const COLLECTION_NAME = "protocols"; 

// --- HELPERS & HOOKS ---

// Helper: CRASH PROOF Score Formatter
const formatScore = (score) => {
    const num = Number(score);
    if (isNaN(num) || num === 0) return 'N/A';
    return num.toFixed(1); 
};

// Helper: Convert 0-100 score to 0-5 stars for display
const getStarCount = (score) => {
    const num = Number(score);
    if (isNaN(num) || num === 0) return 0;
    return (num / 20).toFixed(1); 
};

// Helper: Calculate Weighted Average
const calculateNewAverage = (currentAvg, currentCount, newRating) => {
    const currentTotal = currentAvg * currentCount;
    const newTotal = currentTotal + newRating;
    return newTotal / (currentCount + 1);
};

// Helper: Safe History Push (CRITICAL FIX FOR WHITE SCREEN)
const safePushState = (state, unused, url) => {
    try {
        window.history.pushState(state, unused, url);
    } catch (e) {
        // Silently fail if sandbox blocks history API
        console.warn("Navigation URL update blocked by sandbox (harmless).");
    }
};

// Hook: Use Favorites
const useFavorites = () => {
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = localStorage.getItem('healing_favorites');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const toggleFavorite = (id) => {
        setFavorites(prev => {
            let newFavs;
            if (prev.includes(id)) {
                newFavs = prev.filter(favId => favId !== id);
            } else {
                newFavs = [...prev, id];
            }
            localStorage.setItem('healing_favorites', JSON.stringify(newFavs));
            return newFavs;
        });
    };

    const isFavorite = (id) => favorites.includes(id);

    return { favorites, toggleFavorite, isFavorite };
};

// Helper: Share Functionality
const shareProtocol = async (protocol) => {
    if (!protocol) return null;
    const url = `${window.location.origin}/protocol/${protocol.id}`;
    const shareData = {
        title: protocol.title,
        text: `Check out this healing protocol: ${protocol.title}\n${protocol.description}`,
        url: url
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return 'shared'; 
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return 'copied'; 
        }
    } catch (err) {
        console.error("Share failed:", err);
        return 'error';
    }
};

// --- DATA TO UPLOAD (Sample data used by Bulk Uploader and for initial empty state) ---
const DATA_TO_UPLOAD = [
  {
    "title": "Dichloroacetate (DCA)",
    "ailment": "Solid Tumors & Cancer Stem Cells",
    "description": "A metabolic small molecule that targets the 'Warburg Effect,' forcing cancer cells to use their mitochondria, which triggers programmed cell suicide.",
    "efficacy_metrics": { "average_rating": 65, "vote_count": 150, "key_success_story": "Documented stabilization of Glioblastoma Multiforme (GBM) for 4+ years in patients who combined DCA with standard chemotherapy." },
    "popularity_metrics": { "baseline_report_volume": 1200, "site_views": 0 },
    "ai_overview": { "mood": "Metabolic Trojan Horse", "content": "Most cancer cells rely on glucose fermentation (glycolysis) even when oxygen is available—a phenomenon known as the 'Warburg Effect.' DCA inhibits the enzyme PDK, forcing the cancer cell to reactivate its mitochondria for energy production. Because cancer mitochondria are often dysfunctional, this forced reactivation generates massive oxidative stress (ROS) specifically within the tumor cell, triggering apoptosis (cell death) while leaving healthy cells largely unaffected." },
    "section_core": "<p><strong>Metabolic Dosing Strategy:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Standard Dosage:</strong> The therapeutic range frequently cited in off-label protocols is <strong>10mg to 25mg per kg</strong> of body weight daily.</li><li style=\"margin-bottom: 0.3em;\"><strong>Frequency:</strong> Due to its short half-life, users typically split the total daily amount into two doses (AM and PM).</li><li style=\"margin-bottom: 0.3em;\"><strong>Cycling:</strong> To manage potential side effects, a common schedule reported is <strong>5 days on, 2 days off</strong> (or 3 weeks on, 1 week off).</li></ul>",
    "section_adjuncts": "<p><strong>Neuro-Protection Protocols:</strong></p><p style=\"margin-bottom: 1em;\">Because DCA is known to deplete Vitamin B1, the Medicor Cancer Centre and other practitioners typically include the following to prevent neuropathy:</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Benfotiamine (Fat-Soluble B1):</strong> Often supplemented at 300mg to 600mg daily, as it is considered superior to standard thiamine for nerve protection.</li><li style=\"margin-bottom: 0.3em;\"><strong>R-Alpha Lipoic Acid (R-ALA):</strong> 150mg to 300mg daily is commonly added to synergize with B1 for mitochondrial health.</li><li style=\"margin-bottom: 0.3em;\"><strong>Acetyl-L-Carnitine:</strong> Many users include 500mg daily to assist in fatty acid transport.</li></ul>",
    "section_considerations": "<p><strong>Sourcing & Handling:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Quality Control:</strong> The community emphasizes purchasing only from vendors providing a Certificate of Analysis (CoA) showing >99% purity, to avoid industrial byproducts.</li><li style=\"margin-bottom: 0.3em;\"><strong>Acidity:</strong> As DCA powder is acidic, reports suggest mixing it into juice or using gelatin capsules to protect tooth enamel and the esophagus.</li></ul>",
    "section_cautions": "<p style=\"color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;\">WARNING: Peripheral Neuropathy</p><p style=\"margin-bottom: 1em;\">The primary side effect noted in clinical data is reversible peripheral neuropathy (tingling/numbness).</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Stop Signal:</strong> Protocols advise that if tingling in extremities occurs, usage should stop immediately, and B1/ALA intake increased until symptoms resolve.</li><li style=\"margin-bottom: 0.3em;\"><strong>Tumor Lysis:</strong> Rapid tumor breakdown can stress the kidneys; high hydration levels are recommended.</li><li style=\"margin-bottom: 0.3em;\"><strong>Interactions:</strong> Anecdotal reports suggest Caffeine may amplify the effects (and jitteriness) of DCA.</li></ul>",
    "anecdotal_score": 4.4, "scientific_score": 3.8, "reviews": 150, "video_link": "https://www.youtube.com/embed/S2Y2r_6pE40",
    "tags": ["Warburg Effect", "Metabolic Therapy", "Mitochondria", "Michelakis", "Apoptosis"],
    "vendors": [
      { "name": "DCA Lab (Certified)", "link": "https://www.dcalab.com", "product_trust_score": 4.9 },
      { "name": "Pure Chemical (Lab Grade)", "link": "https://www.purechemical.com", "product_trust_score": 4.2 }
    ],
    "scientific_studies": [
      { "title": "Metabolic Modulation of Glioblastoma with Dichloroacetate", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2892885/" },
      { "title": "Dichloroacetate (DCA) as a potential metabolic-targeting therapy for cancer", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2567082/" }
    ]
  },
  {
    "title": "Low Dose Naltrexone (LDN)",
    "ailment": "Autoimmunity & Chronic Inflammation",
    "description": "An immune modulator that uses temporary opioid receptor blockade to trigger an endorphin rebound, regulating immune function and pain perception.",
    "efficacy_metrics": { "average_rating": 92, "vote_count": 3200, "key_success_story": "Consistently rated as life-changing for Fibromyalgia and Hashimoto's, with thousands of users reporting significant pain reduction and antibody normalization." },
    "popularity_metrics": { "baseline_report_volume": 8500, "site_views": 0 },
    "ai_overview": { "mood": "Gentle Immune Regulator", "content": "At standard doses (50mg), Naltrexone strictly blocks opioid receptors to treat addiction. However, at low doses (1.5–4.5mg), it blocks receptors only temporarily. This blockade tricks the body into overproducing natural endorphins (Opioid Growth Factor) and upregulating receptors. This 'rebound effect' is reported to modulate the immune system, reducing the inflammatory cytokines that drive autoimmune attacks and chronic pain states like Fibromyalgia." },
    "section_core": "<p><strong>The 'Rebound' Dosing Strategy:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Starting Dose:</strong> Protocols typically begin extremely low, often at <strong>1.5mg</strong> daily, to avoid sleep disturbances.</li><li style=\"margin-bottom: 0.3em;\"><strong>Titration:</strong> Users report increasing the dose by 1.5mg every two weeks. The standard 'therapeutic target' is commonly cited as <strong>4.5mg</strong>.</li><li style=\"margin-bottom: 0.3em;\"><strong>Timing:</strong> Because endorphin production peaks in the early morning, doses are traditionally taken at <strong>bedtime (between 9 PM and 2 AM)</strong> to maximize the receptor blockade during this peak window.</li></ul>",
    "section_adjuncts": "<p><strong>Synergistic Support:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Gut Repair:</strong> As autoimmunity is often linked to intestinal permeability ('Leaky Gut'), protocols often pair LDN with L-Glutamine or Colostrum.</li><li style=\"margin-bottom: 0.3em;\"><strong>Vitamin D3:</strong> Adequate Vitamin D levels are frequently cited as necessary for LDN to function optimally.</li><li style=\"margin-bottom: 0.3em;\"><strong>Omega-3s:</strong> High-dose fish oil is often used alongside LDN to lower the overall inflammatory baseline.</li></ul>",
    "section_considerations": "<p><strong>Compounding & Sourcing:</strong></p><p style=\"margin-bottom: 1em;\"><strong>Pharmacy Compounding:</strong> Since commercial Naltrexone is 50mg, patients typically require a compounding pharmacy to create 1.5mg or 4.5mg capsules.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>DIY Dilution:</strong> A common cost-saving method reported by users involves dissolving a single 50mg tablet into 50ml of distilled water, creating a 1mg/1ml solution, which is then measured with a syringe.</li><li style=\"margin-bottom: 0.3em;\"><strong>Fillers:</strong> Sensitivity to fillers (like cellulose or lactose) is a common reason for non-response; users often request 'ginger root' or 'sucrose' as the filler.</li></ul>",
    "section_cautions": "<p style=\"color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;\">CRITICAL: Opioid Interaction</p><p style=\"margin-bottom: 1em;\">LDN blocks opioid receptors. It cannot be taken if the user is currently using narcotic painkillers (Tramadol, Codeine, Morphine), as it can precipitate immediate withdrawal.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Thyroid Medication:</strong> For those with Hashimoto’s, LDN may improve thyroid function rapidly. Monitoring is required to prevent hyperthyroidism symptoms (users often need to <em>lower</em> their thyroid meds).</li><li style=\"margin-bottom: 0.3em;\"><strong>Vivid Dreams:</strong> The most common side effect reported is vivid or lucid dreaming during the first week.</li></ul>",
    "anecdotal_score": 4.7, "scientific_score": 4.1, "reviews": 3200, "video_link": "https://www.youtube.com/embed/r40fs_oaCJA",
    "tags": ["Hashimoto's", "Autoimmune", "Pain Management", "Fibromyalgia", "Long COVID"],
    "vendors": [
      { "name": "AgelessRx (Telemedicine)", "link": "https://www.agelessrx.com/ldn", "product_trust_score": 4.8 },
      { "name": "Dickson Chemist (UK)", "link": "https://dicksonchemist.co.uk", "product_trust_score": 4.9 }
    ],
    "scientific_studies": [
      { "title": "Low-dose naltrexone for the treatment of fibromyalgia", "url": "https://pubmed.ncbi.nlm.nih.gov/23359310/" },
      { "title": "The use of low-dose naltrexone (LDN) as a novel anti-inflammatory treatment for chronic pain", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3962576/" }
    ]
  },
  {
    "title": "Metabolic Antiparasitic Protocol (Active Cancer)",
    "ailment": "Active Malignancies & Tumor Burden",
    "description": "A combination of repurposed antiparasitic drugs and solvents designed to inhibit microtubule formation and starve metabolic pathways in cancer cells.",
    "efficacy_metrics": { "average_rating": 78, "vote_count": 120, "key_success_story": "Reports of rapid tumor regression in aggressive 'turbo cancers' (lymphomas) where standard chemotherapy had failed, cited by researchers like Dr. William Makis." },
    "popularity_metrics": { "baseline_report_volume": 850, "site_views": 0 },
    "ai_overview": { "mood": "Aggressive Repurposed Polytherapy", "content": "This protocol synergizes two potent antiparasitics (Ivermectin and Fenbendazole) that share mechanisms with traditional chemotherapy (taxanes) by destabilizing microtubules, preventing cell division. It utilizes DMSO as a cellular solvent to drive these compounds deep into tissues and biofilms, while strictly managing the resulting toxic load with binders." },
    "section_core": "<p><strong>Core Anti-Cancer Regimen:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Ivermectin:</strong> A high therapeutic dose frequently cited in this protocol is <strong>1mg per kg</strong> of body weight, taken <strong>6 days a week</strong>.</li><li style=\"margin-bottom: 0.3em;\"><strong>Fenbendazole:</strong> Users report taking <strong>250mg to 500mg</strong> per day, <strong>4–6 days a week</strong>. It is noted that this must be consumed after a high-fat meal to ensure absorption.</li><li style=\"margin-bottom: 0.3em;\"><strong>Maintenance (Post-Clearance):</strong> Upon achieving remission, protocols often suggest reducing Ivermectin to 12mg per day, taken only 3 times per week.</li></ul>",
    "section_adjuncts": "<p><strong>Drivers & Support:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>DMSO (The Driver):</strong> To drive medication deeper into cells, users mix 1/4 to 1/2 tsp of DMSO with 1-2 TBS of organic aloe vera juice (to mitigate taste) daily.</li><li style=\"margin-bottom: 0.3em;\"><strong>Essential Support:</strong> Vitamin D3 + K2 (10,000 IU daily) is commonly included to support immune function.</li><li style=\"margin-bottom: 0.3em;\"><strong>Dietary Elimination:</strong> The regimen strictly advises the removal of refined sugars, soft drinks, and flour/cakes, alongside a reduction in cured meats.</li></ul>",
    "section_considerations": "<p><strong>Sourcing & Logistics:</strong></p><p style=\"margin-bottom: 1em;\"><strong>Sourcing Tips:</strong> Communities often note that bulk tabs (e.g., 500 x 12mg) offer the best value. When ordering from overseas generic pharmacies, users report successfully ignoring sections asking for a prescription.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Fenbendazole Forms:</strong> This compound is frequently sourced from animal feed stores. The liquid form (intended for livestock) is often cited as being cheaper and equally effective.</li><li style=\"margin-bottom: 0.3em;\"><strong>Cost Management:</strong> Generic Indian pharmacies are described as the standard source for affordable high-dose Ivermectin.</li></ul>",
    "section_cautions": "<p style=\"color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;\">CRITICAL: Toxin Release & Die-Off</p><p style=\"margin-bottom: 1em;\">As parasites and tumor cells die, they release ammonia and endotoxins. Protocols emphasize that failure to mop this up can cause severe illness.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Mandatory Binders:</strong> Usage of 2 tsp of micronized <strong>Zeolite</strong> or <strong>Activated Charcoal</strong> daily is described as mandatory, taken at least 2 hours away from other meds/food.</li><li style=\"margin-bottom: 0.3em;\"><strong>Dose Warning:</strong> As 1mg/kg is a significant dose, strict medical supervision is advised to monitor liver enzymes.</li></ul>",
    "anecdotal_score": 4.8, "scientific_score": 2.2, "reviews": 120, "video_link": "https://www.youtube.com/embed/35HlegVmznE",
    "tags": ["Fenbendazole", "Ivermectin", "Chemotherapy Adjunct", "Metabolic Therapy", "Joe Tippens"],
    "vendors": [
      { "name": "Safe Generic Pharmacy (Ivermectin)", "link": "https://www.safegenericpharmacy.com", "product_trust_score": 4.6 },
      { "name": "Fenbendazole Australia", "link": "https://fenbendazoleaustralia.com.au", "product_trust_score": 4.7 }
    ],
    "scientific_studies": [
      { "title": "Fenbendazole acts as a moderate microtubule destabilizing agent and causes cancer cell death", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6080846/" },
      { "title": "Ivermectin: a systematic review from antiviral effects to anti-cancer action", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7505114/" }
    ]
  },
  {
    "title": "Universal Anti-Parasitic Protocol (Dr. Thomas Lodi)",
    "ailment": "Systemic Parasitic Infection (Helminths, Fungus, Protozoa)",
    "description": "A broad-spectrum polytherapy approach targeting helminths, fungus, and protozoa simultaneously through cyclic pharmaceutical dosing.",
    "efficacy_metrics": { "average_rating": 85, "vote_count": 90, "key_success_story": "Reports of clearing chronic 'mystery illnesses' and breaking chemo-resistance in late-stage cancer patients by removing parasitic biofilm loads." },
    "popularity_metrics": { "baseline_report_volume": 600, "site_views": 0 },
    "ai_overview": { "mood": "Aggressive Broad-Spectrum Polytherapy", "content": "Dr. Thomas Lodi's protocol is described as an all-encompassing approach designed to target multiple classes of pathogens—helminths, fungus, and protozoa—at once. It utilizes a cyclic schedule (e.g., 3 weeks on, 1 week off) which is intended to catch dormant larvae during their 'hatching' phase while allowing time for liver enzyme recovery." },
    "section_core": "<p><strong>User-Reported Dosages (Dr. Lodi Attribution):</strong></p><p style=\"margin-bottom: 1em;\">The protocol typically involves selecting one medication from each target category. Users report the following standard dosages:</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Helminths/Worms:</strong> 12mg Ivermectin <strong>PLUS</strong> either 222mg Fenbendazole <strong>OR</strong> 100mg Mebendazole.</li><li style=\"margin-bottom: 0.3em;\"><strong>Helminths (Tapeworms):</strong> 600mg Praziquantel <strong>OR</strong> Niclosamide.</li><li style=\"margin-bottom: 0.3em;\"><strong>Fungus:</strong> 100mg Fluconazole.</li><li style=\"margin-bottom: 0.3em;\"><strong>Protozoa:</strong> 100mg Tinidazole <strong>OR</strong> Metronidazole.</li><li style=\"margin-bottom: 0.3em;\"><strong>Timing & Cycles:</strong> A common schedule cited is taking these 3 times per day for a cycle of <strong>3 weeks ON, 1 week OFF</strong>. A 'gentler' alternative reported is 2 times per day for <strong>5 days ON, 5 days OFF</strong>.</li></ul>",
    "section_adjuncts": "<p><strong>Dietary & Lifestyle Support:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Dietary Focus:</strong> The regimen emphasizes uncooked whole plants (fruits, vegetables, seeds) and green-juice cleansing (celery, cucumber, kale) to support systemic alkalinity.</li><li style=\"margin-bottom: 0.3em;\"><strong>Drainage:</strong> Coffee enemas or colon hydrotherapy are strongly recommended in this protocol to assist the body in eliminating dead parasites.</li><li style=\"margin-bottom: 0.3em;\"><strong>Additional Support:</strong> Iodine supplementation for thyroid support and Melatonin for sleep synergy are often included.</li></ul>",
    "section_considerations": "<p><strong>The 'Hatching' Phase Strategy:</strong></p><p style=\"margin-bottom: 1em;\">The break periods (1 week off or 5 days off) are described as functional phases rather than just rest.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Targeting Dormancy:</strong> The strategy intends to lure dormant cysts or larvae to hatch during the 'off' days, making them vulnerable to the subsequent round of medication.</li><li style=\"margin-bottom: 0.3em;\"><strong>Drug Specifics:</strong> Users are advised that Praziquantel is extremely bitter and should be swallowed whole. Strictly avoiding alcohol is cited as mandatory when taking Metronidazole or Tinidazole to prevent severe nausea.</li></ul>",
    "section_cautions": "<p style=\"color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;\">WARNING: Liver Stress & Die-Off</p><p style=\"margin-bottom: 1em;\">Because this is a polytherapy involving multiple pharmaceuticals, elevated liver enzymes are a noted risk.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Monitoring:</strong> Regular blood work to monitor liver function is highly recommended by practitioners utilizing this method.</li><li style=\"margin-bottom: 0.3em;\"><strong>Herxheimer Reactions:</strong> Users frequently report 'die-off' symptoms including nausea, vomiting, stomach cramping, flu-like exhaustion, and dizziness.</li></ul>",
    "anecdotal_score": 4.6, "scientific_score": 2.5, "reviews": 90, "video_link": "https://www.youtube.com/embed/3XmGu7ZCajY",
    "tags": ["Dr. Thomas Lodi", "Polytherapy", "Helminths", "Candida", "Detox"],
    "vendors": [
      { "name": "Safe Generic Pharmacy", "link": "https://www.safegenericpharmacy.com", "product_trust_score": 4.6 },
      { "name": "Fenbendazole Australia", "link": "https://fenbendazoleaustralia.com.au", "product_trust_score": 4.7 }
    ],
    "scientific_studies": [
      { "title": "Repurposing drugs in oncology (ReDO)—mebendazole as an anti-cancer agent", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4096024/" },
      { "title": "Ivermectin: a systematic review from antiviral effects to anti-cancer action", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7505114/" }
    ]
  },
  {
    "title": "Borax (Sodium Borate)",
    "ailment": "Joint Health, Osteoporosis & Candida",
    "description": "A traditional, controversial remedy used to correct boron deficiency, utilizing strict dilution to support bone density and joint health.",
    "efficacy_metrics": { "average_rating": 80, "vote_count": 3500, "key_success_story": "Long-standing anecdotal reports from the 'Earth Clinic' community cite rapid relief from osteoarthritic pain and candida overgrowth when adhering to the specific dilution protocol." },
    "popularity_metrics": { "baseline_report_volume": 12000, "site_views": 0 },
    "ai_overview": { "mood": "Precise Mineral Supplementation", "content": "Borax is a naturally occurring mineral (sodium tetraborate) that acts as a potent source of boron. While controversial due to its classification as a laundry additive, proponents argue that when used in minute, strictly diluted doses, it corrects widespread boron deficiency. The protocol emphasizes that Borax is chemically unstable in heat and corrosive in high concentrations, requiring exact adherence to cold-water dilution for safety." },
    "section_core": "<p><strong>Correct Traditional Use Protocol:</strong></p><p style=\"margin-bottom: 1em;\">The protocol emphasizes that Borax acts as a short-term therapeutic intervention, not a daily supplement.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Preparation:</strong> Standard instructions involve dissolving <strong>1/8 to 1/4 teaspoon</strong> of Borax in <strong>1 Liter</strong> of cold or room-temperature water to create the required safe dilution.</li><li style=\"margin-bottom: 0.3em;\"><strong>The Cycle:</strong> The regimen describes drinking this solution for <strong>5 days</strong>, followed by a mandatory rest period of <strong>3 days</strong>.</li><li style=\"margin-bottom: 0.3em;\"><strong>Duration:</strong> This '5 days on, 3 days off' cycle is typically repeated for a second week, after which users are advised to <strong>discontinue for approximately 6 months</strong>.</li></ul>",
    "section_adjuncts": "<p><strong>Chemistry & Temperature:</strong></p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>NO Hot Beverages:</strong> Protocols strictly warn that Borax must never be mixed into hot drinks. At ~32°C, it loses water of crystallization and converts into a pentahydrate or anhydrous glass-like compound, fundamentally altering its weight and structure.</li><li style=\"margin-bottom: 0.3em;\"><strong>Stomach Acidity:</strong> The specific dilution (1L water) is described as necessary to prevent the alkaline powder from neutralizing stomach acid, which would otherwise impair digestion and cause fermentation or reflux.</li></ul>",
    "section_considerations": "<p><strong>Mechanism of Accumulation:</strong></p><p style=\"margin-bottom: 1em;\">High daily intake creates 'Functional Accumulation,' where daily intake exceeds the body's elimination rate. This causes boron to gradually distribute into the liver, kidneys, brain, and reproductive organs.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Renal Recovery:</strong> The '3-Day Off' window is included to allow blood boron levels to drop (normalization usually occurs within 24–48 hours in healthy kidneys).</li></ul>",
    "section_cautions": "<p style=\"color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;\">WARNING: Reproductive & Renal Toxicity</p><p style=\"margin-bottom: 1em;\">Deviating from the protocol by using high doses or continuous use significantly increases the risk of toxicity.</p><ul style=\"list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;\"><li style=\"margin-bottom: 0.3em;\"><strong>Reproductive Harm:</strong> Continuous use is associated with fertility issues, testicular damage, and menstrual disruption. It is <strong>strictly contraindicated</strong> during pregnancy due to fetal harm.</li><li style=\"margin-bottom: 0.3em;\"><strong>Kidney Overload:</strong> Chronic overload can lead to fatigue, nausea, electrolyte disturbances, and kidney irritation.</li><li style=\"margin-bottom: 0.3em;\"><strong>Gastric Erosion:</strong> Undiluted or high doses are corrosive and can damage the stomach lining, leading to ulcers or GERD.</li></ul>",
    "anecdotal_score": 4.7, "scientific_score": 1.5, "reviews": 3500, "video_link": "https://www.youtube.com/embed/pQk0k8c4mCg",
    "tags": ["Boron", "Arthritis", "Osteoporosis", "Candida", "Joint Pain"],
    "vendors": [
      { "name": "Mule Team (Standard Source)", "link": "https://www.20muleteamlaundry.com/", "product_trust_score": 4.5 },
      { "name": "Prescribed For Life (Pure Powder)", "link": "https://prescribedforlife.com", "product_trust_score": 4.8 }
    ],
    "scientific_studies": [
      { "title": "Essentiality of Boron for Healthy Bones and Joints", "url": "https://pubmed.ncbi.nlm.nih.gov/7889887/" },
      { "title": "Nothing Boring About Boron", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4712861/" }
    ]
  },
];

// --- COMPONENTS ---

const AccordionSection = ({ title, content, icon: Icon, defaultOpen = false, isWarning = false, children, headerContent }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (!content) return null;
    // Safety check for content type
    if (typeof content !== 'string') return null;

    return (
        <div className={`border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${isWarning ? 'border-red-100 bg-red-50/30' : 'border-gray-200 bg-white'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-5 py-4 flex items-center justify-between relative transition-colors duration-200 ${isOpen ? (isWarning ? 'bg-red-50' : 'bg-emerald-50/50') : 'hover:bg-gray-50'}`}
            >
                {/* Left: Title & Icon */}
                <div className="flex items-center flex-shrink-0 z-10">
                    {Icon && <Icon className={`w-5 h-5 mr-3 ${isWarning ? 'text-red-500' : 'text-emerald-600'}`} />}
                    <h3 className={`text-base font-bold ${isWarning ? 'text-red-800' : 'text-gray-800'}`}>{title}</h3>
                </div>

                {/* Center: Header Content (Disclaimer) - Absolutely positioned to be perfectly centered */}
                {headerContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {headerContent}
                    </div>
                )}

                {/* Right: Chevron */}
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 z-10 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className={`p-5 text-gray-700 leading-relaxed border-t animate-in slide-in-from-top-1 ${isWarning ? 'border-red-100' : 'border-gray-100'}`}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                    {children}
                </div>
            )}
        </div>
    );
};

const BulkUploaderModal = ({ isOpen, onClose }) => {
    const [jsonData, setJsonData] = useState(JSON.stringify(DATA_TO_UPLOAD, null, 2));
    const [status, setStatus] = useState('idle'); 
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Simple client-side security gate
    const ADMIN_KEY = "heal2025"; 

    if (!isOpen) return null;

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_KEY) {
            setIsAuthenticated(true);
        } else {
            alert("Incorrect Access Code");
        }
    };

    const handleUpload = async () => {
        try {
            setStatus('uploading');
            const data = JSON.parse(jsonData);
            if (!Array.isArray(data)) throw new Error("Data must be an array []");
            const batch = writeBatch(db);
            data.forEach(item => {
                // 1. Create a Readable ID (Slug) from the Title
                let customId = item.title
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with dashes
                    .replace(/^-+|-+$/g, '');    // Remove leading/trailing dashes

                // Fallback if title is missing or empty
                if (!customId) customId = doc(collection(db, COLLECTION_NAME)).id;

                // 2. Use setDoc with the specific ID instead of addDoc
                const docRef = doc(db, COLLECTION_NAME, customId);
                
                const { id, testimonials, ...cleanData } = item; 
                
                batch.set(docRef, cleanData);
            });
            await batch.commit();
            setStatus('success');
            
            // Clear data and close after success
            setTimeout(() => { 
                setJsonData(''); // Clear the field
                setStatus('idle'); 
                onClose(); 
            }, 2000);
        } catch (err) {
            console.error(err); alert("Error: " + err.message); setStatus('error');
        }
    };

    // 1. Security Screen
    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">Admin Access Required</h3>
                    <p className="text-xs text-gray-500 mb-6">Please enter the access code to manage the database.</p>
                    <form onSubmit={handleLogin}>
                        <input 
                            type="password" 
                            className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-widest"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm">Unlock</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 2. Upload Screen (Only shown if authenticated)
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center"><Upload className="w-5 h-5 mr-2 text-emerald-600" /> Bulk Import Protocols</h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Paste your JSON array below.</p>
                        <button onClick={() => setJsonData('')} className="text-xs text-red-500 hover:text-red-700 font-semibold">Clear</button>
                    </div>
                    <textarea 
                        className="flex-1 w-full p-4 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        placeholder='[ { "title": "Example Protocol", ... } ]'
                    ></textarea>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button 
                        onClick={handleUpload}
                        disabled={status === 'uploading' || !jsonData}
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${status === 'success' ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {status === 'uploading' ? 'Uploading...' : status === 'success' ? 'Success!' : 'Upload Data'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProtocolFinderModal = ({ isOpen, onClose, protocols, onSelect, intent }) => {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search) return [];
        const lower = search.toLowerCase();
        return protocols.filter(p => p.title.toLowerCase().includes(lower));
    }, [search, protocols]);

    if (!isOpen) return null;

    const intentLabels = {
        'success': 'Submit Success Story',
        'side-effect': 'Report Side Effect',
        'correction': 'Suggest an Edit'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-800">Find Protocol</h3>
                        <p className="text-xs text-gray-500">Select protocol to {intentLabels[intent] || 'report on'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Type protocol name (e.g. Ivermectin)..." 
                            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pt-0">
                    {filtered.length > 0 ? (
                        <div className="space-y-2">
                            {filtered.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => onSelect(p.id)}
                                    className="w-full text-left p-3 hover:bg-emerald-50 rounded-lg transition-colors flex justify-between items-center group"
                                >
                                    <span className="font-medium text-gray-700 group-hover:text-emerald-700">{p.title}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-400" />
                                </button>
                            ))}
                        </div>
                    ) : search ? (
                        <p className="text-center text-gray-500 text-sm py-4">No protocols found matching "{search}"</p>
                    ) : (
                        <p className="text-center text-gray-400 text-xs py-4">Start typing to search...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const AboutPage = ({ onBack }) => (
    <div className="p-6 bg-white rounded-2xl shadow-2xl min-h-[80vh] animate-in fade-in duration-500">
        <button onClick={onBack} className="flex items-center text-emerald-600 hover:text-emerald-800 transition duration-150 mb-8 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Directory
        </button>
        
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-6 mx-auto">
                <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center">The Mission for Off-Patent Medicine</h1>
            
            <div className="prose prose-lg mx-auto text-gray-600 space-y-6">
                <p className="lead text-xl font-medium text-gray-800 text-center mb-8">
                    Bridging the gap where the pharmaceutical industry has left a void.
                </p>

                <p>
                    We live in an era of incredible medical advancement, yet a massive blind spot exists. 
                    <strong>Off-patent drugs</strong>—medicines that are cheap, safe, and widely available—are frequently ignored by major pharmaceutical companies. 
                </p>
                <p>
                    Why? Because without a patent, there is no exclusive profit margin to fund the multi-million dollar clinical trials required for FDA approval for <em>new</em> uses.
                </p>

                <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-8">
                    <h3 className="text-lg font-bold text-emerald-900 mb-2">The Result?</h3>
                    <p className="text-emerald-800">
                        Potentially life-saving treatments for cancer, chronic illness, and cognitive decline sit on the shelf, categorized only for their original purpose, while patients are left searching for answers in the dark.
                    </p>
                </div>

                <p>
                    <strong>Healing Directory</strong> exists to shine a light on these repurposing opportunities. We aggregate data from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Independent researchers and forward-thinking clinicians.</li>
                    <li>Smaller scale studies that don't make headlines.</li>
                    <li>The most valuable resource of all: <strong>Patient experiences (Anecdotal Data).</strong></li>
                </ul>

                <p>
                    By using our <strong>Trust Scores</strong>, we help you navigate the noise. We don't just show you what's "approved"—we show you what people are actually using to heal.
                </p>
            </div>
        </div>
    </div>
);

const SortControl = ({ sortBy, onSortChange }) => {
    return (
        // Removed mb-4 to ensure vertical alignment with the button next to it
        <div className="flex items-center justify-end">
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
                {/* Removed ArrowUpDown icon as requested to fix height alignment */}
                <span className="text-xs font-medium text-gray-500 mr-2 whitespace-nowrap">Sort by:</span>
                <select 
                    value={sortBy} 
                    onChange={(e) => onSortChange(e.target.value)}
                    // Added py-0 my-0 to prevent select element from adding extra height
                    className="text-sm font-bold text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none py-0 my-0"
                >
                    <option value="efficacy">Highest Efficacy</option>
                    <option value="popular">Most Popular</option>
                    <option value="alpha">A–Z</option>
                </select>
            </div>
        </div>
    );
};

const AlphaFilter = ({ selected, onSelect, browseMode, onBrowseModeChange }) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full mb-4">
            <div className={`border rounded-xl shadow-sm bg-white overflow-hidden`}>
                {/* Top Toggle Bar: Protocol vs Ailment */}
                <div className="flex border-b border-gray-100">
                    <button 
                        onClick={() => { onBrowseModeChange('title'); onSelect(null); }} // Reset letter when switching modes
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center transition-colors ${browseMode === 'title' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Pill className={`w-3.5 h-3.5 mr-1.5 ${browseMode === 'title' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        By Protocol
                    </button>
                    <div className="w-px bg-gray-100"></div>
                    <button 
                        onClick={() => { onBrowseModeChange('ailment'); onSelect(null); }} // Reset letter when switching modes
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center transition-colors ${browseMode === 'ailment' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <LayoutList className={`w-3.5 h-3.5 mr-1.5 ${browseMode === 'ailment' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        By Ailment
                    </button>
                </div>

                {/* Dropdown Trigger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${isOpen ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-gray-50'}`}
                >
                    <div className="flex items-center">
                        <Library className="w-4 h-4 mr-2" />
                        {selected ? `Filter: ${selected} (${browseMode === 'title' ? 'Protocol' : 'Ailment'})` : `Browse A–Z`}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Content */}
                {isOpen && (
                    <div className="p-4 bg-gray-50 animate-in slide-in-from-top-2 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2 justify-center">
                            <button
                                onClick={() => { onSelect(null); setIsOpen(false); }}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 border ${!selected ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'}`}
                            >
                                ALL
                            </button>
                            {alphabet.map(char => (
                                <button
                                    key={char}
                                    onClick={() => { onSelect(char); setIsOpen(false); }}
                                    className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-lg transition-all duration-200 border ${selected === char ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'}`}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const ProtocolCard = ({ protocol, onSelect, onShare, isFavorite, onToggleFavorite }) => {
    // CALCULATE DYNAMIC METRICS - DEFENSIVE CHECK
    // Ensure protocol exists before accessing
    if (!protocol) return null;

    const score = Number(protocol.efficacy_metrics?.average_rating) || 0;
    const stars = getStarCount(score);
    
    // ROBUST DATA ACCESS: Check both nested and root-level fields for compatibility
    const popularityMetrics = protocol.popularity_metrics || {};
    const baseline = Number(popularityMetrics.baseline_report_volume || protocol.baseline_report_volume) || 0; 
    const views = Number(popularityMetrics.site_views || protocol.site_views) || 0;
    const totalInterest = baseline + views;

    return (
        <div 
            className="bg-white p-5 sm:p-6 shadow-md rounded-2xl transition-all duration-300 border border-gray-100 cursor-pointer active:scale-[0.98] hover:shadow-xl hover:border-emerald-100 relative group animate-in slide-in-from-bottom-4 fade-in duration-500"
            onClick={() => onSelect(protocol.id)}
        >
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-extrabold text-gray-800 pr-16 group-hover:text-emerald-700 transition-colors">{protocol.title || "Untitled Protocol"}</h2>
                <div className="absolute top-4 right-4 flex space-x-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onToggleFavorite(protocol.id);
                        }}
                        className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}`}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onShare(protocol);
                        }}
                        className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                        title="Share Protocol"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <p className="text-gray-500 mb-4 text-sm line-clamp-2 leading-relaxed">{protocol.description || "No description available."}</p>

            <div className="flex flex-wrap gap-4 justify-between items-center text-xs font-medium pt-3 border-t border-gray-50">
                <div className="flex gap-3 items-center flex-wrap">
                    
                    {/* EFFICACY SCORE (STAR RATING) - ONE STAR RATING */}
                    <div className="flex items-center px-3 py-1.5 bg-green-50 text-green-800 rounded-lg border border-green-100">
                        <Star className="w-4 h-4 mr-1.5 fill-green-500 text-green-500" />
                        <span className="font-bold text-sm mr-1">{stars}</span>
                        <span className="opacity-75">/ 5 Efficacy</span>
                    </div>

                    {/* VOLUME SCORE (POPULARITY) - ONE VOLUME INDICATOR */}
                    <div className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                        <Activity className="w-4 h-4 mr-1.5 text-blue-500" />
                        <span className="font-bold text-sm mr-1">{(totalInterest).toLocaleString()}</span>
                        <span className="opacity-75">Interest</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

const ScientificLiteratureButton = ({ protocol }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Safety check for legacy data or missing arrays - CRASH PROOF LOGIC
    let studies = [];
    if (Array.isArray(protocol.scientific_studies) && protocol.scientific_studies.length > 0) {
        studies = protocol.scientific_studies;
    } else if (protocol.scientific_link) {
        studies = [{ title: "View Scientific Literature", url: protocol.scientific_link }];
    }
    
    const panelId = `scientific-panel-${protocol.id}`;

    const buttonBaseClass = "w-[calc(100%+2px)] -ml-[1px] -mr-[1px] -mb-[1px] py-3 px-2 text-[10px] sm:text-xs font-bold flex justify-center items-center transition duration-150 relative z-10 min-h-[42px]";
    const roundedClass = "rounded-br-xl rounded-bl-none";

    if (studies.length === 0) {
        return (
            <button disabled className={`${buttonBaseClass} ${roundedClass} bg-gray-100 text-gray-400 cursor-not-allowed border-t border-gray-200`}>
                No Link Available
            </button>
        );
    }

    if (studies.length === 1) {
        return (
            <a
                href={studies[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonBaseClass} ${roundedClass} bg-blue-600 text-white hover:bg-blue-700`}
            >
                <BookOpen className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">Scientific Lit.</span>
            </a>
        );
    }

    return (
        <div className="relative w-full">
            <button
                id={`scientific-button-${protocol.id}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={`${buttonBaseClass} ${roundedClass} bg-blue-600 text-white hover:bg-blue-700 justify-between`}
            >
                <div className="flex items-center overflow-hidden">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">Scientific Lit. ({studies.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} flex-shrink-0 ml-1`} />
            </button>
            {isOpen && (
                <div 
                    id={panelId}
                    role="region"
                    className="absolute z-20 w-[calc(100%+2px)] -ml-[1px] mt-1 bg-white border border-blue-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-0 right-0"
                    aria-labelledby={`scientific-button-${protocol.id}`}
                >
                    {studies.map((study, index) => (
                        <a
                            key={index}
                            href={study.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-3 text-xs sm:text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 border-b border-gray-100 last:border-0 text-left transition-colors"
                        >
                            {study.title || `Study #${index + 1}`}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};


const ProtocolDetailPage = ({ protocol, onBack, onShare, db, userId, isFavorite, onToggleFavorite, scrollToTestimonialsOnMount }) => {
    const [testimonialAilment, setTestimonialAilment] = useState("");
    const [testimonialText, setTestimonialText] = useState('');
    const [testimonialScore, setTestimonialScore] = useState(5); 
    const [submissionStatus, setSubmissionStatus] = useState(null); 
    const [testimonials, setTestimonials] = useState([]);
    const [hasUserTestimonial, setHasUserTestimonial] = useState(false); 
    const MAX_CHARS = 1000;

    // Calculate Display Metrics with Robust Fallback & Type Safety
    const efficacyScore = Number(protocol.efficacy_metrics?.average_rating) || 0;
    const stars = getStarCount(efficacyScore);
    
    const popularityMetrics = protocol.popularity_metrics || {};
    const baseline = Number(popularityMetrics.baseline_report_volume || protocol.baseline_report_volume) || 0;
    const views = Number(popularityMetrics.site_views || protocol.site_views) || 0;
    const totalInterest = baseline + views;

    // Increment View Count on Mount (Prevent Crash if Auth Fails)
    useEffect(() => {
        if (!protocol?.id) return;
        const incrementView = async () => {
            try {
                const ref = doc(db, COLLECTION_NAME, protocol.id);
                // Check if popularity_metrics map exists, if not we might need to set merge
                // Simple increment usually works if the field path exists, but let's be safe
                await updateDoc(ref, {
                    "popularity_metrics.site_views": increment(1)
                }).catch(async (e) => {
                     // Fallback: if map doesn't exist, create it
                     // NOTE: We wrap this to prevent app crash if permissions/auth fail
                     try {
                         await setDoc(ref, { 
                             popularity_metrics: { site_views: 1 } 
                         }, { merge: true });
                     } catch (innerErr) {
                         console.warn("Could not init view counter (likely auth/permission issue):", innerErr);
                     }
                });
            } catch (err) {
                console.error("Failed to increment view:", err);
            }
        };
        incrementView();
    }, [protocol?.id]);


    const scrollToVendors = () => {
        const element = document.getElementById('vendors-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    const getEmbedUrl = (url) => {
        if (!url || typeof url !== 'string') return null;
        const cleanUrl = url.trim();
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = cleanUrl.match(regExp);
        return (match && match[2].length === 11) 
            ? `https://www.youtube.com/embed/${match[2]}` 
            : null; 
    };

    useEffect(() => {
        if (!protocol?.id) return;
        const testimonialsRef = collection(db, `${COLLECTION_NAME}/${protocol.id}/testimonials`);
        const q = query(testimonialsRef);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let fetchedTestimonials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedTestimonials.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            if (userId) {
                setHasUserTestimonial(fetchedTestimonials.some(t => t.userId === userId));
            }
            
            if (fetchedTestimonials.length > 0) {
                setTestimonials(fetchedTestimonials);
            } else {
                let fallback = protocol.testimonials || [];
                 if (Array.isArray(fallback)) {
                    fallback.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                }
                setTestimonials(fallback);
            }
        });
        return () => unsubscribe();
    }, [protocol?.id, userId]);

    if (!protocol) return null;

    const scrollToTestimonials = () => {
        const element = document.getElementById('testimonials-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (scrollToTestimonialsOnMount) {
            const timer = setTimeout(() => {
                scrollToTestimonials();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [scrollToTestimonialsOnMount]);

    const handleSubmitTestimonial = async () => {
        if (!testimonialText || !userId || testimonialText.length > MAX_CHARS) { 
            setSubmissionStatus('error');
            return;
        }

        if (hasUserTestimonial) {
             setSubmissionStatus('already');
             setTimeout(() => setSubmissionStatus(null), 4000);
             return;
        }

        setSubmissionStatus('loading');
        const protocolRef = doc(db, COLLECTION_NAME, protocol.id);
        const testimonialsCollectionPath = `${COLLECTION_NAME}/${protocol.id}/testimonials`;
        
        try {
            await addDoc(collection(db, testimonialsCollectionPath), {
                text: testimonialText,
                score: testimonialScore,
                userId: userId,
                date: new Date().toISOString().split('T')[0],
                photo: false,
                user: `User-${userId.substring(0, 4)}`,
                ailment: testimonialAilment || null,
            });

            const userRatingPercent = testimonialScore * 20;
            const currentAvg = Number(protocol.efficacy_metrics?.average_rating) || 0;
            const currentCount = Number(protocol.efficacy_metrics?.vote_count) || 0;
            const newAvg = calculateNewAverage(currentAvg, currentCount, userRatingPercent);

            await updateDoc(protocolRef, {
                "efficacy_metrics.average_rating": newAvg,
                "efficacy_metrics.vote_count": increment(1)
            });

            setSubmissionStatus('success');
            setTestimonialText('');
            setTestimonialAilment(''); 
            setHasUserTestimonial(true); 
            setTimeout(() => setSubmissionStatus(null), 3000); 
        } catch (error) {
            console.error("Error submitting:", error);
            setSubmissionStatus('error');
            setTimeout(() => setSubmissionStatus(null), 5000); 
        }
    };

    const StatusMessage = ({ status }) => {
        switch (status) {
            case 'loading': return <p className="text-emerald-600 font-semibold flex items-center">Submitting...</p>;
            case 'success': return <p className="text-green-600 font-semibold">Thank you for your review!</p>;
            case 'error': return <p className="text-red-600 font-semibold">Submission failed.</p>;
            case 'already': return <p className="text-gray-600 font-semibold">You’ve already shared your experience on this protocol. Thank thank you for contributing to the community data.</p>;
            default: return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-2xl min-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center text-emerald-600 hover:text-emerald-800 transition duration-150 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Directory
                </button>
                <div className="flex space-x-2">
                     <button 
                        onClick={() => onToggleFavorite(protocol.id)}
                        className={`p-2 rounded-lg transition duration-150 flex items-center ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                         <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => onShare(protocol)} className="flex items-center text-emerald-600 hover:text-emerald-800 transition duration-150 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{protocol.title}</h1>
            <p className="text-lg text-emerald-600 font-semibold mb-4">Target Ailment: {protocol.ailment}</p>
            
            {/* Compact Trust Score Section - FORCED GRID LAYOUT FOR STRICT 50/50 */}
            <div className="mb-8 shadow-sm rounded-xl grid grid-cols-2 border border-gray-200">
                {/* Efficacy Score (Left Half - 50% Width) */}
                <div className="flex flex-col bg-green-50 border-r border-green-100 rounded-l-xl min-w-0">
                    <div className="py-3 px-1 flex flex-col items-center justify-center flex-grow">
                        <div className="flex items-center text-lg sm:text-xl font-extrabold text-green-700">
                            <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-1 fill-yellow-400 text-yellow-400" />
                            {stars}/5
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-green-700 font-bold uppercase tracking-wide mt-0.5 text-center">Efficacy Rating</p>
                        <p className="text-[9px] sm:text-[10px] text-green-600 font-medium text-center leading-tight">{protocol.efficacy_metrics?.vote_count || 0} Votes</p>
                    </div>
                    <div className="mt-auto">
                        <button 
                            onClick={scrollToTestimonials} 
                            className="w-[calc(100%+2px)] -ml-[1px] -mr-[1px] -mb-[1px] py-3 px-2 bg-green-600 text-white font-bold text-[10px] sm:text-xs hover:bg-green-700 transition duration-150 flex justify-center items-center relative z-10 rounded-bl-xl min-h-[42px]"
                        >
                            <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" /> 
                            <span className="truncate">View Evidence</span>
                        </button>
                    </div>
                </div>

                {/* Popularity Score (Right Half - 50% Width) */}
                <div className="flex flex-col bg-blue-50 rounded-r-xl min-w-0">
                    <div className="py-3 px-1 flex flex-col items-center justify-center flex-grow">
                        <div className="flex items-center text-lg sm:text-xl font-extrabold text-blue-700">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-blue-500" />
                            {(totalInterest).toLocaleString()}
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-blue-700 font-bold uppercase tracking-wide mt-0.5 text-center">Community Interest</p>
                        <p className="text-[9px] sm:text-[10px] text-blue-600 font-medium text-center leading-tight">Volume Score</p>
                    </div>
                    <div className="mt-auto">
                        <ScientificLiteratureButton protocol={protocol} />
                    </div>
                </div>
            </div>

            
            {protocol.video_link && getEmbedUrl(protocol.video_link) && (
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                        <Youtube className="w-6 h-6 mr-2 text-red-500" /> Video Overview
                    </h3>
                    <div className="relative overflow-hidden rounded-xl shadow-xl" style={{ paddingTop: '56.25%' }}>
                        <iframe 
                            className="absolute top-0 left-0 w-full h-full" 
                            src={getEmbedUrl(protocol.video_link)} 
                            title={`Video guide for ${protocol.title}`} 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </section>
            )}

            {/* --- SECTION A: Always Open Summary --- */}
            {(protocol.ai_overview || protocol.summary) && (
                <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                    <h3 className="flex items-center text-lg font-bold text-gray-900 mb-3">
                        <Sparkles className="w-5 h-5 text-emerald-500 mr-2" />
                        Protocol Summary <span className="text-xs font-normal text-gray-400 ml-2">(AI Generated)</span>
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        {protocol.ai_overview?.content || protocol.summary}
                    </p>
                </div>
            )}

            {/* --- SECTIONS B, C, D, E: Accordions --- */}
            <div className="space-y-4 mb-8">
                {/* Fallback for legacy data that only has full_detail */}
                {protocol.full_detail && !protocol.section_core && (
                    <div 
                        className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200"
                        dangerouslySetInnerHTML={{ __html: protocol.full_detail }}
                    ></div>
                )}

                {/* New Section Structure */}
                <AccordionSection 
                    title="Core Regimen" 
                    icon={Activity} 
                    content={protocol.section_core} 
                    defaultOpen={true} // B is usually the most important, default open slightly helps UX
                    headerContent={
                        <span className="hidden sm:inline-block text-base font-bold text-gray-800 whitespace-nowrap">
                            For Educational Purposes Only
                        </span>
                    }
                >
                    {/* Button to scroll to vendors */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button 
                            onClick={scrollToVendors}
                            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            See Where to Purchase
                            <ArrowDownCircle className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </AccordionSection>
                
                <AccordionSection 
                    title="Adjuncts & Co-Factors" 
                    icon={Zap} 
                    content={protocol.section_adjuncts} 
                />
                
                <AccordionSection 
                    title="Important Considerations" 
                    icon={Clock} // Using Clock icon for timing/breaks
                    content={protocol.section_considerations} 
                />
                
                <AccordionSection 
                    title="Cautions & Red Flags" 
                    icon={AlertOctagon} // Using AlertOctagon for stronger warning
                    content={protocol.section_cautions} 
                    isWarning={true}
                />
            </div>

            <section className="mt-4 mb-8 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 leading-relaxed">
                <p className="font-bold text-lg text-yellow-900 mb-2">Important:</p>
                <p>This protocol summary is for education and personal research only.</p>
                <p>It is not medical advice, diagnosis, or a prescription.</p>
                <p>Always work with a qualified healthcare professional before starting, stopping, or changing any treatment, drug, or supplement.</p>
            </section>

            <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg text-sm font-medium">
                <p className="font-bold">SPONSOR AD:</p>
                <p>High-quality supplements vetted for purity. Use code HEAL20 for 20% off at PartnerStore.</p>
            </div>

            <section id="vendors-section" className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Where to Buy (Vendor Trust)</h3>
                <div className="space-y-3">
                    {protocol.vendors?.map((vendor, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all gap-4">
                            
                            {/* Left Side: Logo & Name */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-100 text-gray-400">
                                    {/* Placeholder for Logo - could be an <img> tag if URL exists */}
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg leading-tight">{vendor.name}</p>
                                    <p className="text-xs text-gray-500">Verified Vendor</p>
                                </div>
                            </div>

                            {/* Right Side: Score & Button */}
                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pl-16 sm:pl-0">
                                 {/* Trust Score */}
                                <div className="flex flex-col items-start sm:items-end">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Trust Score</span>
                                    <div className="flex items-center font-bold text-gray-900 text-lg">
                                        <Star className="w-5 h-5 mr-1.5 fill-yellow-400 text-yellow-400" />
                                        {formatScore(vendor.product_trust_score)}
                                    </div>
                                </div>

                                {/* Button */}
                                <a 
                                    href={vendor.link || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap flex items-center"
                                >
                                    Visit Store
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="testimonials-section" className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Protocol Testimonials</h3>
                
                {/* Updated Testimonial Input Card - Grey Background */}
                <div className="p-6 mb-8 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 text-lg">Share Your Experience</h4>

                    {hasUserTestimonial ? (
                        <div className="text-center py-6 bg-white rounded-xl border border-green-100">
                             <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                             <p className="font-semibold text-gray-800">You’ve already shared your experience.</p>
                             <p className="text-sm text-gray-500 mt-1">Thank you for contributing to the community data.</p>
                        </div>
                    ) : (
                        <>
                            <label htmlFor="testimonial-ailment" className="block text-sm font-bold text-gray-700 mb-2">
                                Condition / Ailment
                            </label>
                            <input
                                id="testimonial-ailment"
                                type="text"
                                placeholder="e.g. Lyme Disease, Chronic Fatigue..."
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm mb-4 shadow-sm"
                                value={testimonialAilment}
                                onChange={(e) => setTestimonialAilment(e.target.value)}
                            />

                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Your Experience
                            </label>
                            <textarea
                                maxLength={1000}
                                rows="4" 
                                placeholder="How did this protocol work for you? Details on dosing, timing, and results help others." 
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm mb-4 shadow-sm" 
                                value={testimonialText} 
                                onChange={(e) => setTestimonialText(e.target.value)} 
                                disabled={submissionStatus === 'loading'}
                            ></textarea>

                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div className="flex flex-col">
                                     <label className="text-sm font-bold text-gray-700 mb-1">Your Rating</label>
                                     <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setTestimonialScore(star)}
                                                disabled={submissionStatus === 'loading'}
                                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95 p-1"
                                            >
                                                <Star className={`w-6 h-6 ${star <= testimonialScore ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            </button>
                                        ))}
                                     </div>
                                </div>
                                <div className="flex flex-col items-end">
                                     <button className={`flex items-center px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 ${testimonialText && submissionStatus !== 'loading' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} onClick={handleSubmitTestimonial} disabled={!testimonialText || submissionStatus === 'loading'}>
                                          {submissionStatus === 'loading' ? 'Sending...' : 'Post Review'} <Send className="w-4 h-4 ml-2" />
                                     </button>
                                     <div className="mt-2 text-right">
                                        <StatusMessage status={submissionStatus} />
                                     </div>
                                </div>
                            </div>
                            <div className="flex justify-end text-xs text-gray-400 mt-2">
                                {testimonialText.length}/1000 characters
                            </div>
                        </>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                         <button onClick={() => alert("Correction suggestions coming soon! This will link to a feedback form.")} className="text-xs text-gray-400 hover:text-emerald-600 underline transition-colors flex items-center justify-center mx-auto">
                            <Flag className="w-3 h-3 mr-1" /> Suggest an edit to this protocol
                         </button>
                    </div>
                </div>

                {/* Updated Testimonial List Cards */}
                <div className="space-y-4">
                {testimonials.length > 0 ? testimonials.map(t => (
                    <div key={t.id} className="flex gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 border border-gray-100">
                                 <User className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center justify-between mb-1">
                                 <span className="font-bold text-gray-900 text-sm">{t.user}</span>
                                 <span className="text-gray-400 text-xs">{t.date}</span>
                            </div>
                            <div className="flex items-center mb-2">
                                 {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`w-3 h-3 ${i < t.score ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                 ))}
                            </div>
                            {t.ailment && (
                                 <div className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium mb-3">
                                     For: {t.ailment}
                                 </div>
                            )}
                            <p className="text-gray-700 text-sm leading-relaxed">{t.text}</p>
                            {t.photo && <span className="text-xs text-green-600 flex items-center mt-2 font-medium"><Camera className="w-3 h-3 mr-1" /> Verified Purchase</span>}
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 italic text-sm">No testimonials yet. Be the first to share your experience!</p>
                    </div>
                )}
                </div>
            </section>
        </div>
    );
};

const QuickFilters = ({ onFilter, activeFilter, showSaved = true }) => {
    const filters = [
        { name: "Brain Health", icon: Brain },
        { name: "Immunity", icon: Shield },
        { name: "Detox", icon: Sparkles },
        { name: "Energy", icon: Zap },
        { name: "Gut Health", icon: Activity },
    ];

    return (
        // FIXED: Changed justify-center to justify-start md:justify-center
        // This ensures items start at the left edge on mobile (fix scrolling) but center on desktop
        <div className="flex overflow-x-auto space-x-3 py-2 px-1 scrollbar-hide mb-4 justify-start md:justify-center">
            {filters.map((f) => (
                <button
                    key={f.name}
                    onClick={() => onFilter(f.name)}
                    className={`flex items-center px-4 py-2 rounded-full shadow-sm text-sm font-semibold border whitespace-nowrap transition-all flex-shrink-0 ${activeFilter === f.name ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200'}`}
                >
                    <f.icon className={`w-4 h-4 mr-2 ${activeFilter === f.name ? 'text-white' : 'text-emerald-500'}`} />
                    {f.name}
                </button>
            ))}
            
            {/* My Saved Button - Conditionally Rendered */}
            {showSaved && (
                <button
                    onClick={() => onFilter('favorites')}
                    className={`flex items-center px-4 py-2 rounded-full shadow-sm text-sm font-semibold border whitespace-nowrap transition-all flex-shrink-0 ${activeFilter === 'favorites' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500'}`}
                >
                    <Heart className={`w-4 h-4 mr-2 ${activeFilter === 'favorites' ? 'fill-current' : ''}`} />
                    My Saved
                </button>
            )}
        </div>
    );
};

const App = () => {
    const [protocols, setProtocols] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [heroSearchTerm, setHeroSearchTerm] = useState(''); // New independent state for Hero search
    const [selectedLetter, setSelectedLetter] = useState(null); 
    const [browseMode, setBrowseMode] = useState('title'); // 'title' (Protocol) or 'ailment'
    const [isBrowsing, setIsBrowsing] = useState(false); 
    const [sortBy, setSortBy] = useState('efficacy'); 
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [selectedProtocolId, setSelectedProtocolId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showUploader, setShowUploader] = useState(false); 
    
    const [showTrustScoreInfo, setShowTrustScoreInfo] = useState(false);
    const [showAboutPage, setShowAboutPage] = useState(false);
    const [reportIntent, setReportIntent] = useState(null); 
    const [isFindingProtocolForReport, setIsFindingProtocolForReport] = useState(false);
    const [activeFilter, setActiveFilter] = useState(null);

    // Custom Hook
    const { favorites, toggleFavorite, isFavorite } = useFavorites();


    const handleShare = useCallback(async (protocol) => {
        const result = await shareProtocol(protocol);
        if (result === 'copied') {
            setNotification("Link copied to clipboard!");
            setTimeout(() => setNotification(null), 3000);
        }
    }, []);

    const handleBack = useCallback(() => {
      setSelectedProtocolId(null);
      setReportIntent(null); // Clear intent when going back
      safePushState(null, '', '/');
      window.scrollTo(0, 0);
    }, []);
    
    const handleGoHome = useCallback(() => {
      setSelectedProtocolId(null);
      setSearchTerm('');
      setHeroSearchTerm(''); // Clear hero search too
      setSelectedLetter(null);
      setIsBrowsing(false);
      setSortBy('efficacy');
      setShowAboutPage(false);
      setActiveFilter(null);
      setReportIntent(null); // Clear intent when going home
      safePushState(null, '', '/');
      window.scrollTo(0, 0);
    }, []);
    
    const handleGoToAbout = useCallback(() => {
      setShowAboutPage(true);
      setSelectedProtocolId(null);
      setIsBrowsing(false);
      setSearchTerm('');
      setHeroSearchTerm('');
      setSelectedLetter(null);
      setActiveFilter(null);
      setReportIntent(null); // Clear intent
      safePushState(null, '', '/about');
      window.scrollTo(0, 0);
    }, []);
    

    const handleProtocolReportSelect = useCallback((id) => {
        setSelectedProtocolId(id);
        setIsFindingProtocolForReport(false);
        // Don't clear reportIntent here so we can use it to scroll in ProtocolDetailPage
        safePushState(null, '', `/protocol/${id}`);
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              try {
                await signInWithCustomToken(auth, __initial_auth_token);
              } catch (e) {
                  console.warn("Custom token auth failed, falling back to anonymous", e);
                  await signInAnonymously(auth);
              }
          } else {
            await signInAnonymously(auth);
          }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    function setUser(user) {
        if (user) {
            setUserId(user.uid);
        } else {
            setUserId("guest-" + Math.random().toString(36).substr(2, 9)); 
        }
        setLoading(false);
    }
    
    const currentProtocol = useMemo(() => {
        return protocols.find(p => p.id === selectedProtocolId);
    }, [protocols, selectedProtocolId]);

    useEffect(() => {
        let title = "Healing Directory";
        if (showAboutPage) {
            title = "About – Healing Directory";
        } else if (selectedProtocolId && currentProtocol) {
            const protocolTitle = currentProtocol.title || "Loading Protocol";
            title = `${protocolTitle} – Healing Directory`;
        }
        document.title = title;
    }, [showAboutPage, selectedProtocolId, currentProtocol]);


    useEffect(() => {
        const q = query(collection(db, COLLECTION_NAME));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProtocols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProtocols(fetchedProtocols);
        }, (error) => {
            console.error("DB Error:", error);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
      const path = window.location.pathname;
      const match = path.match(/^\/protocol\/([^/]+)/);

      if (match) {
        const idFromUrl = match[1];
        setSelectedProtocolId(idFromUrl);
        setIsBrowsing(false);
        setShowAboutPage(false);
      }
    }, []);

    useEffect(() => {
      const handlePopState = () => {
        const path = window.location.pathname;
        const protocolMatch = path.match(/^\/protocol\/([^/]+)/);
      
        if (protocolMatch) {
          setSelectedProtocolId(protocolMatch[1]);
          setIsBrowsing(false);
          setShowAboutPage(false);
        } else if (path === '/about') {
          setShowAboutPage(true);
          setSelectedProtocolId(null);
        } else {
          setSelectedProtocolId(null);
          setShowAboutPage(false);
          setReportIntent(null); // Clear intent on history navigation to home
        }
      };
      

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const filteredProtocols = useMemo(() => {
        let results = [];

        if (activeFilter === 'favorites') {
            results = protocols.filter(p => favorites.includes(p.id));
        } else if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            const searchWords = lowerCaseSearch.split(/\s+/).filter(word => word.length > 0);
            results = protocols.filter(protocol => {
                const searchableText = `
                    ${protocol.title || ''} 
                    ${protocol.description || ''} 
                    ${protocol.ailment || ''} 
                    ${protocol.full_detail || ''}
                    ${(protocol.tags || []).join(' ')}
                `.toLowerCase();
                return searchWords.some(word => searchableText.includes(word));
            });
        } else if (selectedLetter) {
             results = protocols.filter(protocol => {
                // UPDATED FILTER LOGIC based on browseMode
                const fieldToCheck = browseMode === 'title' ? (protocol.title || '') : (protocol.ailment || '');
                const cleanField = fieldToCheck.trim().toUpperCase();
                return cleanField.startsWith(selectedLetter);
            });
        } else if (isBrowsing) {
             results = [...protocols];
        }

        const sorted = [...results];
        switch (sortBy) {
            case 'efficacy':
                // Sort by weighted average score (descending)
                return sorted.sort((a, b) => {
                    const scoreA = a.efficacy_metrics?.average_rating || 0;
                    const scoreB = b.efficacy_metrics?.average_rating || 0;
                    return scoreB - scoreA;
                });
            case 'popular':
                 // Sort by Total Interest (baseline + views)
                 return sorted.sort((a, b) => {
                     // ROBUST SORT: Check nested first, fall back to root
                     const volA = (a.popularity_metrics?.baseline_report_volume || a.baseline_report_volume || 0) + (a.popularity_metrics?.site_views || a.site_views || 0);
                     const volB = (b.popularity_metrics?.baseline_report_volume || b.baseline_report_volume || 0) + (b.popularity_metrics?.site_views || b.site_views || 0);
                     return volB - volA;
                 });
            case 'alpha':
                 return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            default:
                return sorted;
        }
    }, [protocols, searchTerm, selectedLetter, isBrowsing, sortBy, activeFilter, favorites, browseMode]);

    const handleSelectProtocol = useCallback((id) => {
      setSelectedProtocolId(id);
      safePushState(null, '', `/protocol/${id}`);
      window.scrollTo(0, 0);
    }, []);
    

    const handleFilter = useCallback((tag) => {
        if (activeFilter === tag) {
            setActiveFilter(null);
            setSearchTerm('');
            setHeroSearchTerm('');
            if (tag === 'favorites') {
                setIsBrowsing(true); // fall back to browsing all if unclicking favorites
            }
        } else {
            setActiveFilter(tag);
            if (tag === 'favorites') {
                setSearchTerm('');
                setHeroSearchTerm('');
                setSelectedLetter(null);
                setIsBrowsing(true);
                setShowAboutPage(false);
            } else {
                setSearchTerm(tag);
                setHeroSearchTerm(tag); // Sync hero search so it feels connected
                setSelectedLetter(null);
                setIsBrowsing(true);
                setShowAboutPage(false);
            }
        }
    }, [activeFilter]);

    const handleLetterSelect = useCallback((letter) => {
        setSelectedLetter(letter);
        setSearchTerm('');
        setHeroSearchTerm('');
        setActiveFilter(null);
        setIsBrowsing(true);
        setShowAboutPage(false);
        if (letter === null) { 
             setSortBy('efficacy'); 
        }
    }, []);

    const startBrowsing = useCallback(() => {
        setIsBrowsing(true);
        setSearchTerm('');
        setHeroSearchTerm('');
        setSelectedLetter(null);
        setActiveFilter(null);
        setShowAboutPage(false);
        setSortBy('efficacy'); 
    }, []);
    
    // UPDATED: Handle Hero Search Enter Key + Icon Click Logic
    const triggerSearch = useCallback((e) => {
        // Handle both Enter keydown and Button click
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== 'Go') return;
        
        // Only proceed if there is a search term
        if (heroSearchTerm.trim()) {
            setSearchTerm(heroSearchTerm); // Pass term to main search
            setIsBrowsing(true); // Switch view
            setSelectedLetter(null);
            setActiveFilter(null);
            
            // Dismiss keyboard on mobile
            if (document.activeElement) document.activeElement.blur(); 
        }
    }, [heroSearchTerm]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <p className="text-xl text-emerald-600 animate-pulse">Loading Healing Directory Database...</p>
            </div>
        );
    }


    const MainContent = () => {
        if (showAboutPage) {
            return <AboutPage onBack={handleGoHome} />;
        }

        if (selectedProtocolId && currentProtocol) {
            return <ProtocolDetailPage 
                protocol={currentProtocol} 
                onBack={handleBack} 
                onShare={handleShare} 
                db={db} 
                userId={userId} 
                appId={firebaseConfig.appId} 
                isFavorite={isFavorite(selectedProtocolId)} 
                onToggleFavorite={toggleFavorite} 
                scrollToTestimonialsOnMount={!!reportIntent} // Trigger scroll if intent exists
            />;
        }

        return (
            <>
                {/* Hero / Search Section */}
                {!(searchTerm || isBrowsing || activeFilter) && (
                <div className="relative bg-gradient-to-br from-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-xl overflow-hidden"
                     style={{ 
                          backgroundImage: 'url("hero background.jpg")',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                      }}
                >
                    {/* Switched overlay back to Teal at 30% opacity */}
                    <div className="absolute inset-0 bg-teal-900/30 backdrop-blur-[1px] rounded-3xl"></div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <div className="flex justify-center mb-4">
                            {/* UPDATED: Soft white/glass background for the logo */}
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/40 shadow-sm">
                                <img 
                                    src="/logo.png" 
                                    alt="Healing Directory Logo" 
                                    className="w-12 h-12 object-contain" 
                                />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight font-serif">
                            Healing Directory
                        </h1>
                        
                        <p className="text-emerald-50 mb-4 text-sm sm:text-base font-medium max-w-lg mx-auto">
                            Currently tracking <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">{protocols.length}</span> Repurposed & Integrative Protocols.
                        </p>

                        <p className="text-emerald-100 mb-8 text-sm sm:text-base font-medium max-w-lg mx-auto">
                             Bridging the gap between anecdotal success and scientific validation.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
                            <div className="relative w-full shadow-2xl">
                                {/* UPDATED: Search Icon acts as Button/Enter key handler */}
                                <button 
                                    onClick={triggerSearch}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/10 active:scale-95 transition-all z-20"
                                >
                                    <Search className="w-5 h-5 text-gray-400 hover:text-emerald-500" />
                                </button>
                                <input 
                                    type="search" // Use type search for better mobile behavior (Go/Search button)
                                    placeholder="Search for ailments, drugs, or protocols..." 
                                    className="w-full py-4 pl-12 pr-4 bg-white text-gray-800 rounded-xl shadow-lg focus:ring-4 focus:ring-teal-400/50 focus:outline-none transition-all font-medium" 
                                    value={heroSearchTerm}
                                    onChange={(e) => setHeroSearchTerm(e.target.value)}
                                    onKeyDown={triggerSearch} // Trigger search on Enter key press
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center gap-2">
                             <button onClick={startBrowsing} className="text-xs bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-semibold transition backdrop-blur-sm">Browse A-Z</button>
                             <button onClick={() => { setActiveFilter('favorites'); setIsBrowsing(true); }} className="text-xs bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-semibold transition backdrop-blur-sm flex items-center"><Heart className="w-3 h-3 mr-1" /> My Saved</button>
                        </div>
                    </div>
                </div>
                )}

                {/* Conditionally render Results */}
                {(searchTerm || isBrowsing || activeFilter) ? (
                    <div className="flex flex-col h-full">
                        
                        {/* STICKY HEADER SECTION */}
                        <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent transition-all">
                             {/* Compact Search Bar */}
                             <div className="relative w-full mb-3 pt-4">
                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                 <input 
                                     autoFocus // Automatically focus this input when switching from Hero
                                     type="search" // Use search type here too
                                     placeholder="Search..." 
                                     className="w-full py-2.5 pl-10 pr-4 bg-white border border-gray-200 text-gray-800 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium text-sm" 
                                     value={searchTerm}
                                     onChange={(e) => {
                                         setSearchTerm(e.target.value);
                                         if (e.target.value) {
                                             setIsBrowsing(true);
                                             setSelectedLetter(null);
                                         }
                                     }}
                                     onKeyDown={(e) => {
                                         if (e.key === 'Enter') {
                                             e.target.blur(); // Dismiss keyboard on list search enter
                                         }
                                     }}
                                 />
                             </div>

                             {/* Controls Row */}
                             <div className="flex flex-col gap-3 mb-2">
                                  <div className="w-full">
                                     <AlphaFilter 
                                        selected={selectedLetter} 
                                        onSelect={handleLetterSelect} 
                                        browseMode={browseMode}
                                        onBrowseModeChange={setBrowseMode}
                                     />
                                  </div>
                                  <div className="w-full flex justify-between items-center">
                                     <button
                                        onClick={() => handleFilter('favorites')}
                                        className={`flex items-center px-3 py-2 rounded-lg shadow-sm text-sm font-semibold border whitespace-nowrap transition-all ${activeFilter === 'favorites' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500'}`}
                                    >
                                        <Heart className={`w-4 h-4 mr-2 ${activeFilter === 'favorites' ? 'fill-current' : ''}`} />
                                        My Saved
                                    </button>
                                     <SortControl sortBy={sortBy} onSortChange={setSortBy} />
                                  </div>
                             </div>
                             
                             <div className="mb-4">
                                <QuickFilters onFilter={handleFilter} activeFilter={activeFilter} showSaved={false} />
                             </div>
                        </div>

                        {/* SCROLLABLE LIST AREA */}
                        <div className="flex-1 min-h-[50vh]">
                            {filteredProtocols.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                                    <div className="text-xs text-gray-500 font-medium flex justify-between items-center px-1">
                                        <span>{filteredProtocols.length} results {selectedLetter && ` starting with "${selectedLetter}"`} {activeFilter === 'favorites' && '(Saved Items)'}</span>
                                    </div>
                                    {filteredProtocols.map((protocol) => (
                                        <ProtocolCard 
                                            key={protocol.id} 
                                            protocol={protocol} 
                                            onSelect={handleSelectProtocol} 
                                            onShare={handleShare}
                                            isFavorite={isFavorite(protocol.id)}
                                            onToggleFavorite={toggleFavorite}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-white rounded-2xl shadow-md border border-gray-100 mt-4">
                                    <FlaskConical className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">No results found</h3>
                                    <p className="text-gray-500 text-sm">
                                        {activeFilter === 'favorites' 
                                            ? "You haven't saved any protocols yet." 
                                            : selectedLetter 
                                                ? `No protocols found starting with "${selectedLetter}".` 
                                                : `We couldn't find any protocols matching "${searchTerm}".`}
                                    </p>
                                    {activeFilter === 'favorites' && (
                                        <button onClick={() => { setActiveFilter(null); startBrowsing(); }} className="mt-4 text-emerald-600 font-bold hover:underline">Browse All Protocols</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
                        
                         <div className="text-center">
                            <div className="mt-6">
                                {/* Hidden Saved button here since it is already in the hero */}
                                <QuickFilters onFilter={handleFilter} activeFilter={activeFilter} showSaved={false} />
                            </div>
                        </div>


                        {/* Explainer Video / Mission Section */}
                        <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="grid md:grid-cols-2">
                                <div className="bg-slate-900 p-8 flex flex-col justify-center items-center text-center text-white relative min-h-[300px]">
                                    <PlayCircle className="w-16 h-16 text-white/80 mb-4 z-20 hover:scale-110 transition-transform cursor-pointer" />
                                    <h3 className="text-xl font-bold z-20">Our Mission</h3>
                                    <p className="text-slate-300 text-sm mt-2 z-20">Watch why we built this database.</p>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                </div>
                                <div className="p-8 flex flex-col justify-center">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">The Gap in Modern Medicine</h2>
                                    <p className="text-gray-600 leading-relaxed mb-6">We are sick of seeing big pharma not do clinical trials on off-patent medicines. Promising treatments are often ignored simply because they aren't profitable.</p>
                                    <p className="text-emerald-700 leading-relaxed font-bold">We built this site to help you heal.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div 
                                    onClick={() => setShowTrustScoreInfo(!showTrustScoreInfo)}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                                >
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 flex items-center justify-center">
                                        Trust Scores 
                                        <ChevronDown className={`w-4 h-4 ml-1 text-gray-400 transition-transform ${showTrustScoreInfo ? 'rotate-180' : ''}`} />
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        We cut through the noise by separating anecdotal success from scientific validation.
                                    </p>
                                    
                                    {showTrustScoreInfo && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 text-left bg-blue-50/50 -mx-6 -mb-6 p-6 animate-in slide-in-from-top-2">
                                            <p className="text-sm text-blue-900 font-medium italic mb-2">
                                                "Anecdote is the plural of hypothesis."
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Our rating system aggregates real-world reports. While not clinical trials, these thousands of shared experiences form a powerful data set that can point the way to efficacy before science catches up.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div 
                                    onClick={handleGoToAbout}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Stethoscope className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 flex items-center justify-center">
                                        Off-Patent Focus
                                        <ChevronRight className="w-4 h-4 ml-1 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        We highlight repurposed drugs and natural compounds that the industry overlooks due to lack of patentability.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 flex items-center justify-center">
                                        Community Vetted
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Real reports from real people. Our database grows smarter with every testimonial shared.
                                    </p>
                                    
                                    <div className="relative">
                                        <select 
                                            className="w-full p-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer hover:bg-purple-100 transition-colors appearance-none text-center"
                                            defaultValue=""
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setReportIntent(e.target.value);
                                                    setIsFindingProtocolForReport(true);
                                                }
                                                e.target.value = ""; 
                                            }}
                                        >
                                            <option value="" disabled>+ Add Your Report Here</option>
                                            <option value="success">Submit Success Story</option>
                                            <option value="side-effect">Report Side Effect</option>
                                            <option value="correction">Suggest an Edit</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-700">
                                            <PlusCircle className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </>
        );
    };


    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 relative">
            <header className="max-w-xl mx-auto pb-4 mb-2 text-center">
                <button 
                    onClick={handleGoHome}
                    className="inline-flex items-center space-x-2 mb-1 hover:opacity-80 transition-opacity"
                >
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                         <HeartPulse className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight font-serif">Healing Directory</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto">
                {MainContent()}
            </main>

            {/* Protocol Finder Modal */}
            <ProtocolFinderModal 
                isOpen={isFindingProtocolForReport} 
                onClose={() => setIsFindingProtocolForReport(false)}
                protocols={protocols}
                onSelect={handleProtocolReportSelect}
                intent={reportIntent}
            />

            {/* Bulk Uploader Modal (Admin tool) */}
            <BulkUploaderModal isOpen={showUploader} onClose={() => setShowUploader(false)} />

            {notification && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center animate-in slide-in-from-bottom-4 z-50">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    <span className="text-sm font-semibold">{notification}</span>
                </div>
            )}

            <footer className="max-w-xl mx-auto mt-16 pb-8 border-t border-gray-200 text-center text-xs text-gray-400">
                 <div className="mb-4">
                    <button 
                        onClick={handleGoToAbout}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
                    >
                        About Healing Directory
                    </button>
                </div>
                
                <div className="space-y-2 max-w-lg mx-auto">
                    <p className="font-medium">The information shared on this site is for personal exploration and education only.</p>
                    <p>We honour both scientific research and real-world experiences, but nothing here is offered as medical advice.</p>
                    <p>Every body is unique — always listen to your intuition and speak with a qualified healthcare professional before beginning any new protocol, supplement, or treatment.</p>
                    <p className="font-medium">Please use this space with awareness, curiosity, and care for your own wellbeing.</p>
                </div>
                
                <div className="flex justify-center items-center mt-6 gap-2">
                    <p>User ID: <span className="font-mono bg-gray-100 p-1 rounded">{userId?.substring(0, 8)}...</span></p>
                    <button onClick={() => setShowUploader(true)} title="Admin Upload" className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-emerald-600"><Database className="w-3 h-3" /></button>
                </div>
            </footer>
        </div>
    );
};

export default App;
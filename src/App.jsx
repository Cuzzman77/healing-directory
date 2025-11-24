import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth'; 
import { getFirestore, collection, query, onSnapshot, addDoc, writeBatch, doc } from 'firebase/firestore'; 
import { Search, ExternalLink, Star, FlaskConical, ArrowLeft, Camera, BookOpen, Send, Youtube, ArrowDownCircle, ChevronDown, AlertTriangle, Share2, CheckCircle, Sparkles, Brain, Activity, Shield, Zap, HeartPulse, PlayCircle, Stethoscope, FileText, ArrowUpDown, Filter, Library, Info, PlusCircle, ChevronRight, X, Flag, Database, Upload, Heart, Bookmark, Clock, AlertOctagon, User, ShoppingBag } from 'lucide-react';

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

const formatScore = (score) => (score ? score.toFixed(1) : 'N/A');

// --- DATA TO UPLOAD ---
const DATA_TO_UPLOAD = [
    {
        title: "Dr. Lodi Anti-Parasite Protocol",
        ailment: "Parasites, Gut Health, Cancer Support",
        description: "A comprehensive polytherapy approach primarily used by individuals seeking to address pervasive parasitic infections, often in the context of chronic illness.",
        ai_overview: {
             "mood": "Comprehensive Polytherapy",
             "content": "Dr. Thomas Lodi's protocol is an all-encompassing anti-parasitic approach targeting helminths, fungus, and protozoa simultaneously. It employs a cyclic schedule (typically 3 weeks on, 1 week off) to catch dormant larvae and allow liver recovery. Users frequently report high efficacy accompanied by significant 'die-off' reactions, emphasizing the need for drainage support."
        },
        section_core: `
            <p><strong>User-Reported Dosages (Dr. Lodi Attribution):</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;">
                <li><strong>12 mg Ivermectin</strong> – Target: Helminths/Worms</li>
                <li><strong>222 mg Fenbendazole</strong> OR <strong>100 mg Mebendazole</strong> – Target: Helminths/Worms</li>
                <li><strong>600 mg Praziquantel</strong> OR <strong>Niclosamide</strong> – Target: Helminths/Worms</li>
                <li><strong>100 mg Fluconazole</strong> – Target: Fungus</li>
                <li><strong>100 mg Tinidazole</strong> OR <strong>Metronidazole</strong> – Target: Protozoa</li>
            </ul>
            <p><strong>Standard Timing:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li>Taken 3 times per day</li>
                <li>Cycle: <strong>3 weeks ON, 1 week OFF</strong></li>
            </ul>
            <p><strong>Alternative "Gentle" Timing:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li>Taken 2 times per day</li>
                <li>Cycle: <strong>5 days ON, 5 days OFF</strong></li>
                <li>Repeated for 2–6 rounds depending on tolerance</li>
            </ul>
        `,
        section_adjuncts: `
            <p><strong>Dietary Focus:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li>Uncooked whole plants (fruits, vegetables, nuts, seeds).</li>
                <li>Green-juice cleansing (celery, cucumber, kale, spinach) to support alkalinity.</li>
            </ul>
            <p><strong>Lifestyle & Support:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li><strong>Drainage:</strong> Coffee enemas or colon hydrotherapy are strongly recommended to help the body eliminate dead parasites.</li>
                <li><strong>Thyroid Support:</strong> Iodine supplementation.</li>
                <li><strong>Sleep:</strong> Melatonin is often used synergistically.</li>
            </ul>
        `,
        section_considerations: `
            <p><strong>The "Hatching" Phase:</strong></p>
            <p style="margin-bottom: 1em;">The break periods (1 week off or 5 days off) are not just for rest. They are intended to catch dormant cysts or larvae that may detect the absence of the drugs and hatch, making them vulnerable to the next round of treatment.</p>
            <p><strong>Liver Health:</strong></p>
            <p style="margin-bottom: 1em;">Because this is a polytherapy involving multiple pharmaceuticals, the off-days are crucial for allowing liver enzymes to normalize.</p>
            <p><strong>Selection:</strong></p>
            <p>Users typically choose <em>one</em> option from each category (e.g., they pick Fenbendazole <em>or</em> Mebendazole, not both).</p>
        `,
        section_cautions: `
            <p style="color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;">Red Flag: Liver Stress</p>
            <p style="margin-bottom: 1em;">Elevated liver enzymes are a risk when combining these medications. Regular blood work is highly recommended.</p>
            
            <p><strong>Common "Die-Off" (Herxheimer) Reactions:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li>Nausea, vomiting, diarrhea</li>
                <li>Stomach cramping</li>
                <li>Headache and dizziness</li>
                <li>Flu-like exhaustion</li>
            </ul>
            
            <p><strong>Drug Specifics:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em;">
                <li><strong>Praziquantel:</strong> Swallow whole; do not chew (extremely bitter). May cause heart rhythm issues in those with pre-existing conditions.</li>
                <li><strong>Metronidazole/Tinidazole:</strong> Strictly avoid alcohol while taking these, as it can cause severe nausea/vomiting.</li>
            </ul>
        `,
        anecdotal_score: 4.8, 
        scientific_score: 2.5, 
        reviews: 85,
        video_link: "https://www.youtube.com/embed/3XmGu7ZCajY",
        tags: ["Parasites", "Detox", "Ivermectin", "Fenbendazole", "Dr Lodi", "Polytherapy"],
        vendors: [
            { name: "Global Pharma", link: "#", product_trust_score: 4.2 },
            { name: "Fenben Lab", link: "#", product_trust_score: 4.8 }
        ],
        scientific_studies: [
            { title: "Safety of Triple Co-Administration (NIH)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2217668/" },
            { title: "Synergistic interaction of Praziquantel and Fenbendazole", url: "https://journals.asm.org/doi/10.1128/aac.00560-25" }
        ]
    },
    {
        title: "Joe Tippens Protocol (Fenbendazole)",
        ailment: "Cancer Support (Metabolic)",
        description: "The viral 'My Cancer Story' protocol focusing on Fenbendazole, CBD, and nutrient co-factors. Originated from a patient's personal success story with small cell lung cancer.",
        ai_overview: {
             "mood": "Metabolic & Cellular Support",
             "content": "Originated by Joe Tippens, this protocol gained massive attention for repurposing the canine dewormer Fenbendazole. It hypothesizes that Fenbendazole disrupts microtubule formation in rapidly dividing cells (similar to taxane chemotherapy) but with a milder safety profile. It is typically used as a complementary metabolic approach."
        },
        section_core: `
            <p><strong>The "Big 4" Core Components:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;">
                <li><strong>Fenbendazole:</strong> 222 mg per day (Standard canine granule packet or capsule).</li>
                <li><strong>Bio-Available Curcumin:</strong> 600 mg per day.</li>
                <li><strong>CBD Oil:</strong> 25 mg sublingual (under tongue) per day.</li>
                <li><strong>Vitamin E:</strong> 400-800 IU per day (Succinate form preferred).</li>
            </ul>
            <p><strong>Timing Pattern:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li><strong>Original Version:</strong> 3 days ON, 4 days OFF (Fenbendazole only; others daily).</li>
                <li><strong>Updated Version:</strong> 7 days a week (No off days) has become the more common standard reported by Joe Tippens later in his journey.</li>
            </ul>
        `,
        section_adjuncts: `
            <p><strong>Additional Support:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li><strong>Berberine:</strong> Often added for glucose regulation/metabolic support.</li>
                <li><strong>Quercetin:</strong> Acts as a zinc ionophore and anti-inflammatory.</li>
                <li><strong>Vitamin D3 + K2:</strong> Immune modulation.</li>
            </ul>
            <p><strong>Lifestyle:</strong></p>
            <p>Often paired with a Ketogenic or Low-Carb diet to reduce glucose availability to cancer cells (Warburg Effect).</p>
        `,
        section_considerations: `
            <p><strong>Product Form:</strong></p>
            <p style="margin-bottom: 1em;">Users typically buy Fenbendazole marketed for animals (e.g., Panacur C or Safe-Guard) or from research chemical labs (Fenben Lab) due to lack of FDA approval for human cancer use.</p>
            <p><strong>Absorption:</strong></p>
            <p>Fenbendazole is lipophilic (fat-loving). It is best taken with a meal containing healthy fats (olive oil, avocado, yogurt) to maximize absorption.</p>
        `,
        section_cautions: `
            <p style="color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;">Drug Interactions</p>
            <p style="margin-bottom: 1em;">Fenbendazole is generally well-tolerated but interacts with liver enzymes (CYP450). Consult a doctor if taking blood thinners or other chemotherapy agents.</p>
            <p><strong>Liver Enzymes:</strong></p>
            <p>Mild elevation in liver enzymes (AST/ALT) can occur. Monthly blood panels are recommended.</p>
        `,
        anecdotal_score: 4.9, 
        scientific_score: 3.1, 
        reviews: 342,
        video_link: "https://www.youtube.com/embed/hySmXmw9fSc", 
        tags: ["Cancer", "Fenbendazole", "Joe Tippens", "Metabolic", "Repurposed Drugs"],
        vendors: [
            { name: "Fenben Lab", link: "https://fenbenlab.com", product_trust_score: 4.9 },
            { name: "The Happy Healing Store", link: "#", product_trust_score: 4.5 }
        ],
        scientific_studies: [
            { title: "Fenbendazole acts as a moderate microtubule destabilizing agent (Nature)", url: "https://www.nature.com/articles/s41598-018-30158-6" },
            { title: "Antitumor effect of fenbendazole in varying 5-fluorouracil resistance", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3580766/" }
        ]
    },
    {
        title: "Cancer Protocol for Active Cancers (High Dose)",
        ailment: "Active Cancer, Parasitic Infection",
        description: "An aggressive, high-dose anti-parasitic regimen utilizing Ivermectin and Fenbendazole, specifically designed for active cases with a focus on bio-availability enhancers like DMSO.",
        ai_overview: {
             "mood": "Aggressive Polytherapy",
             "content": "This protocol is distinct for its high dosage of Ivermectin (2mg/kg) compared to standard protocols. It emphasizes 'driving' medication into cells using DMSO and strictly managing the toxic load from dying parasites using binders. It implies a strong link between parasitic load and active cancer states."
        },
        section_core: `
            <p><strong>Core Anti-Parasitic Regimen:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;">
                <li><strong>Ivermectin:</strong> 2 mg per kg of body weight. Taken <strong>6 days a week</strong>.</li>
                <li><strong>Fenbendazole:</strong> 500 mg per day. Taken <strong>6 days a week</strong>.</li>
            </ul>
            <p><strong>Maintenance (Post-Clearance):</strong></p>
            <p>Once cancer-free, users recommend continuing Ivermectin as a prophylactic:</p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em;">
                <li><strong>Dosage:</strong> 12 mg per day.</li>
                <li><strong>Frequency:</strong> 3 times per week.</li>
            </ul>
        `,
        section_adjuncts: `
            <p><strong>Bio-Availability Enhancers (Cellular Drivers):</strong></p>
            <p style="margin-bottom: 0.5em;">To drive the medication deeper into cells:</p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li><strong>DMSO:</strong> 1/4 to 1 tsp mixed with 1 TBS of pure organic aloe vera juice (for taste). Taken daily.</li>
            </ul>
            <p><strong>Essential Support & Detoxification:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li><strong>Vitamin D3 + K:</strong> 10,000 IU per day.</li>
                <li><strong>Toxin Binders:</strong> 2 tsp of micronized zeolite powder or activated charcoal daily. This is critical to eliminate toxins released by dying parasites.</li>
            </ul>
            <p><strong>Dietary Guidelines:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em;">
                <li><strong>Strictly Eliminate:</strong> All refined sugars, soft drinks, cakes, biscuits, and fruit juices.</li>
                <li><strong>Reduce:</strong> Animal products, especially cured meats.</li>
            </ul>
        `,
        section_considerations: `
            <p><strong>Sourcing Ivermectin (User Tips):</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-bottom: 1em;">
                <li>Often sourced from generic pharmacies (e.g., safegenericpharmacy.com).</li>
                <li><strong>Tip:</strong> Ignore sections asking for a script/Dr name if ordering from overseas; it is often not required for export.</li>
                <li><strong>Value:</strong> Users report bulk tabs (e.g., 500 x 12mg) offer the best value.</li>
            </ul>
            <p><strong>Sourcing Fenbendazole:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em;">
                <li>Available from suppliers like Fenbendazole Australia or animal stock/feed stores (liquid form is cheaper).</li>
            </ul>
        `,
        section_cautions: `
            <p style="color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;">Critical Warning: Toxin Release</p>
            <p style="margin-bottom: 1em;">The use of binders (Zeolite/Charcoal) is described as <strong>critical</strong> to eliminate toxins released by dying parasites. Failure to manage this toxic load can result in severe reactions.</p>
            <p><strong>High Dose Note:</strong></p>
            <p>2 mg/kg is a very high dose of Ivermectin compared to standard use. Strict medical supervision is advised.</p>
        `,
        anecdotal_score: 4.7, 
        scientific_score: 2.2, 
        reviews: 156,
        tags: ["Cancer", "Ivermectin", "Fenbendazole", "High Dose", "DMSO", "Active"],
        vendors: [
            { name: "Safe Generic Pharmacy", link: "https://www.safegenericpharmacy.com/", product_trust_score: 4.5 },
            { name: "Fenbendazole Australia", link: "https://fenbendazoleaustralia.com.au/", product_trust_score: 4.7 }
        ],
        scientific_studies: [
            { title: "Ivermectin, a potential anticancer drug (PMC)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7505114/" },
            { title: "Ivermectin: from antiviral to anticancer applications (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/36185334/" },
            { title: "Repurposing ivermectin for NSCLC (BMC Cancer)", url: "https://bmccancer.biomedcentral.com/articles/10.1186/s12885-021-09021-x" }
        ]
    },
    {
        title: "Chlorine Dioxide Solution (CDS)",
        ailment: "Systemic Pathogen Load & Biofilm",
        description: "A selective oxidant therapy using chlorine dioxide gas dissolved in water to neutralize acidic pathogens, viruses, and bacteria without triggering antibiotic resistance.",
        ai_overview: {
             "mood": "Selective Oxidative Purifier",
             "content": "CDS acts as a 'smart' molecule (ClO2) that targets acidic pathogens and anaerobic cells through oxidation, stripping them of electrons. Unlike the older 'MMS' protocol which causes frequent nausea due to reaction residues, CDS is the pure gas saturated in water (3000ppm), offering higher bioavailability and significantly fewer gastric side effects."
        },
        section_core: `
            <p><strong>Protocol C (Common Daily Protocol):</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;">
                <li style="margin-bottom: 0.3em;"><strong>Preparation:</strong> Add <strong>10ml</strong> of CDS concentrate (3000ppm) to <strong>1 Liter</strong> of water.</li>
                <li style="margin-bottom: 0.3em;"><strong>Dosage:</strong> Drink roughly <strong>100ml every hour</strong> for 10 hours throughout the day.</li>
                <li style="margin-bottom: 0.3em;"><strong>Acute Infection:</strong> Dosage can be safely increased to 20ml or 30ml of CDS per Liter of water if well tolerated, taken in shorter intervals.</li>
            </ul>
        `,
        section_adjuncts: `
            <p><strong>Bio-Availability & Support:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;">
                <li style="margin-bottom: 0.3em;"><strong>DMSO (Dimethyl Sulfoxide):</strong> Adding 3ml-5ml of 70% DMSO to the 1L bottle can help the ClO2 penetrate deeper into tissues and cysts.</li>
                <li style="margin-bottom: 0.3em;"><strong>Isotonic Water:</strong> Mixing CDS with diluted sea water (isotonic) instead of plain water can improve electrolyte balance during the detox.</li>
                <li style="margin-bottom: 0.3em;"><strong>Binder Support:</strong> Zeolite or Bentonite clay (taken 2 hours apart) can help mop up endotoxins released by dying pathogens.</li>
            </ul>
        `,
        section_considerations: `
            <p><strong>Critical Storage & Handling:</strong></p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;">
                <li style="margin-bottom: 0.3em;"><strong>Temperature Sensitive:</strong> Keep the 3000ppm concentrate refrigerated (below 11°C). Above this temperature, the gas evaporates, reducing potency.</li>
                <li style="margin-bottom: 0.3em;"><strong>UV Sensitive:</strong> Store in amber glass bottles. Light degrades the molecule rapidly.</li>
                <li style="margin-bottom: 0.3em;"><strong>The 'Antioxidant Gap':</strong> Vitamin C, coffee, alcohol, and antioxidant supplements neutralize Chlorine Dioxide. You must separate them by at least <strong>2 to 4 hours</strong> from your CDS doses.</li>
            </ul>
        `,
        section_cautions: `
            <p style="color: #b91c1c; font-weight: bold; margin-bottom: 0.5em;">WARNING: Lung Irritant</p>
            <p>Do not inhale the gas directly from the concentrate bottle.</p>
            <ul style="list-style: disc; margin-left: 1.5em; padding-left: 0.5em; margin-top: 0.5em; margin-bottom: 1em; line-height: 1.4;">
                <li style="margin-bottom: 0.3em;"><strong>Herxheimer Reaction:</strong> Rapid pathogen die-off can cause fatigue, nausea, or diarrhea. If this occurs, reduce the dose by 50% the next day; do not stop completely.</li>
                <li style="margin-bottom: 0.3em;"><strong>Material Reactivity:</strong> Never use metal containers or spoons. ClO2 reacts with metal. Use glass or HDPE plastic.</li>
                <li style="margin-bottom: 0.3em;"><strong>Contraindications:</strong> Caution is advised for those on strong blood thinners (CDS increases microcirculation) or those with G6PD deficiency (rare).</li>
            </ul>
        `,
        anecdotal_score: 4.8,
        scientific_score: 1.8,
        reviews: 12500,
        video_link: null,
        tags: [
          "Oxidative Therapy",
          "Detox",
          "Antiviral",
          "Andreas Kalcker",
          "Water Purification"
        ],
        vendors: [
          {
            "name": "Aquarius Pro Life (Europe)",
            "link": "https://www.aquarius-prolife.com",
            "product_trust_score": 4.7
          },
          {
            "name": "KV Lab (Reagents)",
            "link": "https://www.kvlab.com",
            "product_trust_score": 4.5
          }
        ],
        scientific_studies: [
          {
            "title": "Chlorine dioxide is a more potent antiviral agent against SARS-CoV-2 than sodium hypochlorite",
            "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8442261/"
          },
          {
            "title": "Clarifying the Science of Chlorine Dioxide Solution (CDS): Evidence for Medical Use",
            "url": "https://ijmra.in/v8i3/54.php"
          }
        ]
    }
];

// --- HELPER HOOKS ---
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

// --- HELPER: Share Functionality ---
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

// --- COMPONENTS ---

const AccordionSection = ({ title, content, icon: Icon, defaultOpen = false, isWarning = false, children, headerContent }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (!content) return null;

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
                const docRef = doc(collection(db, COLLECTION_NAME));
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
        <div className="flex items-center justify-end mb-4">
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-xs font-medium text-gray-500 mr-2">Sort by:</span>
                <select 
                    value={sortBy} 
                    onChange={(e) => onSortChange(e.target.value)}
                    className="text-sm font-bold text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                >
                    <option value="rating">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                    <option value="alpha">A–Z</option>
                </select>
            </div>
        </div>
    );
};

const AlphaFilter = ({ selected, onSelect }) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-colors border shadow-sm`}
                style={{ 
                    backgroundColor: (isOpen || selected) ? '#059669' : 'white', // Emerald-600
                    color: (isOpen || selected) ? 'white' : '#065f46', // Emerald-800
                    borderColor: (isOpen || selected) ? '#059669' : '#e5e7eb' 
                }}
            >
                <div className="flex items-center">
                    <Library className="w-4 h-4 mr-2" />
                    {selected ? `Filter: ${selected}` : "Browse A–Z Catalogue"}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center bg-white p-4 rounded-xl shadow-lg border border-gray-100 animate-in slide-in-from-top-2">
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
            )}
        </div>
    )
}

const ProtocolCard = ({ protocol, onSelect, onShare, isFavorite, onToggleFavorite }) => {
    return (
        <div 
            className="bg-white p-5 sm:p-6 shadow-md rounded-2xl transition-all duration-300 border border-gray-100 cursor-pointer active:scale-[0.98] hover:shadow-xl hover:border-emerald-100 relative group animate-in slide-in-from-bottom-4 fade-in duration-500"
            onClick={() => onSelect(protocol.id)}
        >
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-extrabold text-gray-800 pr-16 group-hover:text-emerald-700 transition-colors">{protocol.title}</h2>
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
            <p className="text-gray-500 mb-4 text-sm line-clamp-2 leading-relaxed">{protocol.description}</p>

            <div className="flex justify-between items-center text-xs font-medium pt-3 border-t border-gray-50">
                <div className="flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md">
                    <Star className="w-3.5 h-3.5 mr-1 fill-green-500 text-green-500" />
                    {formatScore(protocol.anecdotal_score || 0)}
                </div>
                <div className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                    <FlaskConical className="w-3.5 h-3.5 mr-1 text-blue-500" />
                    {formatScore(protocol.scientific_score || 0)}
                </div>
                <span className="text-gray-400">{(protocol.reviews || 0).toLocaleString()} Reports</span>
            </div>
        </div>
    );
};

const ScientificLiteratureButton = ({ protocol }) => {
    const [isOpen, setIsOpen] = useState(false);
    const studies = protocol.scientific_studies || (protocol.scientific_link ? [{ title: "View Scientific Literature", url: protocol.scientific_link }] : []);
    const panelId = `scientific-panel-${protocol.id}`;

    // Common classes for all button states to align borders
    // Added min-h to ensure it matches the left button height if text wraps
    const buttonBaseClass = "w-[calc(100%+2px)] -ml-[1px] -mr-[1px] -mb-[1px] py-3 px-2 text-[10px] sm:text-xs font-bold flex justify-center items-center transition duration-150 relative z-10 min-h-[42px]";
    
    // Always round the bottom right, never the bottom left (since it's side-by-side)
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

    // Helper to scroll to vendors
    const scrollToVendors = () => {
        const element = document.getElementById('vendors-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper: Extract Video ID and format as Embed URL
    const getEmbedUrl = (url) => {
        if (!url) return null;
        
        // TRIM WHITESPACE to prevent copy-paste errors from breaking the link
        const cleanUrl = url.trim();

        // Regex updated to handle /shorts/ URLs
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

    // Auto-scroll effect if requested via props
    useEffect(() => {
        if (scrollToTestimonialsOnMount) {
            // Small delay to ensure DOM is fully rendered
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
            case 'already': return <p className="text-gray-600 font-semibold">You’ve already shared your experience on this protocol. Thank you for contributing to the community data.</p>;
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
                {/* Anecdotal Score (Left Half - 50% Width) */}
                <div className="flex flex-col bg-green-50 border-r border-green-100 rounded-l-xl min-w-0">
                    <div className="py-3 px-1 flex flex-col items-center justify-center flex-grow">
                        <div className="flex items-center text-lg sm:text-xl font-extrabold text-green-700">
                            <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-1 fill-yellow-400 text-yellow-400" />
                            {formatScore(protocol.anecdotal_score || 0)}/5
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-green-700 font-bold uppercase tracking-wide mt-0.5 text-center">Anecdotal Score</p>
                        <p className="text-[9px] sm:text-[10px] text-green-600 font-medium text-center leading-tight">{(protocol.reviews || 0).toLocaleString()} Reports</p>
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

                {/* Scientific Score (Right Half - 50% Width) */}
                <div className="flex flex-col bg-blue-50 rounded-r-xl min-w-0">
                    <div className="py-3 px-1 flex flex-col items-center justify-center flex-grow">
                        <div className="flex items-center text-lg sm:text-xl font-extrabold text-blue-700">
                            <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-blue-500" />
                            {formatScore(protocol.scientific_score || 0)}/5
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-blue-700 font-bold uppercase tracking-wide mt-0.5 text-center">Scientific Score</p>
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
        <div className="flex overflow-x-auto space-x-3 py-2 px-1 scrollbar-hide mb-4 justify-center">
            {filters.map((f) => (
                <button
                    key={f.name}
                    onClick={() => onFilter(f.name)}
                    className={`flex items-center px-4 py-2 rounded-full shadow-sm text-sm font-semibold border whitespace-nowrap transition-all ${activeFilter === f.name ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200'}`}
                >
                    <f.icon className={`w-4 h-4 mr-2 ${activeFilter === f.name ? 'text-white' : 'text-emerald-500'}`} />
                    {f.name}
                </button>
            ))}
            
            {/* My Saved Button - Conditionally Rendered */}
            {showSaved && (
                <button
                    onClick={() => onFilter('favorites')}
                    className={`flex items-center px-4 py-2 rounded-full shadow-sm text-sm font-semibold border whitespace-nowrap transition-all ${activeFilter === 'favorites' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500'}`}
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
    const [isBrowsing, setIsBrowsing] = useState(false); 
    const [sortBy, setSortBy] = useState('rating'); 
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
      window.history.pushState(null, '', '/');
      window.scrollTo(0, 0);
    }, []);
    
    const handleGoHome = useCallback(() => {
      setSelectedProtocolId(null);
      setSearchTerm('');
      setHeroSearchTerm(''); // Clear hero search too
      setSelectedLetter(null);
      setIsBrowsing(false);
      setSortBy('rating');
      setShowAboutPage(false);
      setActiveFilter(null);
      setReportIntent(null); // Clear intent when going home
      window.history.pushState(null, '', '/');
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
      window.history.pushState(null, '', '/about');
    }, []);
    

    const handleProtocolReportSelect = useCallback((id) => {
        setSelectedProtocolId(id);
        setIsFindingProtocolForReport(false);
        // Don't clear reportIntent here so we can use it to scroll in ProtocolDetailPage
        window.history.pushState(null, '', `/protocol/${id}`);
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
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
                const title = (protocol.title || '').toUpperCase();
                return title.startsWith(selectedLetter);
            });
        } else if (isBrowsing) {
             results = [...protocols];
        }

        const sorted = [...results];
        switch (sortBy) {
            case 'rating':
                return sorted.sort((a, b) => (b.anecdotal_score || 0) - (a.anecdotal_score || 0));
            case 'popular':
                 return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
            case 'alpha':
                 return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            default:
                return sorted;
        }
    }, [protocols, searchTerm, selectedLetter, isBrowsing, sortBy, activeFilter, favorites]);

    const handleSelectProtocol = useCallback((id) => {
      setSelectedProtocolId(id);
      window.history.pushState(null, '', `/protocol/${id}`);
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
                setIsBrowsing(false); // Keep user on home for tag click or switch? Usually filter implies list view.
                // Let's force list view for tags
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
             setSortBy('rating'); 
        }
    }, []);

    const startBrowsing = useCallback(() => {
        setIsBrowsing(true);
        setSearchTerm('');
        setHeroSearchTerm('');
        setSelectedLetter(null);
        setActiveFilter(null);
        setShowAboutPage(false);
        setSortBy('rating'); 
    }, []);
    
    // New function to handle Hero Search Enter Key
    const handleHeroSearchSubmit = (e) => {
        if (e.key === 'Enter' && heroSearchTerm.trim()) {
            setSearchTerm(heroSearchTerm); // Pass term to main search
            setIsBrowsing(true); // Switch view
            setSelectedLetter(null);
            setActiveFilter(null);
        }
    };

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
                          // You can add a background pattern here or image
                          backgroundImage: 'url("hero background.jpg")',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                      }}
                >
                    {/* Switched overlay back to Teal at 30% opacity */}
                    <div className="absolute inset-0 bg-teal-900/30 backdrop-blur-[1px] rounded-3xl"></div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/20">
                                <HeartPulse className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight font-serif">
                            Healing Directory
                        </h1>
                        
                        <p className="text-emerald-50 mb-4 text-sm sm:text-base font-medium max-w-lg mx-auto">
                            Currently tracking <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">{protocols.length}</span> off-patent protocols.
                        </p>

                        <p className="text-emerald-100 mb-8 text-sm sm:text-base font-medium max-w-lg mx-auto">
                             Bridging the gap between anecdotal success and scientific validation.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
                            <div className="relative w-full shadow-2xl">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search for ailments, drugs, or protocols..." 
                                    className="w-full py-4 pl-12 pr-4 bg-white text-gray-800 rounded-xl shadow-lg focus:ring-4 focus:ring-teal-400/50 focus:outline-none transition-all font-medium" 
                                    value={heroSearchTerm}
                                    onChange={(e) => setHeroSearchTerm(e.target.value)}
                                    onKeyDown={handleHeroSearchSubmit}
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
                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                 <input 
                                     autoFocus // Automatically focus this input when switching from Hero
                                     type="text" 
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
                                 />
                             </div>

                             {/* Controls Row */}
                             <div className="flex flex-col gap-3 mb-2">
                                  <div className="w-full">
                                     <AlphaFilter selected={selectedLetter} onSelect={handleLetterSelect} />
                                  </div>
                                  <div className="w-full flex justify-between items-center">
                                     <button
                                        onClick={() => onFilter('favorites')}
                                        className={`flex items-center px-4 py-2 rounded-full shadow-sm text-sm font-semibold border whitespace-nowrap transition-all ${activeFilter === 'favorites' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500'}`}
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
                        onClick={() => alert("To sign out, check console.")}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
                    >
                        Sign Out / Reset
                    </button>
                    <button 
                        onClick={handleGoToAbout}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold transition-colors ml-4"
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
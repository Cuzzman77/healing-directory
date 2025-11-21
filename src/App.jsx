import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { Search, ExternalLink, Star, FlaskConical, ArrowLeft, Camera, BookOpen, Send, Youtube, ArrowDownCircle, ChevronDown, AlertTriangle, Share2, CheckCircle, Sparkles, Brain, Activity, Shield, Zap, HeartPulse, PlayCircle, Stethoscope, FileText, ArrowUpDown, Filter, Library, Info, PlusCircle, ChevronRight, X, Flag } from 'lucide-react';

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
const db = getFirestore(app); // Global DB instance
const auth = getAuth(app);

// Collection Name
const COLLECTION_NAME = "protocols"; 

const formatScore = (score) => (score ? score.toFixed(1) : 'N/A');

// --- HELPER: Share Functionality ---
const shareProtocol = async (protocol) => {
    if (!protocol) return null;
    
    const shareData = {
        title: protocol.title,
        text: `Check out this healing protocol: ${protocol.title}\n${protocol.description}`,
        url: window.location.href 
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return 'shared'; 
        } else {
            await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
            return 'copied'; 
        }
    } catch (err) {
        console.error("Share failed:", err);
        return 'error';
    }
};

// --- COMPONENTS ---

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
        'correction': 'Suggest Correction'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-800">Find Protocol</h3>
                        <p className="text-xs text-gray-500">Select the protocol to {intentLabels[intent] || 'report on'}</p>
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
                            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg transition-colors flex justify-between items-center group"
                                >
                                    <span className="font-medium text-gray-700 group-hover:text-indigo-700">{p.title}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
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
        <button onClick={onBack} className="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 mb-8 p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Directory
        </button>
        
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-6 mx-auto">
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

                <div className="bg-indigo-50 p-6 rounded-xl border-l-4 border-indigo-500 my-8">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">The Result?</h3>
                    <p className="text-indigo-800">
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
                    By using our <strong>Trust Scores</strong>, we help you navigate the noise. We don't just show you what's "approved"—we show you what people are actually using to heal, backed by whatever scientific evidence exists, regardless of profitability.
                </p>
            </div>
        </div>
    </div>
);

const SortControl = ({ sortBy, onSortChange }) => {
    return (
        <div className="flex items-center justify-end">
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5">
                <ArrowUpDown className="w-3 h-3 text-gray-500 mr-2" />
                <span className="text-xs font-medium text-gray-500 mr-2">Sort:</span>
                <select 
                    value={sortBy} 
                    onChange={(e) => onSortChange(e.target.value)}
                    className="text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
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
        <div className="w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-colors border shadow-sm ${isOpen || selected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
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
                         className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 border ${!selected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'}`}
                    >
                        ALL
                    </button>
                    {alphabet.map(char => (
                        <button
                            key={char}
                            onClick={() => { onSelect(char); setIsOpen(false); }}
                            className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-lg transition-all duration-200 border ${selected === char ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'}`}
                        >
                            {char}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

const ProtocolCard = ({ protocol, onSelect, onShare }) => {
    return (
        <div 
            className="bg-white p-5 sm:p-6 shadow-md rounded-2xl transition-all duration-300 border border-gray-100 cursor-pointer active:scale-[0.98] hover:shadow-xl hover:border-indigo-100 relative group animate-in slide-in-from-bottom-4 fade-in duration-500"
            onClick={() => onSelect(protocol.id)}
        >
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-extrabold text-gray-800 pr-10 group-hover:text-indigo-700 transition-colors">{protocol.title}</h2>
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onShare(protocol);
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Share Protocol"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
            <p className="text-gray-500 mb-4 text-sm line-clamp-2 leading-relaxed">{protocol.description}</p>

            <div className="flex justify-between items-center text-xs font-medium pt-3 border-t border-gray-50">
                <div className="flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md">
                    <Star className="w-3.5 h-3.5 mr-1 fill-green-500 text-green-500" />
                    {formatScore(protocol.anecdotal_score)}
                </div>
                <div className="flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                    <FlaskConical className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                    {formatScore(protocol.scientific_score)}
                </div>
                <span className="text-gray-400">{protocol.reviews?.toLocaleString() || 0} Reports</span>
            </div>
        </div>
    );
};

const ScientificLiteratureButton = ({ protocol }) => {
    const [isOpen, setIsOpen] = useState(false);
    const studies = protocol.scientific_studies || (protocol.scientific_link ? [{ title: "View Scientific Literature", url: protocol.scientific_link }] : []);

    if (studies.length === 0) {
        return (
            <button disabled className="w-full py-2 px-3 bg-gray-200 text-gray-400 font-bold text-xs sm:text-sm rounded-lg cursor-not-allowed flex justify-center items-center">
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
                className="w-full py-2 px-3 bg-pink-600 text-white font-bold text-xs sm:text-sm rounded-lg hover:bg-pink-700 transition duration-150 shadow-sm flex justify-center items-center"
            >
                <BookOpen className="w-4 h-4 mr-1 sm:mr-2" />
                View Scientific Literature
            </a>
        );
    }

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-2 px-3 bg-pink-600 text-white font-bold text-xs sm:text-sm rounded-lg hover:bg-pink-700 transition duration-150 shadow-sm flex justify-between items-center"
            >
                <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1 sm:mr-2" />
                    Scientific Literature ({studies.length})
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-pink-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {studies.map((study, index) => (
                        <a
                            key={index}
                            href={study.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-3 text-xs sm:text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-900 border-b border-gray-100 last:border-0 text-left transition-colors"
                        >
                            {study.title || `Study #${index + 1}`}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const AISynthesis = ({ protocol }) => {
    // MODIFIED: Initial state is now CLOSED (false)
    const [isOpen, setIsOpen] = useState(false);
    const score = protocol.anecdotal_score || 0;
    const reviews = protocol.reviews || 0;
    const studies = protocol.scientific_studies?.length || 0;

    // AI Logic: More anecdotal success -> More positive tone
    const synthesis = useMemo(() => {
        let content = [];
        let mood = '';

        if (studies > 0) {
            mood = 'Based on current data, this protocol has some preliminary scientific footing:';
            content.push(<p key="science" className="text-sm font-medium text-gray-800">
                The protocol has **{studies} related scientific studies** available for review.
            </p>);
        } else {
            mood = 'The data for this protocol is currently driven by community reports only. Remember:';
            content.push(<p key="anecdote" className="text-sm font-medium text-gray-800 italic">
                "Anecdote is the plural of hypothesis."
            </p>);
        }
        
        if (score >= 4.5 && reviews > 500) {
            content.push(<p key="positive" className="text-base text-green-700 font-bold mt-2">
                COMMUNITY OUTLOOK: This protocol shows **extremely high promise** according to thousands of real-world experiences ({reviews.toLocaleString()} reports). The consistently positive anecdotal results suggest strong efficacy for some users.
            </p>);
        } else if (score >= 3.5) {
            content.push(<p key="moderate" className="text-base text-amber-700 font-bold mt-2">
                COMMUNITY OUTLOOK: This is a **moderately well-received** protocol. It has shown solid success in many users, but caution is warranted ({reviews.toLocaleString()} reports).
            </p>);
        } else {
            content.push(<p key="cautious" className="text-base text-red-700 font-bold mt-2">
                COMMUNITY OUTLOOK: This protocol has mixed or limited community reports ({reviews.toLocaleString()} reports). Proceed with caution and consult a practitioner.
            </p>);
        }

        return { mood, content };
    }, [score, studies, reviews]);

    return (
         <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-indigo-50 hover:bg-indigo-100 flex justify-between items-center transition duration-150"
            >
                <div className="flex items-center">
                    <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
                    <h3 className="text-lg font-bold text-gray-800">AI Overview</h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200 space-y-3">
                    <p className="text-gray-700 text-sm">{synthesis.mood}</p>
                    {synthesis.content}
                </div>
            )}
        </div>
    );
};


const SideEffectsAccordion = ({ sideEffects }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!sideEffects || (!sideEffects.common?.length && !sideEffects.less_common?.length)) return null;

    return (
        <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition duration-150"
            >
                <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                    <h3 className="text-lg font-bold text-gray-800">Possible Side Effects</h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">
                    {sideEffects.common && sideEffects.common.length > 0 && (
                        <div className="mb-5 last:mb-0">
                            <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider border-b pb-1 border-gray-100">Common Side Effects</h4>
                            <ul className="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                                {sideEffects.common.map((effect, idx) => <li key={idx}>{effect}</li>)}
                            </ul>
                        </div>
                    )}
                    {sideEffects.less_common && sideEffects.less_common.length > 0 && (
                        <div className="mb-0">
                            <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider border-b pb-1 border-gray-100">Less Common Side Effects</h4>
                            <ul className="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                                {sideEffects.less_common.map((effect, idx) => <li key={idx}>{effect}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ProtocolDetailPage = ({ protocol, onBack, onShare, db, userId, appId }) => {
    const [testimonialText, setTestimonialText] = useState('');
    const [testimonialScore, setTestimonialScore] = useState(5); 
    const [submissionStatus, setSubmissionStatus] = useState(null); 
    const [testimonials, setTestimonials] = useState([]);

    // Real-time fetch for testimonials of this specific protocol
    useEffect(() => {
        if (!protocol?.id) return;
        const testimonialsRef = collection(db, `${COLLECTION_NAME}/${protocol.id}/testimonials`);
        const q = query(testimonialsRef);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTestimonials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (fetchedTestimonials.length > 0) {
                setTestimonials(fetchedTestimonials);
            } else {
                setTestimonials(protocol.testimonials || []);
            }
        });
        return () => unsubscribe();
    }, [protocol?.id]);

    if (!protocol) return null;

    const scrollToTestimonials = () => {
        const element = document.getElementById('testimonials-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmitTestimonial = async () => {
        if (!testimonialText || !userId) {
            setSubmissionStatus('error');
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
            });
            setSubmissionStatus('success');
            setTestimonialText('');
            setTimeout(() => setSubmissionStatus(null), 3000); 
        } catch (error) {
            console.error("Error submitting:", error);
            setSubmissionStatus('error');
            setTimeout(() => setSubmissionStatus(null), 5000); 
        }
    };

    const handleSuggestCorrection = () => {
        // In a real app, this would open a modal or redirect to a contact form
        alert("Correction suggestions coming soon! This will link to a feedback form.");
    };

    const StatusMessage = ({ status }) => {
        switch (status) {
            case 'loading': return <p className="text-indigo-600 font-semibold flex items-center">Submitting...</p>;
            case 'success': return <p className="text-green-600 font-semibold">Thank you for your review!</p>;
            case 'error': return <p className="text-red-600 font-semibold">Submission failed.</p>;
            default: return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-2xl min-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Directory
                </button>
                <button onClick={() => onShare(protocol)} className="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{protocol.title}</h1>
            <p className="text-lg text-indigo-600 font-semibold mb-4">Target Ailment: {protocol.ailment}</p>
            
            <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg text-sm font-medium">
                <p className="font-bold">AD SPOT 2 (Protocol Detail):</p>
                <p>High-value ad placement focused on products relevant to this specific protocol.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col items-center p-4 bg-green-50 rounded-xl h-full justify-center border border-green-100">
                        <div className="flex items-center text-2xl font-bold text-green-700">
                            <Star className="w-6 h-6 mr-1 fill-yellow-400 text-yellow-400" />
                            {formatScore(protocol.anecdotal_score)}/5
                        </div>
                        <p className="text-xs text-green-600 font-semibold mt-1 text-center">Anecdotal Trust Score</p>
                        <p className="text-xs text-green-500 mt-0.5">{protocol.reviews?.toLocaleString() || 0} Reports</p>
                    </div>
                    <button onClick={scrollToTestimonials} className="w-full py-2 px-3 bg-green-600 text-white font-bold text-xs sm:text-sm rounded-lg hover:bg-green-700 transition duration-150 shadow-sm flex justify-center items-center">
                        <ArrowDownCircle className="w-4 h-4 mr-1 sm:mr-2" /> View Anecdotal Evidence
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-xl h-full justify-center border border-indigo-100">
                        <div className="flex items-center text-2xl font-bold text-indigo-700">
                            <FlaskConical className="w-6 h-6 mr-1 text-indigo-500" />
                            {formatScore(protocol.scientific_score)}/5
                        </div>
                        <p className="text-xs text-indigo-600 font-semibold mt-1 text-center">Scientific Evidence Score</p>
                    </div>
                    <ScientificLiteratureButton protocol={protocol} />
                </div>
            </div>

            {/* NEW: AI Synthesis Dropdown */}
            <AISynthesis protocol={protocol} />
            
            {protocol.video_link && (
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                        <Youtube className="w-6 h-6 mr-2 text-red-500" /> Video Overview
                    </h3>
                    <div className="relative overflow-hidden rounded-xl shadow-xl" style={{ paddingTop: '56.25%' }}>
                        <iframe className="absolute top-0 left-0 w-full h-full" src={protocol.video_link} title={`Video guide for ${protocol.title}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                </section>
            )}

            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Full Protocol Details</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">{protocol.full_detail}</p>
            </div>

            <SideEffectsAccordion sideEffects={protocol.side_effects} />

            <section className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Where to Buy (Vendor Trust)</h3>
                <div className="space-y-3">
                    {protocol.vendors?.map((vendor, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex-grow"><p className="font-semibold text-gray-800">{vendor.name}</p></div>
                            <div className="flex items-center space-x-3">
                                <span className="flex items-center text-sm font-bold text-indigo-700 whitespace-nowrap"><Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />{formatScore(vendor.product_trust_score)}/5</span>
                                <a href={vendor.link || '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition duration-150 flex items-center">Buy Now</a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="testimonials-section" className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Protocol Testimonials</h3>
                <div className="p-4 mb-6 border border-indigo-200 rounded-xl bg-indigo-50">
                    <h4 className="font-bold text-indigo-700 mb-2">Share Your Experience</h4>
                    <textarea rows="3" placeholder="Write your testimonial here..." className="w-full p-2 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm mb-2" value={testimonialText} onChange={(e) => setTestimonialText(e.target.value)} disabled={submissionStatus === 'loading'}></textarea>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center space-x-4">
                             <label className="text-sm text-indigo-700 font-medium">Score:</label>
                             <select value={testimonialScore} onChange={(e) => setTestimonialScore(Number(e.target.value))} className="p-1 border border-indigo-300 rounded-md text-sm" disabled={submissionStatus === 'loading'}>
                                 {[5, 4, 3, 2, 1].map(score => <option key={score} value={score}>{score} Star</option>)}
                             </select>
                        </div>
                        <button className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition ${testimonialText && submissionStatus !== 'loading' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} onClick={handleSubmitTestimonial} disabled={!testimonialText || submissionStatus === 'loading'}>
                             {submissionStatus === 'loading' ? 'Sending...' : 'Submit Review'} <Send className="w-4 h-4 ml-2" />
                        </button>
                        <StatusMessage status={submissionStatus} />
                    </div>
                    <div className="mt-3 text-center">
                         <button onClick={handleSuggestCorrection} className="text-xs text-gray-400 hover:text-indigo-600 underline transition-colors flex items-center justify-center mx-auto">
                            <Flag className="w-3 h-3 mr-1" /> Suggest an edit or correction
                         </button>
                    </div>
                </div>
                {testimonials.length > 0 ? testimonials.map(t => (
                    <div key={t.id} className="border-b border-gray-100 pb-3 mb-3">
                        <div className="flex items-center justify-between text-sm"><span className="font-semibold text-gray-800">{t.user}</span><span className="text-gray-500 text-xs">{t.date}</span></div>
                        <p className="text-gray-700 mt-1 text-sm">{t.text}</p>
                        <div className="flex items-center mt-1"><span className="text-yellow-500 mr-2 text-xs">{'★'.repeat(Math.floor(t.score))} ({formatScore(t.score)})</span>{t.photo && <span className="text-xs text-green-600 flex items-center"><Camera className="w-3 h-3 mr-0.5" /> Photo Verified</span>}</div>
                    </div>
                )) : (
                    <p className="text-gray-500 italic text-sm text-center py-4">No testimonials yet. Be the first to share your experience!</p>
                )}
            </section>
        </div>
    );
};

// Helper: Quick Filter Tags
const QuickFilters = ({ onFilter }) => {
    const filters = [
        { name: "Brain Health", icon: Brain },
        { name: "Immunity", icon: Shield },
        { name: "Detox", icon: Sparkles },
        { name: "Energy", icon: Zap },
        { name: "Gut Health", icon: Activity },
    ];

    return (
        <div className="flex overflow-x-auto space-x-3 py-2 px-1 scrollbar-hide mb-6 justify-center">
            {filters.map((f) => (
                <button
                    key={f.name}
                    onClick={() => onFilter(f.name)}
                    className="flex items-center px-4 py-2 bg-white text-indigo-700 rounded-full shadow-sm text-sm font-semibold border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 whitespace-nowrap transition-all"
                >
                    <f.icon className="w-4 h-4 mr-2 text-indigo-500" />
                    {f.name}
                </button>
            ))}
        </div>
    );
};


// Main Application Component
const App = () => {
    const [protocols, setProtocols] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLetter, setSelectedLetter] = useState(null); 
    const [isBrowsing, setIsBrowsing] = useState(false); 
    const [sortBy, setSortBy] = useState('rating'); 
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [selectedProtocolId, setSelectedProtocolId] = useState(null);
    const [notification, setNotification] = useState(null);
    
    // NEW STATES
    const [showTrustScoreInfo, setShowTrustScoreInfo] = useState(false);
    const [showAboutPage, setShowAboutPage] = useState(false);
    const [reportIntent, setReportIntent] = useState(null); 
    const [isFindingProtocolForReport, setIsFindingProtocolForReport] = useState(false);


    const handleShare = useCallback(async (protocol) => {
        const result = await shareProtocol(protocol);
        if (result === 'copied') {
            setNotification("Link copied to clipboard!");
            setTimeout(() => setNotification(null), 3000);
        }
    }, []);

    const handleGoHome = useCallback(() => {
        setSelectedProtocolId(null);
        setSearchTerm('');
        setSelectedLetter(null);
        setIsBrowsing(false);
        setSortBy('rating'); 
        setShowAboutPage(false);
        window.scrollTo(0, 0);
    }, []);

    const handleGoToAbout = useCallback(() => {
        setShowAboutPage(true);
        window.scrollTo(0, 0);
    }, []);

    const handleProtocolReportSelect = useCallback((id) => {
        setSelectedProtocolId(id);
        setIsFindingProtocolForReport(false);
        setReportIntent(null);
        window.scrollTo(0, 0);
    }, []);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    const anonymousUser = await signInAnonymously(auth);
                    setUserId(anonymousUser.user.uid);
                } catch (error) {
                    console.error("Auth Error:", error);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Protocols
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

    // --- SORT & FILTER LOGIC ---
    const filteredProtocols = useMemo(() => {
        let results = [];

        if (searchTerm) {
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
    }, [protocols, searchTerm, selectedLetter, isBrowsing, sortBy]);

    const handleSelectProtocol = useCallback((id) => {
        setSelectedProtocolId(id);
        window.scrollTo(0, 0); 
    }, []);

    const handleBack = useCallback(() => {
        setSelectedProtocolId(null);
        window.scrollTo(0, 0);
    }, []);

    const handleFilter = useCallback((tag) => {
        setSearchTerm(tag);
        setSelectedLetter(null);
        setIsBrowsing(false);
        setShowAboutPage(false);
    }, []);

    const handleLetterSelect = useCallback((letter) => {
        setSelectedLetter(letter);
        setSearchTerm('');
        setIsBrowsing(true);
        setShowAboutPage(false);
        if (letter === null) { 
             setSortBy('rating'); 
        }
    }, []);

    const startBrowsing = useCallback(() => {
        setIsBrowsing(true);
        setSearchTerm('');
        setSelectedLetter(null);
        setShowAboutPage(false);
        setSortBy('rating'); 
    }, []);
    
    const currentProtocol = useMemo(() => {
        return protocols.find(p => p.id === selectedProtocolId);
    }, [protocols, selectedProtocolId]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <p className="text-xl text-indigo-600 animate-pulse">Loading Healing Directory Database...</p>
            </div>
        );
    }

    const MainContent = () => {
        if (showAboutPage) {
            return <AboutPage onBack={handleGoHome} />;
        }

        if (selectedProtocolId && currentProtocol) {
            return <ProtocolDetailPage protocol={currentProtocol} onBack={handleBack} onShare={handleShare} db={db} userId={userId} appId={firebaseConfig.appId} />;
        }

        return (
            <>
                {/* Hero / Search Section */}
                {!(searchTerm || isBrowsing) && (
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-xl overflow-hidden"
                     style={{ 
                         // Placeholder image of a blurred crowd
                         backgroundImage: 'url(/crowd_blurred.jpg)',
                         backgroundSize: 'cover',
                         backgroundPosition: 'center',
                     }}
                >
                    {/* Dark overlay for contrast and blur filter */}
                    <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-[4px] rounded-3xl"></div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <HeartPulse className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
                            Healing Directory
                        </h1>
                        <p className="text-indigo-100 mb-8 text-sm sm:text-base font-medium max-w-lg mx-auto">
                             We are bridging the gap between anecdotal success and scientific validation to help you heal.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for ailments, drugs, or protocols..."
                                    className="w-full py-4 pl-12 pr-4 bg-white text-gray-800 rounded-xl shadow-lg focus:ring-4 focus:ring-indigo-400/50 focus:outline-none transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (e.target.value) {
                                            setIsBrowsing(true);
                                            setSelectedLetter(null);
                                        } else if (!selectedLetter) {
                                            setIsBrowsing(false);
                                        }
                                    }}
                                />
                            </div>
                            {/* Decoy Button for Visual Balance */}
                            <div className="hidden sm:block">
                                <div className="px-6 py-4 bg-indigo-500/30 border border-indigo-400/30 text-indigo-100 font-bold rounded-xl cursor-default select-none">
                                    Explore
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Conditionally render Results */}
                {(searchTerm || isBrowsing) ? (
                    <div className="flex flex-col h-full">
                        
                        {/* STICKY HEADER SECTION */}
                        <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
                             {/* Compact Search Bar */}
                             <div className="relative w-full mb-3 pt-4">
                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                 <input
                                     type="text"
                                     placeholder="Search..."
                                     className="w-full py-2.5 pl-10 pr-4 bg-white border border-gray-200 text-gray-800 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-sm"
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

                             {/* Controls Row: A-Z Filter (Top), Sort (Bottom) */}
                             <div className="flex flex-col gap-3 mb-4">
                                  <div className="w-full">
                                     <AlphaFilter selected={selectedLetter} onSelect={handleLetterSelect} />
                                  </div>
                                  <div className="w-full flex justify-end">
                                     <SortControl sortBy={sortBy} onSortChange={setSortBy} />
                                  </div>
                             </div>
                             
                             {/* Quick Filters */}
                             <div className="mb-4">
                                <QuickFilters onFilter={handleFilter} />
                             </div>
                        </div>

                        {/* SCROLLABLE LIST AREA */}
                        <div className="flex-1 min-h-[50vh]">
                            {filteredProtocols.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                                    <div className="text-xs text-gray-500 font-medium flex justify-between items-center px-1">
                                        <span>{filteredProtocols.length} results {selectedLetter && ` starting with "${selectedLetter}"`}</span>
                                    </div>
                                    {filteredProtocols.map((protocol) => (
                                        <ProtocolCard key={protocol.id} protocol={protocol} onSelect={handleSelectProtocol} onShare={handleShare} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-white rounded-2xl shadow-md border border-gray-100 mt-4">
                                    <FlaskConical className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">No results found</h3>
                                    <p className="text-gray-500 text-sm">{selectedLetter ? `No protocols found starting with "${selectedLetter}".` : `We couldn't find any protocols matching "${searchTerm}".`}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
                        
                        {/* Quick Filter Chips */}
                        <div className="text-center">
                            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-3">Popular Topics</p>
                            <QuickFilters onFilter={handleFilter} />
                             <button 
                                onClick={startBrowsing}
                                className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                <Library className="w-4 h-4 mr-2" />
                                Browse A–Z Catalog &rarr;
                            </button>
                        </div>

                        {/* Explainer Video / Mission Section */}
                        <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="grid md:grid-cols-2">
                                <div className="bg-gray-900 p-8 flex flex-col justify-center items-center text-center text-white relative min-h-[300px]">
                                    {/* Video Placeholder */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                    <PlayCircle className="w-16 h-16 text-white/80 mb-4 z-20 hover:scale-110 transition-transform cursor-pointer" />
                                    <h3 className="text-xl font-bold z-20">Our Mission</h3>
                                    <p className="text-gray-300 text-sm mt-2 z-20">Watch why we built this database.</p>
                                </div>
                                <div className="p-8 flex flex-col justify-center">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">The Gap in Modern Medicine</h2>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        We are sick of seeing big pharma not do clinical trials on off-patent medicines. 
                                        Promising treatments are often ignored simply because they aren't profitable.
                                    </p>
                                    <p className="text-gray-600 leading-relaxed font-medium">
                                        We built this site to help people heal and learn.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Graphics / Why We Exist Section */}
                        <section>
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* TRUST SCORES CARD */}
                                <div 
                                    onClick={() => setShowTrustScoreInfo(!showTrustScoreInfo)}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                                >
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                                        <Shield className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 flex items-center justify-center">
                                        Trust Scores 
                                        <ChevronDown className={`w-4 h-4 ml-1 text-gray-400 transition-transform ${showTrustScoreInfo ? 'rotate-180' : ''}`} />
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        We cut through the noise by separating anecdotal success from scientific validation.
                                    </p>
                                    
                                    {/* Dropdown Content */}
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

                                {/* OFF-PATENT FOCUS CARD */}
                                <div 
                                    onClick={handleGoToAbout}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
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

                                {/* COMMUNITY VETTED CARD */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">Community Vetted</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Real reports from real people. Our database grows smarter with every testimonial shared.
                                    </p>
                                    
                                    {/* Add Report Dropdown */}
                                    <div className="relative">
                                        <select 
                                            className="w-full p-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer hover:bg-purple-100 transition-colors appearance-none text-center"
                                            defaultValue=""
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setReportIntent(e.target.value);
                                                    setIsFindingProtocolForReport(true);
                                                }
                                                e.target.value = ""; // Reset
                                            }}
                                        >
                                            <option value="" disabled>+ Add Your Report Here</option>
                                            <option value="success">Submit Success Story</option>
                                            <option value="side-effect">Report Side Effect</option>
                                            <option value="correction">Suggest Correction</option>
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
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                         <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Healing Directory</span>
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
                        className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                    >
                        About Healing Directory
                    </button>
                </div>
                
                {/* Updated Disclaimer Block */}
                <div className="space-y-2 max-w-lg mx-auto">
                    <p className="font-medium">The information shared on this site is for personal exploration and education only.</p>
                    <p>We honour both scientific research and real-world experiences, but nothing here is offered as medical advice.</p>
                    <p>Every body is unique — always listen to your intuition and speak with a qualified healthcare professional before beginning any new protocol, supplement, or treatment.</p>
                    <p>Community stories reflect individual journeys and may not apply to everyone.</p>
                    <p className="font-medium">Please use this space with awareness, curiosity, and care for your own wellbeing.</p>
                </div>
                
                <p className="mt-6">User ID: <span className="font-mono bg-gray-100 p-1 rounded">{userId?.substring(0, 8)}...</span></p>
            </footer>
        </div>
    );
};

export default App;
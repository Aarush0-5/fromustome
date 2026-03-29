"use client"
import { getRecoveryData, updateGoalStatus , UpdateReasons, updateActionStatus, updateUrgeLevel} from "../backend/mongo1";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Avatar1 from "../images/avatars.png";
import Avatar2 from "../images/avatar2.png";
import Avatar3 from "../images/avatar3.png";
import Avatar4 from "../images/avatar4.png";

interface Goal {
  text: string,
  completed: boolean
  completedCount: number,
  targetDays: number
}

 const PHASE_GOALS = {
  1: [
    { id: "p1_1", text: "10 mins morning sunlight exposure" },
    { id: "p1_2", text: "Write 3 negative traits of the ex (Truth List)" },
    { id: "p1_3", text: "Archive/Mute all digital reminders" },
    { id: "p1_4", text: "30s cold water face splash for panic" },
    { id: "p1_5", text: "Getting a webseries/show to watch when free to distract yourself" },
    { id: "p1_6", text: "Sleeping by 12:00 am sharp!" }
  ],
  2: [
    { id: "p2_1", text: "20 mins of Cardio/Sweat session" },
    { id: "p2_2", text: "1 hour Dopamine Fast (zero screens)" },
    { id: "p2_3", text: "30 mins on a pre-relationship hobby (Something you did before relationship)" },
    { id: "p2_4", text: "20 min 'Solo Win' public outing (Go out anywhere)" },
    { id: "p2_5", text: "Rearrange or deep-clean your living space" },
    { id: "p2_6", text: "Call/Text a long-lost friend" },
    { id: "p2_7", text: "3 high-protein, whole-food meals" }
  ],
  3: [
    { id: "p3_1", text: "Start/Continue 3x weekly weight lifting" },
    { id: "p3_2", text: "Write and destroy a Closure Letter" },
    { id: "p3_3", text: "Set a 6-month career or personal goal" },
    { id: "p3_4", text: "7 days of perfect sleep hygiene (no screens)" },
    { id: "p3_5", text: "Join a new social group, class, or club" },
    { id: "p3_6", text: "Write a letter of appreciation to yourself" },
    { id: "p3_7", text: "Take one concrete step toward a 'new life' goal" }
  ]
};

export default function dashboard() {
const router = useRouter();
const [reasonIndex, setReasonIndex] = useState(0);
const [memoryString, setMemoryString]= useState<string>('')
const [panic, setPanic]=useState(false)
const [reasons, setReasons]= useState<string []>([])
const [goals, setGoals]= useState<Goal[]>([])
const [noContact, setNoContact]= useState(false)
const [showCertificate, setShowCertificate] = useState(false);
const [userNote, setUserNote]= useState('')
const completedCount = goals.filter(g => g.completed).length;
const [updateReason, setUpdateReason]= useState<string[]>([])
const [updateReasonInput, setUpdateReasonInput] = useState<string>('')
const [ncStartDate, setNcStartDate] = useState('');;
const [selectedTriggers , setSelectedTriggers] = useState<string[]>([])
const [checkedIds, setCheckedIds] = useState<string[]>([])
const [advice, setAdvice]= useState('')
const [adviceIndex, setAdviceIndex] = useState(0);
const [urgeLevel, setUrgeLevel] = useState(0)
const [isLoading, setIsLoading] = useState(true);
const [initialUrgeLevel, setInitialUrgeLevel]=  useState (0)
const [currentUrgeLevel, setCurrentUrgeLevel]= useState(0)

const showNextReason = () => {
  setReasonIndex((prev) => (prev + 1) % reasons.length);
};

const handleUpdateReason = async (e: React.FormEvent)=> {
  e.preventDefault()
  if (updateReasonInput.trim()) {
      setUpdateReason((prevReasons: string[]) => [...prevReasons, updateReasonInput]);
      setUpdateReasonInput(''); 
    }
}

const handleupdateReasons = async () => {
  const memorykey: any= sessionStorage.getItem("memoryKey")
  const result = await UpdateReasons(memorykey, updateReason)
  router.push('/fromustome/dashboard')
}
const Recoverydata = async (key: string) => {
    const results = await getRecoveryData(key)
    if (results?.success){
      const sanitizedGoals = results.data.goals.map((g: any) => ({
        text: g.text || "",
        targetDays: Number(g.targetDays),
        completedCount: Number(g.completedCount || 0),
        completed: g.completed ?? false
      }));
      setGoals(sanitizedGoals)
      setReasons(results.data.reasons)
      setMemoryString(key)
      setUserNote(results.data.note)
      setNcStartDate(results.data.ncStartDate)
      setSelectedTriggers(results.data.selectedTrigger)
      setCheckedIds(results.data.checkedIds)
      setAdvice(results.data.advice)
      setUrgeLevel(results.data.initialUrgeLevel)
      setInitialUrgeLevel(results.data.initialUrgeLevel)
      setCurrentUrgeLevel(results.data.currentUrgeLevel)
    }
}
useEffect(() => {
    const fetchData = async () => {
      const key = sessionStorage.getItem("memoryKey");
      if (key) {
        await Recoverydata(key); 
        setIsLoading(false); 
      }
    };
    fetchData();
  }, []);

const handleToggleGoal = async (target: number | string) => {
 if (typeof target === "number") {
    const index = target;
    
   
    const updatedGoals = goals.map((g, i) => {
      if (i !== index) return g;

      
      const currentCount = Number(g.completedCount || 0);
      const targetDays = Number(g.targetDays || 0);
      if (g.completed || currentCount >= targetDays) return g;
      const newCount = currentCount + 1;
      const isNowComplete = newCount >= targetDays;
      return {
        ...g,
        completedCount: newCount,
        completed: isNowComplete
      };
    });
    setGoals(updatedGoals);
    try {
      await updateGoalStatus(memoryString, updatedGoals);
    } catch (error) {
      console.error("Failed to sync habit:", error);
    }
  } else {
   
    const goalId = target;
    
    if (checkedIds.includes(goalId)) return;

    const updatedIds = [...checkedIds, goalId];
    setCheckedIds(updatedIds);
    
   
    await updateActionStatus(memoryString, updatedIds);
  }
};
const { daysElapsed, currentPhase } = useMemo(() => {
  if (!ncStartDate) return { daysElapsed: 0, currentPhase: 1 };
  const [year, month, day] = ncStartDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffInMs = today.getTime() - start.getTime();
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  let p = 1;
  if (days >= 30) p = 3;
  else if (days >= 10) p = 2; 
  return { daysElapsed: days >= 0 ? days : 0, currentPhase: p };
}, [ncStartDate]); 

const activePhaseGoals = PHASE_GOALS[currentPhase as 1 | 2 | 3]



const Certificate = ({ 
  memoryKey, 
  userNote, 
  ncStartDate, 
  initialUrgeLevel, 
  currentUrgeLevel, 
  completedTasks, 
  onClose 
}: any) => {

  const daysHealed = ncStartDate ? Math.floor((new Date().getTime() - new Date(ncStartDate).getTime()) / (1000 * 3600 * 24)) : 0;
  const recoveryRate = Math.round(((initialUrgeLevel - currentUrgeLevel) / initialUrgeLevel) * 100);
  console.log(initialUrgeLevel)
  console.log(currentUrgeLevel)
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-12 overflow-hidden">
      
      {/* THE COMPACT FRAME */}
      <div className="relative w-full max-w-4xl h-auto max-h-[92vh] bg-[#0c0c0c] text-stone-200 shadow-[0_0_80px_rgba(197,160,89,0.1)] rounded-xl overflow-hidden border-[1px] border-[#c5a059]/30 flex flex-col scale-95 md:scale-100 transition-all duration-700">
        
        {/* Subtle Gold Accents */}
        <div className="absolute inset-3 border-[1px] border-[#c5a059]/10 pointer-events-none rounded-lg" />
        <div className="absolute inset-5 border-[1px] border-[#c5a059]/5 pointer-events-none rounded-lg" />

        <div className="relative z-10 p-6 md:p-10 flex flex-col gap-8 overflow-y-auto scrollbar-hide">
          
          {/* 1. MASTER TITLE */}
          <div className="text-center space-y-3">
             <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.6em] text-[#c5a059] opacity-80">
                Sovereignty Record #{Math.floor(Math.random() * 9000) + 1000}
              </p>
              <h1 className="text-2xl md:text-4xl font-serif italic text-stone-100 tracking-tight leading-tight">
                A Declaration of <span className="text-[#c5a059] not-italic font-sans uppercase text-xl md:text-3xl font-black block md:inline ml-0 md:ml-2">Emotional Autonomy</span>
              </h1>
          </div>

          {/* 2. JOURNEY HEADER & QUICK STATS */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-4 rounded-lg border border-white/5 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-lg md:text-2xl font-serif italic text-stone-100">The Journey of {memoryKey}</h2>
              <p className="text-[8px] uppercase tracking-widest text-stone-500 font-bold">Protocol fully integrated</p>
            </div>
            
            <div className="flex gap-8 border-l border-white/10 pl-0 md:pl-8">
              <div className="text-center">
                <p className="text-[7px] uppercase text-stone-500 font-bold mb-1 tracking-widest">Days Clear</p>
                <p className="text-xl md:text-2xl font-serif text-[#c5a059]">{daysHealed}</p>
              </div>
              <div className="text-center">
                <p className="text-[7px] uppercase text-stone-500 font-bold mb-1 tracking-widest">Decrease in urge (%)</p>
                <p className="text-xl md:text-2xl font-serif text-[#c5a059]">{recoveryRate}%</p>
              </div>
            </div>
          </div>

          {/* 3. MAIN CONTENT: Protocols vs. The Promise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Protocols Secured */}
            <div className="space-y-4">
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-[#c5a059] font-black border-b border-[#c5a059]/20 pb-2">
                Defense Protocols Secured
              </h3>
              <ul className="grid grid-cols-1 gap-3">
                {completedTasks.slice(0, 8).map((task: any, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-[10px] md:text-xs text-stone-400">
                    <span className="text-emerald-500 font-bold">✓</span> 
                    <span className="leading-tight">{task.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column: The Promise */}
            <div className="relative group">
               {/* Decorative Background Quote Mark */}
               <span className="absolute -top-6 -left-2 text-6xl text-[#c5a059]/10 font-serif select-none">“</span>
               
               <div className="bg-[#141414] p-6 rounded-sm border border-[#c5a059]/20 shadow-inner">
                  <h3 className="text-[9px] text-center uppercase tracking-[0.3em] text-[#c5a059] font-black mb-4">
                    Remember this promise?
                  </h3>
                  <p className="text-xs md:text-sm font-serif italic text-stone-200 leading-relaxed text-center py-2">
                    "{userNote || "That I am enough, and the silence is my strength."}"
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center gap-2">
                    <p className="font-serif text-2xl italic text-[#c5a059] tracking-tighter">
                      {memoryKey}
                    </p>
                    <p className="text-[7px] uppercase tracking-widest text-stone-600">Authenticated By YOU</p>
                  </div>
               </div>
            </div>
          </div>

          {/* 4. FOOTER */}
          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-[8px] uppercase text-stone-600 tracking-widest">Archive Date</p>
              <p className="text-[9px] font-bold text-stone-400 tracking-tighter uppercase">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[8px] uppercase text-stone-600 tracking-widest">Final Status</p>
                  <p className="text-[9px] font-black text-emerald-500 tracking-tighter uppercase italic">Integrity Verified 100%</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-[#c5a059]/30 flex items-center justify-center rotate-12">
                   <div className="w-8 h-8 rounded-full border border-emerald-500/20 flex items-center justify-center">
                     <span className="text-[6px] text-emerald-500 font-bold uppercase">Safe</span>
                   </div>
                </div>
            </div>
          </div>
        </div>

        {/* 5. ACTIONS */}
        <div className="bg-[#1a1a1a] p-4 flex flex-col sm:flex-row justify-center gap-3 print:hidden border-t border-[#c5a059]/10">
          <button 
            onClick={() => window.print()} 
            className="px-10 py-2.5 bg-[#c5a059] text-black rounded-sm font-black uppercase text-[9px] tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#c5a059]/10"
          >
            Download Manifesto
          </button>
          <button 
            onClick={onClose} 
            className="px-10 py-2.5 bg-transparent text-stone-500 border border-stone-800 rounded-sm font-black uppercase text-[9px] tracking-[0.2em] hover:text-white transition-all"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

 const triggers = [{
    id: "social",
    title: "Digital Ghosting",
    advice: "Social media acts like a 'digital window' that tricks your brain into thinking the connection is still alive. Every time you check their profile, you restart the withdrawal cycle.",
    task: "Mute or block their profile on all platforms. If the urge is too strong, delete your social apps for 48 hours to break the loop."
  },
  {
    id: "nights",
    title: "The Midnight Gap",
    advice: "At night, your prefrontal cortex (the logical brain) is tired, and your emotions take over. Silence makes the absence feel heavier than it actually is.",
    task: "Leave your phone in another room or a 'Charging Station' 30 minutes before bed. Read a physical book or listen to a non-romantic podcast instead."
  },
  {
    id: "mutual",
    title: "The Information Buffer",
    advice: "Hearing updates about your ex through friends is 'Contact by Proxy.' It keeps you in a state of hyper-vigilance, waiting for the next piece of news.",
    task: "Send a text to your mutual circle: 'Hey, I am focusing on my healing right now. Please do not share any updates about them with me for a while. I appreciate the support!'"
  },
  {
    id: "objects",
    title: "Environmental Triggers",
    advice: "Physical objects and shared spaces are 'anchors' for memories. They trigger spontaneous spikes in cortisol (stress) and sadness.",
    task: "Perform a 'Sweep.' Put all photos, gifts, and hoodies into a box. Tape it shut and put it in a hard-to-reach place (garage/attic). Don't throw them away yet; just remove the visual cue."
  },
  {
    id: "milestones",
    title: "Special Dates & Fridays",
    advice: "Anniversaries and weekends were part of your shared identity. When these dates arrive, the brain feels the loss of the 'expected routine.'",
    task: "Pre-plan a 'Solo Date' or a high-activity event for these specific days. Don't leave your schedule empty; fill the space with a new experience to create a new anchor."
  },
  {
    id: "routine",
    title: "The Morning Routine",
    advice: "The 'Good Morning' text was your first hit of oxytocin for the day. Its absence creates an immediate sense of panic or emptiness when you wake up.",
    task: "Change your morning alarm sound and immediately do 5 minutes of stretching or a cold splash of water. Break the old neurological pattern with a new physical sensation."
  }]

const calculateTotalProgress = () => {

  const habitDaysDone = goals.reduce((acc, g) => acc + Number(g.completedCount || 0), 0);
  const totalHabitDays = goals.reduce((acc, g) => acc + Number(g.targetDays || 1), 0);
  const habitScore = totalHabitDays > 0 ? (habitDaysDone / totalHabitDays) * 5 : 0;

 
  const phaseGoalIds = activePhaseGoals.map(g => g.id);
  const phaseDoneCount = checkedIds.filter(id => phaseGoalIds.includes(id)).length;
  
  const activeTriggerIds = triggers
    .filter(t => selectedTriggers.includes(t.id))
    .map(t => `trigger_${t.id}`);
  const triggersDoneCount = checkedIds.filter(id => activeTriggerIds.includes(id)).length;
  const totalCurrentTasks = phaseGoalIds.length + activeTriggerIds.length;
  const currentDoneCount = phaseDoneCount + triggersDoneCount;
  
  const currentTaskCompletion = totalCurrentTasks > 0 ? (currentDoneCount / totalCurrentTasks) : 0;
  
  let basePhaseScore = 0;
  if (currentPhase === 1) {
    basePhaseScore = currentTaskCompletion * 30;
  } else if (currentPhase === 2) {
    basePhaseScore = 30 + (currentTaskCompletion * 30);
  } else if (currentPhase === 3) {
    basePhaseScore = 60 + (currentTaskCompletion * 30);
  }

  const integrityScore = noContact ? 5 : 0; 
 
  const finalTotal = Math.min(Math.round(habitScore + basePhaseScore + integrityScore), 100);
  return finalTotal;
};

const totalProgress = calculateTotalProgress();

const avatarPics= [
 Avatar1.src, Avatar2.src , Avatar3.src, Avatar4.src  
]
let avatarImage;
if (totalProgress <= 30) {
  avatarImage = avatarPics[0];
} else if (totalProgress <= 60) {
  avatarImage = avatarPics[1];
} else if (totalProgress < 100) {
  avatarImage = avatarPics[2];
} else {
  avatarImage = avatarPics[3];
}
const activeAdvices = triggers.filter(t => selectedTriggers.includes(t.id));

const nextAdvice = () => {
  setAdviceIndex((prev) => (prev + 1) % activeAdvices.length);
};
const prevAdvice = () => {
  setAdviceIndex((prev) => (prev - 1 + activeAdvices.length) % activeAdvices.length);
};
const current = activeAdvices.length > 0 ? activeAdvices[adviceIndex] : null;

const handleSubmitUrge = async (e: React.FormEvent) => {
  e.preventDefault(); 
  await updateUrgeLevel(memoryString, urgeLevel);
  
};
if (isLoading) {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <p className="text-white animate-pulse">Loading your progress...</p>
    </div>
  );
}
   return( 
    <div> 
      <head>
        <title>FromUStoMe | Your Breakup Reality Check</title>
        <link rel="icon" href="/logo.jpg" />
        <meta name="description" content="A student project to help you move on." />
      </head>
    <main className={`transition-all duration-[4000ms] min-h-screen ease-in-out ${
  totalProgress === 100
    ? "bg-blue-700 text-white" 
    : totalProgress >= 50
    ? "bg-[radial-gradient(circle_at_50%_-20%,_#FFF700_0%,_#FF8C00_30%,_#FF2400_60%,_#020617_100%)] text-white" 
    : "bg-[#020617] text-slate-400" 
}`}>  
      <nav className="p-6 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-xl font-light tracking-tight">Your Journey</h1>
        </div>
        <div className="text-right">
  
          <h2 className="text-sm font-mono text-slate-300">{memoryString}</h2>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto p-6 space-y-12">
        

        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-light">Feeling the urge to reach out?</h2>
              <p className="text-slate-500 text-sm italic">Take a breath. Read your truth first.</p>
            </div>
            
            <button 
              onClick={() => setPanic(!panic)}
              className={`w-full py-4 rounded-2xl font-medium transition-all duration-500 ${
                panic ? 'bg-zinc-800 text-slate-400' : 'bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              }`}
            >
              {panic ? "Hide Reality Checks" : "Why shouldn't I?"}
            </button>

            {panic && reasons.length > 0 && (
            <div className="flex flex-col">
                <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl italic text-rose-100">
                  "{reasons[reasonIndex]}"
                </div>
                <button 
                  onClick={showNextReason}
                  className="mt-4 text-xs uppercase tracking-widest text-rose-400 hover:text-rose-300"
                >
                  Give me another reason →
                </button>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                 <div className="flex flex-col mt-3 justify-center  items-center">
            <h3 className="text-xl text-white">Want to add more of your own reasons?</h3>
            
            <form className="flex flex-row mt-2 items-between gap-x-3" onSubmit={handleUpdateReason}>
              <input 
              className="focus:border-blue-500 rounded-lg"
                type="text" 
                value={updateReasonInput} 
                onChange={(e) => setUpdateReasonInput(e.target.value)} 
                placeholder="Type a reason..."
              />
              <button className="rounded-xl border hover:text-blue-500 hover:bg-black p-2 " type="submit">Add Reason</button>
            </form>
            <div>
             <ul className="gap-x-5 mt-2">
                {updateReason.map((reason: string, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button className="rounded-xl border hover:text-blue-500 hover:bg-black p-2 mt-3"onClick={handleupdateReasons}>Update All the Reasons</button>
            </div>
            <div className="mt-2 mb-2 ">
            <h3 className="text-lg text-white">Remember the advice you would have given your friend? I give it you now!</h3>
            <p className="text-xl underline italic text-green-500">My friend {advice}</p>
            </div>
              <p className="text-xl text-white mt-4 mb-4">Reasons not enough?</p>
              <div className="p-4 mt-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <h4 className="text-indigo-400 font-bold">You are {totalProgress.toFixed(0)}% ahead in your journey from day 1 .</h4>
                <p className="text-xs text-slate-400">You've finished {completedCount} major goals. Don't reset your clock now.</p>
              </div>
            </div>
            <div className=" my-10 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <h1 className="text-xl font-bold text-white text-center">Instead, try listening to these</h1>
              <p className="text-indigo-100 text-sm text-center mt-1">Curated resources for healing and growth</p>
            </div>

            <div className="">
              
              <a href="https://youtu.be/GcJVygChaxA" target="_blank" className="flex items-center p-3 rounded-xl hover:bg-indigo-50 transition-colors duration-200 group border border-transparent hover:border-indigo-100">
                <div className="bg-red-100 text-red-500 p-2 rounded-lg group-hover:bg-red-200">❤️</div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">How to Heal a Broken Heart</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Mel Robbins</p>
                </div>
              </a>

              <a href="https://youtu.be/IRCZ1Mt2a8M" target="_blank" className="flex items-center p-3 rounded-xl hover:bg-indigo-50 transition-colors duration-200 group border border-transparent hover:border-indigo-100">
                <div className="bg-blue-100 text-blue-500 p-2 rounded-lg group-hover:bg-blue-200">🎙️</div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">Jordan Peterson on DOAC</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">The Diary of a CEO</p>
                </div>
              </a>

              <a href="https://youtu.be/nNMDRdBea_E" target="_blank" className="flex items-center p-3 rounded-xl hover:bg-indigo-50 transition-colors duration-200 group border border-transparent hover:border-indigo-100">
                <div className="bg-purple-100 text-purple-500 p-2 rounded-lg group-hover:bg-purple-200">🧠</div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">The Science of Breakups</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Andrew Huberman</p>
                </div>
              </a>

              <a href="https://youtu.be/fQ4jVGMDlGw" target="_blank" className="flex items-center p-3 rounded-xl hover:bg-indigo-50 transition-colors duration-200 group border border-transparent hover:border-indigo-100">
                <div className="bg-green-100 text-green-500 p-2 rounded-lg group-hover:bg-green-200">📈</div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">Stages of Break up</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Insights & Recovery</p>
                </div>
              </a>

              <a href="https://youtu.be/R6xbXOp7wDA" target="_blank" className="flex items-center p-3 rounded-xl hover:bg-indigo-50 transition-colors duration-200 group border border-transparent hover:border-indigo-100">
                <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg group-hover:bg-yellow-200">⚡</div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">Understand Dopamine</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Biology & Motivation</p>
                </div>
              </a>

              <a href="https://youtu.be/TH0U2D90l-o" target="_blank" className="flex items-center p-3 rounded-xl hover:bg-indigo-50 transition-colors duration-200 group border border-transparent hover:border-indigo-100">
                <div className="bg-orange-100 text-orange-500 p-2 rounded-lg group-hover:bg-orange-200">🎮</div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">Hard to Be Happy</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Dr. K (HealthyGamerGG)</p>
                </div>
              </a>

            </div>
          </div>
              </div>
            )}
          </div>
        </section>

        <div className="mb-12 h-1/4 p-8 bg-[#0f0f0f] border border-white/5 rounded-3xl shadow-2xl">
        <div>
      <div className=" flex mb-2 justify-center ">
        <img  src={avatarImage} alt="your avatar"  />
       </div>
  <div className="flex justify-between  items-end mb-4">
    <div>
      <h2 className="text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
        Recovery Integrity
      </h2>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-light text-white">
          {Math.round(totalProgress)}
        </span>
        <span className="text-slate-500 text-xl">%</span>
      </div>
    </div>
  
  </div>

  {/* The Huge Bar Container */}
       
       <div className="relative h-4 w-full  bg-white/5 rounded-full overflow-hidden border border-white/10">
          {/* The Animated Fill */}
          <div 
            className="h-full bg-gradient-to-r from-rose-600 via-indigo-500 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            style={{ width: `${totalProgress}%` }}
          />
          
          {/* Glossy Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
      </div>
       <div className="flex flex-col">
           {/* Milestone Markers */}
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[9px] text-slate-700">START</span>
          <span className="text-[9px] text-slate-700">STABILITY</span>
          <span className="text-[9px] text-slate-700">HEALED</span>
        </div>
        
        {current ? (
          <div className="mt-6 bg-slate-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-lg">⚠️</span>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Active Defense: {current.title} {/* TypeScript is now happy because of the 'current ?' check */}
                </h4>
              </div>
              
              <div className="flex gap-2">
                <button onClick={prevAdvice} className="p-1 hover:text-white text-slate-500 transition-colors">
                  ←
                </button>
                <span className="text-[10px] text-slate-600 font-mono">
                  {adviceIndex + 1}/{activeAdvices.length}
                </span>
                <button onClick={nextAdvice} className="p-1 hover:text-white text-slate-500 transition-colors">
                  →
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "{current.advice}"
              </p>

              {/* The Actionable Task Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold mt-0.5">⚡</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Immediate Protocol</p>
                    <p className="text-xs text-slate-200 leading-snug">
                      {current.task}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Swipe Indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {activeAdvices.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === adviceIndex ? "w-4 bg-emerald-500" : "w-1 bg-slate-700"
                  }`} 
                />
              ))}
            </div>
          </div>
        ) : (

          <div className="mt-6 p-5 border border-white/5 rounded-2xl text-center text-slate-600 text-[10px] uppercase tracking-widest">
            No active triggers detected. Stay vigilant.
          </div>
        )}
              </div>
          </div>
    
</div>  
        <div className="p-6 bg-slate-900/50 rounded-xl border border-white/5">
            {[30, 60, 90, 100].includes(totalProgress) ? (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-lg font-serif italic text-white mb-4">
                  Check-in: What is your urge level now (1-10)?
                </h2>
                <form onSubmit={handleSubmitUrge} className="flex gap-4">
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={urgeLevel}
                    onChange={(e) => setUrgeLevel(parseInt(e.target.value))}
                    className="bg-black/40 border border-[#c5a059]/30 text-[#c5a059] p-2 rounded-md w-20 focus:outline-none focus:border-[#c5a059]"
                  />
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-[#c5a059] text-black font-bold uppercase text-[10px] tracking-widest rounded-md hover:bg-[#d4b476]"
                  >
                    Update Archive
                  </button>
                </form>
              </div>
            ) : <div></div>}
          </div>

        {/* Goals Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-sm uppercase tracking-[0.3em] text-white whitespace-nowrap">Your Goals</h2>
            <div className="h-px bg-white/5 w-full" />
          </div>
            <div className="space-y-8">
              {/* SECTION 1: REQUIRED ACTIONS (Phase + Triggers) */}
              <section className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-sm uppercase tracking-[0.3em] text-white whitespace-nowrap">
                    Required Actions (Phase {currentPhase})
                  </h2>
                  <div className=" font-semibold">
                    <p>Phase 1 Goals will have to be done in / repeated from day 1 to day 10 of NC</p>
                  <p>Phase 2 Goals will have to be done in / repeated from day 11 to day 30 of NC</p>
                  <p>Phase 3 Goals will have to be done in / repeated for from day 30 onwards of NC</p>
                  </div>
                  
                  <div className="h-px bg-white/5 w-full" />
                </div>

                <div className="grid gap-3">
                  {/* Combined Phase & Trigger Goals Mapping */}
                  {[
                    ...activePhaseGoals,
                    ...triggers
                      .filter(t => selectedTriggers.includes(t.id))
                      .map(t => ({ id: `trigger_${t.id}`, text: t.task, isTrigger: true }))
                  ].map((goal: { id: string; text: string; isTrigger?: boolean }) => {
                    const isDone = checkedIds.includes(goal.id);

                    return (
                      <div 
                        key={goal.id} 
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
                          isDone 
                            ? "bg-emerald-500/10 border-emerald-500/30 opacity-70" 
                            : "bg-gray-900/50 border-white/10 hover:border-emerald-500/50"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isDone}
                          disabled={isDone} // Prevent unchecking as discussed
                          className="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-800 text-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                          onChange={() => handleToggleGoal(goal.id)}
                        />
                        
                        <div className="flex flex-col">
                          {goal.isTrigger && !isDone && (
                            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter mb-1">
                              Trigger Shield Active
                            </span>
                          )}
                          <span className={`text-sm md:text-base leading-relaxed transition-colors ${
                            isDone ? "text-emerald-500/50 line-through" : "text-gray-300"
                          }`}>
                            {goal.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 2: PERSONAL COMMITMENTS (Custom Goals) */}
             <div className="grid gap-3">
                  {goals.map((goal, index) => {
 
                const currentCount = Number(goal.completedCount || 0);
                const targetDays = Number(goal.targetDays || 1); 
                const progress = Math.min((currentCount / targetDays) * 100, 100);

                return (
                  <button
                    key={`custom-${index}`}

                    onClick={() => handleToggleGoal(index)}
                    className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 group ${
                      goal.completed 
                      ? "bg-indigo-500/10 border-indigo-500/30 opacity-60" 
                      : "bg-[#0f0f0f] border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        goal.completed 
                        ? "bg-indigo-500 border-indigo-500" 
                        : "border-slate-700 group-hover:border-slate-500"
                      }`}>
                        {goal.completed && (
                          <svg className="w-4 h-4 text-white font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="flex flex-col items-start flex-1">
                        <div className="flex justify-between w-full">
                          <span className={`text-sm transition-all ${
                            goal.completed ? "text-slate-500 line-through" : "text-slate-200"
                          }`}>
                            {goal.text}
                          </span>
                          <span className="text-[10px] font-mono text-indigo-400">
                            {currentCount} / {targetDays} DAYS
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          <div className="mt-8">
            <button 
              
              disabled={totalProgress < 95} 
              onClick={() => setNoContact(true)}
              className={`w-full group relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-500 ${
                totalProgress < 95 
                  ? "bg-slate-900/50 border-slate-800 cursor-not-allowed opacity-60" 
                  : "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 active:scale-[0.98] shadow-[0_0_30px_rgba(16,185,129,0.1)]"
              }`}
            >
              
              {totalProgress >= 95 && (
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              )}

              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                <div className={`text-2xl transition-transform duration-500 ${totalProgress >= 95 ? "group-hover:scale-125" : ""}`}>
                  {noContact ? "✅" : totalProgress < 95 ? "🔒" : "🛡️"}
                </div>

                <div className="space-y-1">
                  <h3 className={`font-bold tracking-wide ${totalProgress < 95 ? "text-slate-500" : "text-emerald-400"}`}>
                    FINAL INTEGRITY CHECK
                  </h3>
                  <p className={`text-sm leading-relaxed ${totalProgress < 95 ? "text-slate-600" : "text-slate-300"}`}>
                    Did you maintain zero contact throughout your entire journey?
                  </p>
                </div>

               
                {totalProgress < 95 && (
                  <span className="text-[10px] bg-slate-800 text-slate-500 px-3 py-1 rounded-full uppercase tracking-tighter">
                    Unlocks at 95% Base Progress
                  </span>
                )}
              </div>
            </button>

              </div>
                {totalProgress === 100 && (
              <button 
                onClick={() => setShowCertificate(true)}
                className="mt-8 w-full py-6 bg-gradient-to-r from-amber-400 to-yellow-600 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-bounce"
              >
                CLAIM YOUR CERTIFICATE
              </button>
            )}

            {showCertificate && (
              <Certificate 
                memoryKey={memoryString} 
                userNote={userNote}
                ncStartDate={ncStartDate}
                initialUrgeLevel={initialUrgeLevel}
                currentUrgeLevel={currentUrgeLevel}
                completedTasks={goals.filter(g => g.completed === true)}
                onClose={() => setShowCertificate(false)} 
              />
            )}
        </section>

      </div>
      <footer className="py-20 text-center opacity-20 pointer-events-none">
        <div className="text-[80px] font-black tracking-tighter text-white/5 select-none">
          STAY STRONG
        </div>
      </footer>
    </main>
    </div>
   )
}
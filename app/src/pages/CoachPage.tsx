import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Leaf, RotateCcw, Copy, CheckCheck, Sparkles, ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Offline Coaching Knowledge Base ─────────────────────────────────────────
const COACHING_RESPONSES: Record<string, string[]> = {
  transport: [
    `**🚗 Transport Insight**\n\nTransport is typically the **largest single contributor** to personal carbon footprints, making up ~28% of individual emissions globally.\n\n**Top 3 swaps you can make today:**\n1. **Metro/Train over petrol car** — reduces commute emissions by 75–88%\n2. **Cycling for <5km trips** — zero emissions, plus health benefits\n3. **Carpooling** — splits emissions per person by 2–4×\n\n*One fewer 20km petrol drive per week = ~200 kg CO₂e saved per year.*`,
    `**✈️ Flight Footprint**\n\nA single return long-haul flight can emit **2–3 tonnes of CO₂e** — equivalent to months of other activities combined.\n\n**Reduce flight impact:**\n- Choose non-stop routes (takeoff/landing = 25% of flight emissions)\n- Fly economy (business class = 3× more per seat)\n- Consider train for trips under 600 km\n- Offset via verified schemes (Gold Standard, Verra)`,
  ],
  food: [
    `**🥗 Food & Diet Coaching**\n\nFood accounts for ~26% of global greenhouse gas emissions. The biggest lever? **What's on your plate.**\n\n| Food Type | CO₂e per 100g |\n|---|---|\n| Red Meat | 27 kg |\n| Chicken | 6.9 kg |\n| Eggs | 4.5 kg |\n| Vegetables | 2.0 kg |\n| Vegan meal | 1.5 kg |\n\n**Reducing red meat to 3 meals/week saves ~600 kg CO₂e annually** — the equivalent of not driving for 2 months.`,
    `**🌱 Plant-Based Transition Tips**\n\nYou don't need to go fully vegan. Even **Meatless Mondays** make a measurable impact:\n- Try legumes (lentils, chickpeas) as protein replacements\n- Indian dal and rajma are lower-carbon than imported meat\n- Local and seasonal produce = less refrigeration + transport emissions\n\n*Try one plant-based dinner per day for 30 days. Track the difference in your eco-island!*`,
  ],
  energy: [
    `**⚡ Home Energy Coaching**\n\nElectricity in India's grid averages **0.82 kg CO₂e per kWh** — one of the highest globally due to coal dependence.\n\n**Immediate savings:**\n1. **AC at 26°C** instead of 22°C = 18% energy cut\n2. **LED lights** use 75% less electricity than incandescent\n3. **Unplug standby devices** — can account for 5–10% of home energy\n4. **Rooftop solar** — payback period in India: 4–6 years, then 20+ years of clean energy`,
    `**🔆 Solar Transition Guide**\n\nA 3kW rooftop solar system in India:\n- Generates ~12 kWh/day on average\n- Offsets **1,500–2,000 kg CO₂e** per year\n- Costs ~₹1.8–2.5 lakhs (with subsidies)\n- ROI: ~6–8 years\n\nSubsidies available through PM Surya Ghar Muft Bijli Yojana — up to 78,000 subsidy for a 3kW system.`,
  ],
  general: [
    `**🌍 Your Personalized Carbon Roadmap**\n\nBased on typical Indian urban footprints, here's a 90-day action plan:\n\n**Month 1: Low-hanging fruit**\n- Switch to LED lighting throughout home\n- Set AC to 26°C\n- Start tracking meat consumption\n\n**Month 2: Transport shift**\n- Use metro/bus for 2 days/week instead of car\n- Combine trips (batching errands = fewer separate journeys)\n\n**Month 3: Diet experiment**\n- Try 4 plant-based dinners per week\n- Source one meal per week from local farmers markets\n\n*Expected annual saving: 800–1,200 kg CO₂e — equivalent to planting 40 trees.*`,
    `**🏆 Habits That Compound Over Time**\n\nSmall, consistent changes beat dramatic one-offs:\n\n- **Daily cycling instead of auto** for 5km = 365 kg CO₂e/year saved\n- **No red meat once a week** = 380 kg CO₂e/year saved\n- **Shorter showers** (5 min vs 15 min) = 60 kg CO₂e/year saved\n\nThese three habits alone = **805 kg CO₂e savings** — more than most people achieve with expensive offsets.\n\n*Start with ONE habit. Track it here. Add the next one in 3 weeks.*`,
    `**📊 Understanding Your Footprint**\n\nThe average Indian emits ~1.8 tonnes of CO₂e per year. Globally it's ~4.7 tonnes.\n\nHere's how to read your CarbonWise numbers:\n- **< 100 kg/month** = Excellent (top 10% globally)\n- **100–250 kg/month** = Good (below India average)\n- **250–500 kg/month** = Average urban Indian\n- **> 500 kg/month** = High — focus on transport & energy first\n\nYour eco-island reflects exactly where you sit. Every log entry updates it in real time!`,
  ],
  shopping: [
    `**🛍️ Sustainable Shopping Guide**\n\nFast fashion and electronics have enormous embodied carbon:\n- An average t-shirt = 5–15 kg CO₂e\n- A smartphone = 70–80 kg CO₂e\n- A laptop = 300–400 kg CO₂e\n\n**Better choices:**\n1. **Buy second-hand** — cuts product emissions by 70–80%\n2. **Repair before replacing** — extends product life, delays embodied carbon\n3. **Choose brands with EPR certification** (Extended Producer Responsibility)\n4. **Reduce packaging waste** by ordering consolidated deliveries`,
  ],
};

// ─── Suggested Prompts ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  'How can I reduce my transport emissions?',
  'Give me a plant-based diet plan',
  'Explain my energy footprint',
  'Create a 90-day carbon reduction plan',
  'How do flights impact my score?',
  'Tips for sustainable shopping',
];

// ─── Helper: match coaching response ─────────────────────────────────────────
function getCoachResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes('flight') || msg.includes('plane') || msg.includes('travel') || msg.includes('transport') || msg.includes('car') || msg.includes('drive')) {
    return COACHING_RESPONSES.transport[Math.floor(Math.random() * COACHING_RESPONSES.transport.length)];
  }
  if (msg.includes('food') || msg.includes('diet') || msg.includes('meat') || msg.includes('vegan') || msg.includes('plant')) {
    return COACHING_RESPONSES.food[Math.floor(Math.random() * COACHING_RESPONSES.food.length)];
  }
  if (msg.includes('energy') || msg.includes('electricity') || msg.includes('solar') || msg.includes('ac') || msg.includes('home')) {
    return COACHING_RESPONSES.energy[Math.floor(Math.random() * COACHING_RESPONSES.energy.length)];
  }
  if (msg.includes('shop') || msg.includes('fashion') || msg.includes('buy') || msg.includes('purchase') || msg.includes('deliver')) {
    return COACHING_RESPONSES.shopping[0];
  }
  return COACHING_RESPONSES.general[Math.floor(Math.random() * COACHING_RESPONSES.general.length)];
}

// ─── Markdown-like renderer (basic) ──────────────────────────────────────────
function RenderMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
          const text = line.slice(2, -2);
          return <p key={i} className="font-bold text-white text-base">{text}</p>;
        }
        if (line.startsWith('| ') && line.includes('|')) {
          const cells = line.split('|').filter(c => c.trim());
          return (
            <div key={i} className="flex gap-4 text-xs">
              {cells.map((c, j) => (
                <span key={j} className={`flex-1 ${j === 0 ? 'text-slate-300' : 'text-emerald-400 font-semibold'}`}>
                  {c.trim()}
                </span>
              ))}
            </div>
          );
        }
        if (line.startsWith('|---')) return <div key={i} className="border-t border-white/5 my-1" />;
        if (line.match(/^\d+\./)) {
          const num = line.match(/^(\d+)\. (.*)/)!;
          return (
            <div key={i} className="flex gap-2">
              <span className="text-emerald-400 font-bold flex-shrink-0">{num[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: num[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-emerald-400 mt-1 flex-shrink-0">•</span>
              <span className="text-slate-300" dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
            </div>
          );
        }
        if (line.startsWith('*') && line.endsWith('*')) {
          return <p key={i} className="text-slate-500 italic text-xs">{line.slice(1, -1)}</p>;
        }
        if (line === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-slate-300"
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `**👋 Welcome to your AI Carbon Coach!**\n\nI'm trained on climate science, EPA emissions data, DEFRA factors, and behavioral research to give you hyper-specific, actionable advice.\n\nAsk me anything — your daily commute, what to eat, how to green your home, or just ask for a 90-day action plan.\n\n*What would you like to tackle first?*`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate streaming delay
    const response = getCoachResponse(text);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMsg]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages(prev => [prev[0]]);
  };

  return (
    <div className="min-h-screen bg-[#030712] pt-20 pb-4 px-4 text-white flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AI Carbon Coach</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs text-slate-400">Powered by climate science &amp; EPA data</p>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white glass-card hover:border-white/15 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </button>
        </motion.div>

        {/* Suggested Prompts */}
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-wrap gap-2"
          >
            {SUGGESTED_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-300 glass-card border border-white/8 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 min-h-[400px] max-h-[60vh]">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-purple-500/20' : 'bg-emerald-500/20'
                }`}>
                  {msg.role === 'assistant'
                    ? <Brain className="w-4 h-4 text-purple-400" />
                    : <Leaf className="w-4 h-4 text-emerald-400" />
                  }
                </div>

                {/* Bubble */}
                <div className={`group max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`rounded-2xl px-4 py-3 relative ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/15 border border-emerald-500/20 text-white rounded-tr-none'
                      : 'glass-card border border-white/8 rounded-tl-none'
                  }`}>
                    {msg.role === 'assistant'
                      ? <RenderMarkdown content={msg.content} />
                      : <p className="text-sm text-white">{msg.content}</p>
                    }
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  }`}>
                    <span className="text-[10px] text-slate-600">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className="text-slate-600 hover:text-slate-300 transition-colors"
                      >
                        {copiedId === msg.id
                          ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>
                <div className="glass-card rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">Analyzing your footprint...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-neon rounded-2xl p-3 border border-white/8"
        >
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about transport, diet, energy, or request a custom plan..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 resize-none outline-none leading-relaxed py-1"
              style={{ minHeight: '24px', maxHeight: '120px' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <p className="text-[10px] text-slate-600">Enter to send · Shift+Enter for new line</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-600">
              <ChevronDown className="w-3 h-3" />
              <span>Climate data: EPA · DEFRA · IPCC 2023</span>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

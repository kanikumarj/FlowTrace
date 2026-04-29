import { useState } from "react";

export default function SimulatorInputForm({ onRun, loading }: any) {
  const [dnis, setDnis] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("12:00");
  const [callerType, setCallerType] = useState("NEW");

  return (
    <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">DNIS / DTMF Input</label>
        <input 
          type="text" 
          value={dnis} 
          onChange={e => setDnis(e.target.value)} 
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" 
          placeholder="e.g. 1"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Time of Day</label>
        <input 
          type="time" 
          value={timeOfDay} 
          onChange={e => setTimeOfDay(e.target.value)} 
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" 
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Caller Type</label>
        <select 
          value={callerType} 
          onChange={e => setCallerType(e.target.value)} 
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="NEW">New Caller</option>
          <option value="EXISTING">Existing Customer</option>
          <option value="PREMIUM">Premium Member</option>
        </select>
      </div>
      <button 
        onClick={() => onRun({ dnis, timeOfDay, callerType })}
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run Simulation"}
      </button>
    </div>
  );
}

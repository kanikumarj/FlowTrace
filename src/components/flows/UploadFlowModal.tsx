"use client";

import { useState, useRef, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, UploadCloud, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLATFORMS = [
  { value: "AMAZON_CONNECT", label: "Amazon Connect", ext: ".json" },
  { value: "CISCO_UCCX", label: "Cisco UCCX", ext: ".xml" },
  { value: "GENESYS", label: "Genesys Cloud", ext: ".i3InboundFlow" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "platform" | "upload" | "name" | "processing";
type Status = "idle" | "uploading" | "success" | "error";

export function UploadFlowModal({ open, onClose }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [flowName, setFlowName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function reset() {
    setStep("platform");
    setPlatform("");
    setFile(null);
    setFlowName("");
    setStatus("idle");
    setErrorMsg("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setStep("name"); }
  }

  function handleFileSelect(files: FileList | null) {
    if (files?.[0]) { setFile(files[0]); setStep("name"); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !platform || !flowName.trim()) return;

    setStep("processing");
    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);
    formData.append("flowName", flowName.trim());

    try {
      const res = await fetch("/api/flows/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus("error");
        setErrorMsg(data.error?.message || "Upload failed");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        handleClose();
        router.push(`/dashboard/flows/${data.flowId}`);
        router.refresh();
      }, 1000);
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-full max-w-lg animate-fade-in rounded-xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Upload IVR Flow</h2>
          <button onClick={handleClose} className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5">
          {/* Step 1: Platform */}
          {step === "platform" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select the platform your IVR flow was exported from:</p>
              <div className="grid gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p.value} onClick={() => { setPlatform(p.value); setStep("upload"); }}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5">
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    <span className="text-xs text-muted-foreground">{p.ext}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === "upload" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Upload your flow configuration file:</p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <UploadCloud className={`mb-3 h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium text-foreground">Drag & drop your file here</p>
                <p className="mt-1 text-xs text-muted-foreground">or click to browse · Max 10MB</p>
                <input ref={fileInputRef} type="file" accept=".json,.xml,.aef,.i3InboundFlow,.I3INBOUNDFLOW" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("platform")}>← Back</Button>
            </div>
          )}

          {/* Step 3: Name */}
          {step === "name" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Selected file</p>
                <p className="text-sm font-medium text-foreground">{file?.name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flow-name">Flow Name</Label>
                <Input id="flow-name" placeholder="e.g. Main IVR, Support Queue" value={flowName} onChange={(e) => setFlowName(e.target.value)} required autoFocus />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" type="button" onClick={() => setStep("upload")}>← Back</Button>
                <Button type="submit" className="flex-1" disabled={!flowName.trim()}>
                  <Upload className="mr-2 h-4 w-4" />Upload & Parse
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center py-8 text-center">
              {status === "uploading" && (
                <>
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Parsing your flow...</p>
                  <p className="mt-1 text-xs text-muted-foreground">This may take a few seconds</p>
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-400" />
                  <p className="text-sm font-medium text-foreground">Flow parsed successfully!</p>
                  <p className="mt-1 text-xs text-muted-foreground">Redirecting to canvas...</p>
                </>
              )}
              {status === "error" && (
                <>
                  <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
                  <p className="text-sm font-medium text-foreground">Parse failed</p>
                  <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
                  <Button variant="outline" className="mt-4" onClick={reset}>Try Again</Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

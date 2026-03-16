"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  UploadCloud,
  Mail,
  Settings2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Loader2,
  FileText,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import Papa from "papaparse";

// --- Types ---
interface Contact {
  name: string;
  email: string;
  status?: string;
  [key: string]: any;
}

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  pass: string;
}

interface EmailDraft {
  id: string;
  contact: Contact;
  subject: string;
  body: string;
  status: "pending" | "approved" | "rejected" | "sent";
}

const PREDEFINED_TEMPLATES = [
  {
    name: "Example Template: General Tech",
    content:
      "SUBJECT: [Hackathon Name] Partnership - [Company Name]\n\nHi [Contact Name],\n\nI’m [Your Name], an organizer for [Hackathon Name], an upcoming hackathon happening on [Date] at [Location/Online].\n\nI saw [Company Name]’s recent [Use Perplexity: specific update/launch] and thought it was incredibly innovative. We believe our attendees would build amazing things with your technology.\n\nWe are currently seeking sponsors to help make this event a reality for our participants. Sponsoring us is a fantastic way to introduce your tools to passionate builders.\n\nWould you be open to a brief chat next week about potential collaboration?\n\nThanks,\n[Your Name]\nOrganizer, [Hackathon Name]\n[Link to website]",
  },
];

// --- Main Page Component ---
export default function EmailBotDashboard() {
  // State
  const [step, setStep] = useState<1 | 2>(1);
  const [gmailUser, setGmailUser] = useState("");
  const [gmailPass, setGmailPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ccEmail, setCcEmail] = useState("");
  const [usageCode, setUsageCode] = useState("");
  const [showUsageCode, setShowUsageCode] = useState(false);
  const [quota, setQuota] = useState<{
    usageToday: number;
    limitPerDay: number;
    isUnlimited: boolean;
    expiresAt?: string;
    activatedAt?: string;
    durationDays?: number;
  } | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [autoSendDelay, setAutoSendDelay] = useState(8);

  const playSkipSound = () => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const playRegenerateSound = () => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const playSendSound = () => {
    if (isMuted) return;
    try {
      // Small, subtle pop/click sound using Web Audio API
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch (A5)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Audio not supported or blocked");
    }
  };

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [accounts, setAccounts] = useState<EmailAccount[]>([
    { id: "1", name: "", email: "", pass: "" },
  ]);

  const [contacts, setContacts] = useState<Contact[]>([
    { name: "BACH HackerSpaces", email: "bach@lists.hackerspaces.org" },
    { name: "Plug And Play Tech Center", email: "allison@pnptc.com" },
    { name: "Raspberry Pi Foundation", email: "legal@raspberrypi.org" },
    { name: "Broadcom", email: "davy.chou@broadcom.com" },
    { name: "Palo Alto Networks", email: "mstapleton@paloaltonetworks.com" },
    { name: "AMD", email: "aelshimi@amd.com" },
    { name: "Nokia", email: "dave.korn@nokia.com" },
    { name: "RapidAPI", email: "privacy@rapidAPI.com" },
    { name: "AoPS", email: "student-services@aops.com" },
    { name: "Juniper Networks", email: "dand@juniper.net" },
    { name: "Desmos", email: "support@desmos.com" },
    { name: "Wolfram", email: "sw-media@wolfram.com" },
    { name: "Echo3D", email: "megan@echo3d.com" },
    { name: "LaunchX", email: "info@launchx.com" },
    { name: "Oracle", email: "heather.vancura@oracle.com" },
    { name: "Meta", email: "braddressler@meta.com" },
    { name: "Bay Area 3D Printing", email: "sales@bayarea3dprinting.com" },
    { name: "Micron", email: "hrsupport_na@micron.com" },
  ]);

  const [csvUploaded, setCsvUploaded] = useState(false);

  useEffect(() => {
    const savedAccounts = localStorage.getItem("hp_accounts");
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        if (parsed.length > 0) setAccounts(parsed);
        // Sync basic mode inputs to the first account if returning
        setGmailUser(parsed[0].email || "");
        setGmailPass(parsed[0].pass || "");
      } catch (e) {}
    } else {
      const savedEmail = localStorage.getItem("hp_email");
      const savedPass = localStorage.getItem("hp_pass");
      if (savedEmail) setGmailUser(savedEmail);
      if (savedPass) setGmailPass(savedPass);
      if (savedEmail || savedPass) {
        setAccounts([
          { id: "1", name: "", email: savedEmail || "", pass: savedPass || "" },
        ]);
      }
    }

    const savedAdvanced = localStorage.getItem("hp_advanced");
    if (savedAdvanced === "true") setIsAdvancedMode(true);

    const savedCode = localStorage.getItem("hp_code");
    if (savedCode) setUsageCode(savedCode);

    const savedCc = localStorage.getItem("hp_cc");
    if (savedCc) setCcEmail(savedCc);

    const savedTemplate = localStorage.getItem("hp_template");
    if (savedTemplate) setTemplate(savedTemplate);

    const savedAutoTemplates = localStorage.getItem("hp_auto_templates");
    if (savedAutoTemplates) setAutoTemplatesText(savedAutoTemplates);

    const savedDelay = localStorage.getItem("hp_auto_delay");
    if (savedDelay) setAutoSendDelay(parseInt(savedDelay, 10));

    const savedContacts = localStorage.getItem("hp_contacts");
    if (savedContacts) {
      try {
        const parsed = JSON.parse(savedContacts);
        if (parsed && parsed.length > 0) {
          setContacts(parsed);
          setCsvUploaded(true);
        }
      } catch (e) {}
    }

    const savedMuted = localStorage.getItem("hp_muted");
    if (savedMuted === "true") setIsMuted(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("hp_muted", isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem("hp_auto_delay", autoSendDelay.toString());
  }, [autoSendDelay]);

  useEffect(() => {
    if (csvUploaded && contacts.length > 0) {
      localStorage.setItem("hp_contacts", JSON.stringify(contacts));
    }
  }, [contacts, csvUploaded]);

  useEffect(() => {
    if (!isAdvancedMode) {
      localStorage.setItem("hp_email", gmailUser);
      setAccounts((prev) => [
        { ...prev[0], email: gmailUser, pass: gmailPass },
        ...prev.slice(1),
      ]);
    }
  }, [gmailUser]);

  useEffect(() => {
    if (!isAdvancedMode) {
      localStorage.setItem("hp_pass", gmailPass);
      setAccounts((prev) => [
        { ...prev[0], email: gmailUser, pass: gmailPass },
        ...prev.slice(1),
      ]);
    }
  }, [gmailPass]);

  useEffect(() => {
    localStorage.setItem("hp_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("hp_advanced", isAdvancedMode.toString());
  }, [isAdvancedMode]);

  const addAccount = () => {
    setAccounts((prev) => [
      ...prev,
      { id: Math.random().toString(), name: "", email: "", pass: "" },
    ]);
  };

  const removeAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAccount = (
    id: string,
    field: keyof EmailAccount,
    value: string,
  ) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  useEffect(() => {
    localStorage.setItem("hp_cc", ccEmail);
  }, [ccEmail]);

  useEffect(() => {
    localStorage.setItem("hp_code", usageCode);
    if (usageCode) {
      fetch(`/api/usage?code=${usageCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setQuota({
              usageToday: data.usageToday,
              limitPerDay: data.limitPerDay,
              isUnlimited: data.isUnlimited,
              expiresAt: data.expiresAt,
              activatedAt: data.activatedAt,
              durationDays: data.durationDays,
            });
          } else {
            setQuota(null);
          }
        })
        .catch(() => setQuota(null));
    } else {
      setQuota(null);
    }
  }, [usageCode]);
  const [template, setTemplate] = useState(PREDEFINED_TEMPLATES[0].content);
  const [autoTemplatesText, setAutoTemplatesText] = useState(
    PREDEFINED_TEMPLATES.map((t) => `--- ${t.name} ---\n${t.content}`).join(
      "\n\n",
    ),
  );

  useEffect(() => {
    localStorage.setItem("hp_template", template);
  }, [template]);

  useEffect(() => {
    localStorage.setItem("hp_auto_templates", autoTemplatesText);
  }, [autoTemplatesText]);

  const [sendProspectus, setSendProspectus] = useState(false);
  const [prospectusFile, setProspectusFile] = useState<{
    name: string;
    base64: string;
  } | null>(null);

  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prospectusInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const isGeneratingRef = useRef(false);
  // --- Handlers ---
  const handleProspectusUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProspectusFile({
        name: file.name,
        base64,
      });

      // Background upload to Supabase
      fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type || "application/pdf",
          usageCode: usageCode,
        }),
      }).catch((e) => console.error("Cloud backup failed", e));
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".csv")) {
      // Background upload original CSV to Supabase
      const reader = new FileReader();
      reader.onload = () => {
        fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileData: reader.result as string,
            mimeType: file.type || "text/csv",
            usageCode: usageCode,
          }),
        }).catch((err) => console.error("Cloud backup failed", err));
      };
      reader.readAsDataURL(file);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedContacts = results.data
            .map((row: any) => ({
              ...row,
              name: row.Name || row.name || Object.values(row)[0] || "There",
              email:
                row.Email ||
                row.email ||
                Object.values(row).find(
                  (v: any) => typeof v === "string" && v.includes("@"),
                ) ||
                "",
            }))
            .filter((c: any) => Object.keys(c).length > 0);
          setContacts(parsedContacts);
          setCsvUploaded(true);
          setDrafts([]);
          setCurrentIndex(0);
        },
      });
    }
  };

  const generateEmails = async () => {
    if (isGeneratingRef.current) return;
    if (!contacts.length) {
      alert("Please upload contacts first.");
      return;
    }
    if (quota && !quota.isUnlimited && quota.usageToday >= quota.limitPerDay) {
      alert(
        "You have run out of daily quota! Please check back tomorrow or request a new code.",
      );
      return;
    }

    // Don't reset drafts if we're seamlessly loading the next batch
    const draftedEmails = new Set(
      drafts.map((d) => d.contact.originalEmail || d.contact.email),
    );

    // Filter out contacts that are already sent or rejected, AND not already in drafts
    const contactsToProcess = contacts
      .filter(
        (c) =>
          c.status !== "sent" &&
          c.status !== "rejected" &&
          !draftedEmails.has(c.email),
      )
      .slice(0, 10); // Limit batch to 10

    if (!contactsToProcess.length) {
      setIsGenerating(false);
      isGeneratingRef.current = false;
      if (drafts.length === 0) {
        alert("All contacts have been processed!");
        setStep(1);
      }
      return;
    }

    if (sendProspectus && !prospectusFile) {
      alert("You selected 'Attach Prospectus' but didn't upload a file.");
      setIsGenerating(false);
      isGeneratingRef.current = false;
      setStep(1);
      return;
    }

    cancelRef.current = false;
    setIsGenerating(true);
    isGeneratingRef.current = true;
    setStep(2);
    // Process sequentially or in small batches to avoid rate limits
    for (const contact of contactsToProcess) {
      if (cancelRef.current) break;
      try {
        const prompt =
          template === "AUTO"
            ? `You are an expert cold email writer with web search capabilities.
          Raw Contact Details: ${JSON.stringify(contact)}

          You have access to the following templates:
          ${autoTemplatesText}

          Instructions:
          1. Analyze the raw contact details below. Find the best email address to contact, and figure out the person's name or company name based on the data.
          2. Select the most appropriate template from the list above based on the company's industry.
          3. Look up the company online using your web search capabilities to find a REAL, specific, and very recent factual update, product launch, or API feature.
          4. Replace [Company Name] with the company name you inferred.
          5. Replace [Contact Name] with a generic greeting like "Team" or a first name if you can infer one.
          6. CRITICALLY: Replace the [Use Perplexity: ...] placeholder with the recent factual update you found online.
          7. Keep the rest of the chosen template EXACTLY the same.

          Return ONLY the customized email content using the EXACT format below:
          TARGET_EMAIL: [extracted email address from data]
          SUBJECT: [Your subject line here]
          [The rest of the email body]`
            : `You are an expert cold email writer with web search capabilities.
          Template: """${template}"""
          Raw Contact Details: ${JSON.stringify(contact)}

          Instructions:
          1. Analyze the raw contact details below. Find the best email address to contact, and figure out the person's name or company name.
          2. Replace [Company Name] with the contact's company name.
          3. Replace [Contact Name] with a generic greeting like "Team" or a first name if you can infer one.
          4. CRITICALLY: Look up the company online using your web search capabilities to find a REAL, specific, and very recent factual update, product launch, or API feature about the company, and replace the [Use Perplexity: ...] placeholder with this information.
          5. Keep the rest of the template EXACTLY the same.

          Return ONLY the customized email content using the EXACT format below:
          TARGET_EMAIL: [extracted email address from data]
          SUBJECT: [Your subject line here]
          [The rest of the email body]`;

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            usageCode,
            model: "llama-3.3-70b-versatile",
            isRegeneration: false,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.error ||
              errData.error?.message ||
              `Groq API Error: ${response.statusText}`,
          );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        let subject = "Partnership Opportunity";
        let body = content;
        let targetEmail = contact.email || "";

        const lines = content.split("\n");
        let bodyStartIndex = 0;

        for (let i = 0; i < Math.min(lines.length, 5); i++) {
          if (lines[i].toUpperCase().startsWith("TARGET_EMAIL:")) {
            targetEmail = lines[i].replace(/TARGET_EMAIL:/i, "").trim();
            bodyStartIndex = Math.max(bodyStartIndex, i + 1);
          }
          if (lines[i].toUpperCase().startsWith("SUBJECT:")) {
            subject = lines[i].replace(/SUBJECT:/i, "").trim();
            bodyStartIndex = Math.max(bodyStartIndex, i + 1);
          }
        }

        body = lines.slice(bodyStartIndex).join("\n").trim();

        const updatedContact = {
          ...contact,
          email: targetEmail,
          originalEmail: contact.email,
        };

        // Force a re-fetch of the quota from the backend so that
        // activatedAt and expiresAt populate if it was just activated
        fetch(`/api/usage?code=${usageCode}`)
          .then((res) => res.json())
          .then((usageData) => {
            if (usageData.valid) {
              setQuota({
                usageToday: usageData.usageToday,
                limitPerDay: usageData.limitPerDay,
                isUnlimited: usageData.isUnlimited,
                expiresAt: usageData.expiresAt,
                activatedAt: usageData.activatedAt,
                durationDays: usageData.durationDays,
              });
            }
          });

        setDrafts((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            contact: updatedContact,
            subject,
            body,
            status: "pending",
          },
        ]);
      } catch (error: any) {
        console.error("Failed to generate for", contact.email, error);
        // Stop the loop and show the error directly to the user
        alert(
          `Error generating email for ${contact.email}: ${error.message || "Failed to connect to AI API"}`,
        );
        setIsGenerating(false);
        isGeneratingRef.current = false;
        setStep(1);
        return;
      }
    }

    setIsGenerating(false);
    isGeneratingRef.current = false;
  };

  const updateDraftStatus = async (
    id: string,
    status: EmailDraft["status"],
  ) => {
    if (
      status === "approved" &&
      quota &&
      !quota.isUnlimited &&
      quota.usageToday >= quota.limitPerDay
    ) {
      alert(
        "You have run out of daily quota! Please check back tomorrow or request a new code.",
      );
      return;
    }

    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    const draft = drafts.find((d) => d.id === id);
    let finalStatus = status;

    if (status === "rejected") {
      playSkipSound();
    }

    if (status === "approved") {
      const activeAccounts = isAdvancedMode
        ? accounts.filter((a) => a.email && a.pass)
        : [{ name: "", email: gmailUser, pass: gmailPass }];

      if (draft && activeAccounts.length > 0) {
        // Round-robin selection based on currentIndex
        const acctIndex = currentIndex % activeAccounts.length;
        const sender = activeAccounts[acctIndex];

        try {
          const res = await fetch("/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gmailUser: sender.email,
              gmailPass: sender.pass,
              senderName: sender.name,
              usageCode,
              to: draft.contact.email,
              cc: ccEmail || undefined,
              subject: draft.subject,
              text: draft.body,
              ...(sendProspectus && prospectusFile
                ? {
                    attachmentBase64: prospectusFile.base64,
                    attachmentName: prospectusFile.name,
                  }
                : {}),
            }),
          });
          const data = await res.json();
          if (data.success) {
            finalStatus = "sent";
            playSendSound();
            setDrafts((prev) =>
              prev.map((d) => (d.id === id ? { ...d, status: "sent" } : d)),
            );
          } else {
            console.error("Failed to send:", data.error);
            finalStatus = "pending";
            setDrafts((prev) =>
              prev.map((d) => (d.id === id ? { ...d, status: "pending" } : d)),
            );
          }
        } catch (error) {
          console.error("Error sending email:", error);
          finalStatus = "pending";
          setDrafts((prev) =>
            prev.map((d) => (d.id === id ? { ...d, status: "pending" } : d)),
          );
        }
      } else if (
        activeAccounts.length === 0 ||
        !activeAccounts[0].email ||
        !activeAccounts[0].pass
      ) {
        alert(
          "Please provide valid Gmail credentials in the configuration step to send emails.",
        );
        finalStatus = "pending";
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "pending" } : d)),
        );
      }
    }

    if (draft) {
      setContacts((prev) =>
        prev.map((c) =>
          c.email === (draft.contact.originalEmail || draft.contact.email)
            ? { ...c, status: finalStatus }
            : c,
        ),
      );
    }

    // Move to next email
    setCurrentIndex((prev) => prev + 1);
  };

  // Seamless continuous generation
  useEffect(() => {
    if (
      step === 2 &&
      !isGenerating &&
      !isGeneratingRef.current &&
      drafts.length > 0 &&
      currentIndex >= drafts.length - 2 &&
      !cancelRef.current
    ) {
      const draftedEmails = new Set(
        drafts.map((d) => d.contact.originalEmail || d.contact.email),
      );
      const remaining = contacts.filter(
        (c) =>
          c.status !== "sent" &&
          c.status !== "rejected" &&
          !draftedEmails.has(c.email),
      );
      if (remaining.length > 0) {
        generateEmails();
      }
    }
  }, [currentIndex, drafts.length, isGenerating, step, contacts]);

  const [autoSendEnabled, setAutoSendEnabled] = useState(false);

  const updateDraftStatusRef = useRef(updateDraftStatus);
  useEffect(() => {
    updateDraftStatusRef.current = updateDraftStatus;
  }, [updateDraftStatus]);

  const currentDraftId = drafts[currentIndex]?.id;
  const [autoSendCountdown, setAutoSendCountdown] = useState(autoSendDelay);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (autoSendEnabled && currentDraftId) {
      setAutoSendCountdown(autoSendDelay);
      interval = setInterval(() => {
        setAutoSendCountdown((prev) => {
          if (prev <= 1) {
            updateDraftStatusRef.current(currentDraftId, "approved");
            return autoSendDelay;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoSendCountdown(autoSendDelay);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentDraftId, autoSendEnabled, autoSendDelay]);

  const regenerateDraft = async (id: string) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;

    if (
      quota &&
      !quota.isUnlimited &&
      quota.usageToday + 0.5 > quota.limitPerDay
    ) {
      alert("You don't have enough quota left to regenerate (costs 0.5).");
      return;
    }

    playRegenerateSound();

    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, body: "Regenerating...", subject: "..." } : d,
      ),
    );

    try {
      const prompt =
        template === "AUTO"
          ? `You are an expert cold email writer with web search capabilities.
          Raw Contact Details: ${JSON.stringify(draft.contact)}

          You have access to the following templates:
          ${autoTemplatesText}

          Instructions:
          1. Analyze the raw contact details below. Find the best email address to contact, and figure out the person's name or company name based on the data.
          2. Select the most appropriate template from the list above based on the company's industry.
          3. Look up the company online using your web search capabilities to find a REAL, specific, and very recent factual update, product launch, or API feature.
          4. Replace [Company Name] with the company name you inferred.
          5. Replace [Contact Name] with a generic greeting like "Team" or a first name if you can infer one.
          6. CRITICALLY: Replace the [Use Perplexity: ...] placeholder with the recent factual update you found online.
          7. Keep the rest of the chosen template EXACTLY the same.

          IMPORTANT: This is a retry. Do not mention that this is a retry. Just write a new, slightly different version using a different creative angle.
          Return ONLY the customized email content using the EXACT format below:
          TARGET_EMAIL: [extracted email address from data]
          SUBJECT: [Your subject line here]
          [The rest of the email body]`
          : `You are an expert cold email writer with web search capabilities.
          Template: """${template}"""
          Raw Contact Details: ${JSON.stringify(draft.contact)}

          Instructions:
          1. Analyze the raw contact details below. Find the best email address to contact, and figure out the person's name or company name.
          2. Replace [Company Name] with the contact's company name.
          3. Replace [Contact Name] with a generic greeting like "Team" or a first name if you can infer one.
          4. CRITICALLY: Look up the company online using your web search capabilities to find a REAL, specific, and very recent factual update, product launch, or API feature about the company, and replace the [Use Perplexity: ...] placeholder with this information.
          5. Keep the rest of the template EXACTLY the same.

          IMPORTANT: This is a retry. Do not mention that this is a retry. Just write a new, slightly different version using a different creative angle.
          Return ONLY the customized email content using the EXACT format below:
          TARGET_EMAIL: [extracted email address from data]
          SUBJECT: [Your subject line here]
          [The rest of the email body]`;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          usageCode,
          model: "llama-3.3-70b-versatile",
          isRegeneration: true,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to regenerate");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      let subject = "Partnership Opportunity";
      let body = content;

      const lines = content.split("\n");
      let bodyStartIndex = 0;

      for (let i = 0; i < Math.min(lines.length, 3); i++) {
        if (lines[i].toUpperCase().startsWith("SUBJECT:")) {
          subject = lines[i].replace(/SUBJECT:/i, "").trim();
          bodyStartIndex = Math.max(bodyStartIndex, i + 1);
        }
      }

      body = lines.slice(bodyStartIndex).join("\n").trim();

      setQuota((prev) =>
        prev ? { ...prev, usageToday: prev.usageToday + 0.5 } : prev,
      );

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                subject,
                body,
              }
            : d,
        ),
      );
    } catch (error: any) {
      console.error("Regeneration failed", error);
      alert(error.message || "Failed to regenerate.");
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, body: draft.body, subject: draft.subject } : d,
        ),
      );
    }
  };

  const downloadCSV = () => {
    const remainingContacts = contacts.filter(
      (c) => c.status !== "sent" && c.status !== "rejected",
    );

    if (remainingContacts.length === 0) {
      alert("All contacts have been processed! Nothing to save.");
      return;
    }

    const csv = Papa.unparse(remainingContacts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "email_campaign_progress.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(
      "Progress saved! Next time you open the app, just upload this file on the Configure page to resume exactly where you left off.",
    );
  };

  const stopGenerationAndGoBack = () => {
    cancelRef.current = true;
    setIsGenerating(false);
    isGeneratingRef.current = false;
    setAutoSendEnabled(false);
    setDrafts([]);
    setCurrentIndex(0);
    setStep(1);
  };

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-white text-black font-mono selection:bg-gray-200 overflow-y-auto relative">
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-black pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight uppercase">
                hackpilot
              </h1>
              <span className="bg-black text-white text-xs font-bold px-2 py-1 uppercase tracking-wider">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500 text-sm lowercase font-bold">
                organizer
              </p>
              {quota && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      quota.isUnlimited || quota.usageToday < quota.limitPerDay
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    Quota:{" "}
                    {quota.isUnlimited
                      ? "Unlimited"
                      : `${quota.usageToday} / ${quota.limitPerDay}`}
                  </span>
                  {!quota.isUnlimited && (
                    <span className="text-xs font-bold uppercase px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100 text-blue-800">
                      {quota.expiresAt
                        ? `Expires in ${Math.max(
                            0,
                            Math.ceil(
                              (new Date(quota.expiresAt).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24),
                            ),
                          )} days`
                        : `Unactivated (${quota.durationDays} Days)`}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-500 hover:text-black transition-colors"
                title={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 border border-black px-4 py-2 bg-white w-fit">
            <span className={step === 1 ? "text-black font-bold" : ""}>
              1. Configure
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className={step === 2 ? "text-black font-bold" : ""}>
              2. Review & Send
            </span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column - Config */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-black p-6">
                  <div className="flex items-center gap-2 mb-6 border-b border-black pb-2">
                    <Settings2 className="w-5 h-5 text-black" />
                    <h2 className="text-lg font-bold uppercase">
                      Integrations
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center justify-between text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-bold">
                        <span>Hackpilot Usage Code</span>
                        <a
                          href="mailto:shlokmadhekar88@gmail.com?subject=Hackpilot%20Usage%20Code%20Request&body=Hi%20Shlok%2C%0A%0AI%20would%20like%20to%20request%20a%20Hackpilot%20usage%20code.%0A%0AHackathon%20Name%3A%20%5BYour%20Hackathon%5D%0ADate%3A%20%5BDate%5D%0AExpected%20Attendees%3A%20%5BNumber%5D%0A%0AThanks%21"
                          className="text-blue-500 hover:underline lowercase"
                        >
                          ask me &rarr;
                        </a>
                      </label>
                      <div className="relative">
                        <input
                          type={showUsageCode ? "text" : "password"}
                          value={usageCode}
                          onChange={(e) => setUsageCode(e.target.value)}
                          className="w-full bg-white border border-black py-2.5 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                          placeholder="e.g. WK-XXXXXX"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUsageCode(!showUsageCode)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                        >
                          {showUsageCode ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider font-bold">
                        Gmail Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={gmailUser}
                          onChange={(e) => setGmailUser(e.target.value)}
                          className="w-full bg-white border border-black py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                          placeholder="you@gmail.com"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 mb-2 border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-bold uppercase">
                        Sending Accounts
                      </h3>
                      <button
                        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-2 py-1 border border-black font-bold uppercase"
                      >
                        {isAdvancedMode ? "Basic Mode" : "Advanced Mode"}
                      </button>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider font-bold">
                        CC Email (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={ccEmail}
                          onChange={(e) => setCcEmail(e.target.value)}
                          className="w-full bg-white border border-black py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                          placeholder="team@myhackathon.com"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        Send a copy of every approved email here for tracking.
                      </p>
                    </div>

                    {!isAdvancedMode ? (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider font-bold">
                            Gmail Address
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              value={gmailUser}
                              onChange={(e) => setGmailUser(e.target.value)}
                              className="w-full bg-white border border-black py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                              placeholder="you@gmail.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center justify-between text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-bold">
                            <span>App Password</span>
                            <a
                              href="https://myaccount.google.com/apppasswords"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline lowercase"
                            >
                              get one here &rarr;
                            </a>
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={gmailPass}
                              onChange={(e) =>
                                setGmailPass(e.target.value.replace(/\s/g, ""))
                              }
                              className="w-full bg-white border border-black py-2.5 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                              placeholder="••••••••••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-500 mb-2">
                          Add multiple sender accounts. Emails will be sent
                          round-robin to avoid rate limits.
                        </p>
                        {accounts.map((acc, idx) => (
                          <div
                            key={acc.id}
                            className="border border-gray-300 p-3 relative group"
                          >
                            {accounts.length > 1 && (
                              <button
                                onClick={() => removeAccount(acc.id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <input
                                  type="text"
                                  value={acc.name}
                                  onChange={(e) =>
                                    updateAccount(
                                      acc.id,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-white border border-black py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                                  placeholder="Sender Name (e.g. John Doe)"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="email"
                                  value={acc.email}
                                  onChange={(e) =>
                                    updateAccount(
                                      acc.id,
                                      "email",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-white border border-black py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                                  placeholder="Email Address"
                                />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={acc.pass}
                                  onChange={(e) =>
                                    updateAccount(
                                      acc.id,
                                      "pass",
                                      e.target.value.replace(/\s/g, ""),
                                    )
                                  }
                                  className="w-full bg-white border border-black py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                                  placeholder="App Password"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={addAccount}
                          className="flex items-center gap-1 text-xs font-bold text-black border border-black px-3 py-1.5 hover:bg-gray-100 uppercase"
                        >
                          <Plus className="w-3 h-3" /> Add Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-black p-6">
                  <div className="flex items-center justify-between mb-4 border-b border-black pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-black" />
                      <h2 className="text-lg font-bold uppercase">
                        Data Source
                      </h2>
                    </div>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-black p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-all group"
                  >
                    <UploadCloud className="w-8 h-8 text-black mb-3" />
                    <p className="text-sm font-bold uppercase">
                      Upload CSV Contacts
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Names & Emails required
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                  </div>

                  {csvUploaded && contacts.length > 0 && (
                    <div className="mt-4 bg-gray-100 border border-black text-black p-3 text-sm flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Loaded {contacts.length} contacts
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Template & Actions */}
              <div className="lg:col-span-8 space-y-6 flex flex-col">
                <div className="bg-white border border-black p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-black pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-black" />
                      <h2 className="text-lg font-bold uppercase">
                        Campaign Template
                      </h2>
                    </div>
                    <select
                      className="bg-white border border-black px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                      onChange={(e) => {
                        if (e.target.value === "AUTO") {
                          setTemplate("AUTO");
                        } else if (e.target.value !== "CUSTOM") {
                          const selected = PREDEFINED_TEMPLATES.find(
                            (t) => t.name === e.target.value,
                          );
                          if (selected) setTemplate(selected.content);
                        }
                      }}
                      value={
                        template === "AUTO"
                          ? "AUTO"
                          : PREDEFINED_TEMPLATES.find(
                              (t) => t.content === template,
                            )?.name || "CUSTOM"
                      }
                    >
                      <option value="AUTO">✨ Auto-select via AI</option>
                      {PREDEFINED_TEMPLATES.map((t, i) => (
                        <option key={i} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                      <option value="CUSTOM">✏️ Custom</option>
                    </select>
                  </div>

                  <div className="mb-4 bg-yellow-50 border border-yellow-400 p-3 text-xs text-yellow-800 font-bold uppercase flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(250,204,21,1)]">
                    <span className="text-base leading-none">⚠️</span>
                    <p>
                      Important: You must manually replace [Hackathon Name],
                      [Date], and [Your Name] in your templates. The AI cannot
                      guess these details!
                    </p>
                  </div>

                  <textarea
                    value={template === "AUTO" ? autoTemplatesText : template}
                    onChange={(e) => {
                      if (template === "AUTO")
                        setAutoTemplatesText(e.target.value);
                      else setTemplate(e.target.value);
                    }}
                    className="flex-1 w-full bg-white border border-black p-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none min-h-[300px] leading-relaxed font-sans"
                    placeholder={
                      template === "AUTO"
                        ? "Define your custom templates here..."
                        : "Write your base template here."
                    }
                  />

                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4">
                    <label className="flex items-center gap-2 text-sm font-bold uppercase text-black cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={sendProspectus}
                        onChange={(e) => setSendProspectus(e.target.checked)}
                        className="w-4 h-4 border-black border-2 rounded-none accent-black"
                      />
                      Attach Prospectus (First Email)
                    </label>
                    {sendProspectus && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => prospectusInputRef.current?.click()}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 border border-black font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
                        >
                          Upload PDF
                        </button>
                        <span className="text-xs text-gray-600 truncate max-w-[200px]">
                          {prospectusFile
                            ? prospectusFile.name
                            : "No file selected"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          ref={prospectusInputRef}
                          onChange={handleProspectusUpload}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={generateEmails}
                      disabled={!contacts.length || isGenerating}
                      className="bg-black hover:bg-gray-800 text-white px-8 py-3 font-bold uppercase transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      {isGenerating
                        ? "Generating..."
                        : "Start Generating Emails"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-8 border-b border-black pb-4">
                <div>
                  <h2 className="text-2xl font-bold uppercase">
                    Review & Send
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Approve the AI-generated drafts before sending.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 border border-black px-3 py-1.5">
                      <label className="flex items-center gap-2 text-sm font-bold uppercase text-black cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoSendEnabled}
                          onChange={(e) => setAutoSendEnabled(e.target.checked)}
                          className="w-4 h-4 border-black border-2 rounded-none accent-black"
                        />
                        Auto-Send
                      </label>
                      <div className="w-px h-4 bg-gray-400 mx-1"></div>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={autoSendDelay}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) setAutoSendDelay(val);
                        }}
                        disabled={autoSendEnabled}
                        className="w-12 bg-white border border-black text-center text-sm font-bold py-1 focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50"
                      />
                      <span className="text-xs font-bold uppercase text-gray-500">
                        sec
                      </span>
                    </div>
                    <button
                      onClick={downloadCSV}
                      className="text-sm text-black hover:bg-gray-100 transition-colors flex items-center gap-2 bg-white border border-black px-4 py-2 font-bold uppercase"
                    >
                      <FileText className="w-4 h-4" /> Save Progress
                    </button>
                    <button
                      onClick={stopGenerationAndGoBack}
                      className="text-sm text-black hover:bg-gray-100 transition-colors flex items-center gap-2 border border-black px-4 py-2 font-bold uppercase h-full"
                    >
                      <Settings2 className="w-4 h-4" /> Back & Stop
                    </button>
                  </div>
                  {autoSendDelay < 5 && (
                    <span className="text-xs font-bold text-red-600 uppercase">
                      ⚠️ Warning: Under 5s increases risk of spam blocking
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full relative min-h-[600px]">
                <AnimatePresence mode="popLayout">
                  {drafts.length > 0 && currentIndex < drafts.length ? (
                    <motion.div
                      key={drafts[currentIndex].id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", bounce: 0.3 }}
                      className={`w-full bg-white border border-black p-8 flex flex-col relative overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
                    >
                      <div className="absolute top-0 right-0 flex items-center bg-white z-10">
                        {autoSendEnabled && (
                          <div className="px-4 py-3 text-xs font-bold text-black border-l border-b border-black bg-yellow-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                            Auto-Sending in {autoSendCountdown}s
                          </div>
                        )}
                        <div className="p-4 text-xs font-bold text-gray-500 border-l border-b border-black">
                          {currentIndex + 1} / {drafts.length}{" "}
                          {isGenerating ? "(Generating...)" : ""}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          To
                        </div>
                        <div className="font-bold text-black text-lg">
                          {drafts[currentIndex].contact.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {drafts[currentIndex].contact.email}
                        </div>
                      </div>

                      {isAdvancedMode && accounts.length > 0 && (
                        <div className="mb-6 border-b border-gray-200 pb-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                            Sending From
                          </div>
                          <div className="font-bold text-black text-sm">
                            {
                              accounts.filter((a) => a.email && a.pass)[
                                currentIndex %
                                  Math.max(
                                    1,
                                    accounts.filter((a) => a.email && a.pass)
                                      .length,
                                  )
                              ]?.email
                            }
                          </div>
                        </div>
                      )}

                      <div className="mb-6">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          Subject
                        </div>
                        <div className="text-md font-bold text-black border-b border-gray-200 pb-2 font-sans">
                          {drafts[currentIndex].subject}
                        </div>
                      </div>

                      <div className="flex-1 bg-gray-50 p-6 mb-8 text-sm text-black whitespace-pre-wrap overflow-y-auto max-h-[300px] border border-black custom-scrollbar font-sans">
                        {drafts[currentIndex].body}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-auto">
                        <button
                          onClick={() => {
                            setAutoSendEnabled(false);
                            updateDraftStatus(
                              drafts[currentIndex].id,
                              "rejected",
                            );
                          }}
                          className="flex flex-col items-center justify-center gap-2 py-3 hover:bg-red-50 text-black transition-colors border border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                        >
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span>Reject & Next</span>
                        </button>
                        <button
                          onClick={() => {
                            setAutoSendEnabled(false);
                            regenerateDraft(drafts[currentIndex].id);
                          }}
                          className="flex flex-col items-center justify-center gap-2 py-3 hover:bg-gray-100 text-black transition-colors border border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>Retry</span>
                        </button>
                        <button
                          onClick={() => {
                            setAutoSendEnabled(false);
                            updateDraftStatus(
                              drafts[currentIndex].id,
                              "approved",
                            );
                          }}
                          className="flex flex-col items-center justify-center gap-2 py-3 bg-black hover:bg-gray-800 text-white transition-all border border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                        >
                          <Send className="w-5 h-5" />
                          <span>Approve & Send</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : isGenerating ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full bg-white border border-black p-12 flex flex-col items-center justify-center min-h-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Loader2 className="w-12 h-12 text-black animate-spin mb-6" />
                      <p className="text-black font-bold uppercase text-lg animate-pulse">
                        Crafting your personalized emails...
                      </p>
                    </motion.div>
                  ) : drafts.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full bg-green-50 border border-black p-12 flex flex-col items-center justify-center min-h-[400px] text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <CheckCircle2 className="w-16 h-16 text-green-600 mb-6" />
                      <h3 className="text-2xl font-bold text-black mb-2 uppercase">
                        You're all caught up!
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md">
                        You've reviewed all contacts in your list. Check your
                        sent folder for the approved ones.
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={downloadCSV}
                          className="bg-white hover:bg-gray-100 border border-black text-black px-6 py-3 font-bold uppercase transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                        >
                          <FileText className="w-5 h-5" /> Download Remaining
                        </button>
                        <button
                          onClick={stopGenerationAndGoBack}
                          className="bg-black hover:bg-gray-800 text-white px-6 py-3 font-bold uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                        >
                          Back to Home
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-black mt-12 text-sm uppercase font-bold text-gray-500">
        powered by{" "}
        <a
          href="https://hackpilot.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:underline"
        >
          hackpilot
        </a>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-left: 1px solid #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #000;
        }
      `,
        }}
      />
    </div>
  );
}

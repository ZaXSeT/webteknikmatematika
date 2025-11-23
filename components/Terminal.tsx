"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon } from "lucide-react";

interface TerminalProps {
    onLogin: (username: string) => void;
    onLogout: () => void;
    isLoggedIn: boolean;
    username?: string;
}

type LoginStep = "username" | "nim" | "password" | "processing" | "success" | "logged_in" | "reg_nim" | "reg_username" | "reg_password" | "idle";

const VALID_NIMS = [
    "03082240018", "03082240002", "03082240008", "03082240017", "03082240014",
    "03082240005", "03082240004", "03082240024", "03082240015", "03082240007",
    "03082240003", "03082240012", "03082240013", "03082240025", "03082240028",
    "03082240020", "03082240006", "03082240022", "03082240009"
];

export default function Terminal({ onLogin, onLogout, isLoggedIn, username }: TerminalProps) {
    const [lines, setLines] = useState<string[]>([
        "Welcome to TeknikMatematika v0.0.6",
        "System initialized...",
        "Type 'login' to authenticate or 'create user' to register.",
    ]);
    const [input, setInput] = useState("");
    const [step, setStep] = useState<LoginStep>("idle");
    const [credentials, setCredentials] = useState({ username: "", nim: "" });

    const [regData, setRegData] = useState({ username: "", nim: "", password: "" });

    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoggedIn) {
            setStep("logged_in");
            if (!lines.includes(`You have logged in ${username}.`)) {
                setLines(prev => [...prev, `You have logged in ${username}.`, "Type 'help' for available commands."]);
            }
        } else {
            if (step === "logged_in") {
                setStep("idle");
                setLines([
                    "Welcome to TeknikMatematika v0.0.6",
                    "System initialized...",
                    "Type 'login' to authenticate or 'create user' to register.",
                ]);
            }
        }
    }, [isLoggedIn, username]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        inputRef.current?.focus();
    }, [lines, step]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const command = input.trim();

        if (command === "reset") {
            if (isLoggedIn) {
                setLines([
                    "Terminal reset.",
                    `Welcome back, ${username}.`,
                    "Type 'help' for available commands."
                ]);
            } else {
                setLines([
                    "Welcome to TeknikMatematika v0.0.6",
                    "System initialized...",
                    "Type 'login' to authenticate or 'create user' to register.",
                ]);
                setStep("idle");
                setCredentials({ username: "", nim: "" });
                setRegData({ username: "", nim: "", password: "" });
            }
            setInput("");
            return;
        }

        if (step === "idle") {
            setLines(prev => [...prev, `guest@TeknikMatematika:~$ ${command}`]);

            if (command === "login") {
                setStep("username");
                setLines(prev => [...prev, "Initiating authentication sequence...", "Enter your username."]);
            } else if (command === "create user") {
                setStep("reg_nim");
                setLines(prev => [
                    ...prev,
                    "Initiating user creation protocol...",
                    "Enter your NIM:"
                ]);
            } else if (command === "help") {
                setLines(prev => [...prev, "Available commands:", "  login       - Start authentication", "  create user - Register a new account", "  clear       - Clear terminal output", "  help        - Show this help message"]);
            } else if (command === "clear") {
                setLines([]);
            } else {
                setLines(prev => [...prev, `Command not found: ${command}`]);
            }
            setInput("");
            return;
        }

        // Registration Steps
        if (step === "reg_nim") {
            const nim = command;
            if (!VALID_NIMS.includes(nim)) {
                setLines(prev => [
                    ...prev,
                    `> ${nim}`,
                    `Error: NIM '${nim}' is not registered in the database.`,
                    "Registration aborted."
                ]);
                setStep("idle");
                setRegData({ username: "", nim: "", password: "" });
            } else {
                setRegData(prev => ({ ...prev, nim }));
                setLines(prev => [...prev, `> ${nim}`, "NIM Validated.", "Username:"]);
                setStep("reg_username");
            }
            setInput("");
            return;
        }

        if (step === "reg_username") {
            const username = command;
            setRegData(prev => ({ ...prev, username }));
            setLines(prev => [...prev, `> ${username}`, "Password:"]);
            setStep("reg_password");
            setInput("");
            return;
        }

        if (step === "reg_password") {
            const password = command;
            const updatedRegData = { ...regData, password };
            setRegData(updatedRegData);
            setLines(prev => [...prev, `> ********`, "Creating account...", "Please wait..."]);
            setStep("processing");
            setInput("");

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedRegData),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setLines(prev => [...prev, "Account created successfully.", "You can now login with your credentials."]);
                    setRegData({ username: "", nim: "", password: "" });
                    setStep("idle");
                } else {
                    setLines(prev => [...prev, `Registration Failed: ${data.message}`]);
                    setStep("idle");
                }
            } catch (err: any) {
                setLines(prev => [...prev, `Registration Error: ${err.message || "System failure."}`]);
                setStep("idle");
            }
            return;
        }

        if (step === "logged_in") {
            setLines(prev => [...prev, `${username}@TeknikMatematika:~$ ${command}`]);

            if (command === "log out") {
                setLines(prev => [...prev, "Logging out...", "System shutting down..."]);
                setTimeout(() => {
                    onLogout();
                }, 1000);
            } else if (command === "login") {
                setLines(prev => [...prev, `Action denied: You are already logged in as ${username}.`]);
            } else if (command === "help") {
                setLines(prev => [...prev, "Available commands:", "  log out - Sign out of the system", "  clear   - Clear terminal output", "  reset   - Reset terminal session", "  help    - Show this help message"]);
            } else if (command === "clear") {
                setLines([]);
            } else {
                setLines(prev => [...prev, `Command not found: ${command}`]);
            }
            setInput("");
            return;
        }

        if (step === "username") {
            setCredentials(prev => ({ ...prev, username: input }));
            setLines((prev) => [...prev, `> username: ${input}`, "NIM required."]);
            setStep("nim");
            setInput("");
        } else if (step === "nim") {
            setCredentials(prev => ({ ...prev, nim: input }));
            setLines((prev) => [...prev, `> NIM: ${input}`, "Password required."]);
            setStep("password");
            setInput("");
        } else if (step === "password") {
            setLines((prev) => [...prev, `> password: *********`, "Verifying credentials..."]);
            setStep("processing");
            const passwordAttempt = input;
            setInput("");

            setTimeout(async () => {
                const { username, nim } = credentials;

                try {
                    const response = await fetch('/api/auth', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username,
                            nim,
                            password: passwordAttempt,
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        setLines((prev) => [...prev, "Access Granted.", "Loading modules..."]);
                        setStep("success");
                        setTimeout(() => {
                            onLogin(data.username);
                        }, 1000);
                    } else {
                        setLines((prev) => [
                            ...prev,
                            `Access Denied: ${data.message || "Invalid credentials."}`,
                            "Restarting authentication sequence...",
                            "----------------------------------------"
                        ]);
                        setStep("idle");
                        setCredentials({ username: "", nim: "" });
                    }
                } catch (error) {
                    setLines((prev) => [
                        ...prev,
                        "System Error: Unable to verify credentials.",
                        "Please try again later.",
                        "----------------------------------------"
                    ]);
                    setStep("idle");
                    setCredentials({ username: "", nim: "" });
                }
            }, 1500);
        }
    };

    const getPrompt = () => {
        switch (step) {
            case "idle": return "guest@TeknikMatematika:~$";
            case "username": return "user@TeknikMatematika:~$";
            case "reg_nim": return "Enter your NIM:";
            case "reg_username": return "Username:";
            case "reg_password": return "Password:";
            case "nim": return "NIM:";
            case "password": return "password:";
            case "logged_in": return `${username}@TeknikMatematika:~$`;
            default: return "";
        }
    };

    return (
        <div
            className="w-full max-w-2xl mx-auto bg-white/40 dark:bg-black/60 rounded-xl overflow-hidden border border-border shadow-2xl backdrop-blur-md font-mono text-sm md:text-base"
            onClick={() => inputRef.current?.focus()}
        >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <TerminalIcon size={12} />
                    <span>bash — 80x24</span>
                </div>
            </div>

            {/* Terminal Body */}
            <div
                ref={scrollRef}
                className="p-6 h-[500px] overflow-y-auto custom-scrollbar text-green-600 dark:text-green-500/90"
            >
                {lines.map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-1 break-words"
                    >
                        {line}
                    </motion.div>
                ))}

                {step !== "processing" && step !== "success" && (
                    <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2">
                        <span className="text-blue-600 dark:text-blue-400 whitespace-nowrap">{getPrompt()}</span>
                        <input
                            ref={inputRef}
                            type={step === "password" ? "password" : "text"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-foreground focus:ring-0 p-0"
                            autoFocus
                            autoComplete="off"
                        />
                    </form>
                )}
            </div>
        </div>
    );
}

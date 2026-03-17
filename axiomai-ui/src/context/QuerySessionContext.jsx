import React, { createContext, useState, useContext, useRef } from 'react';

const QuerySessionContext = createContext(null);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const QuerySessionProvider = ({ children }) => {
    const [state, setState] = useState({
        phase: "idle", // idle | retrieving | generating | validating | verifying | refreshing | done
        trustScore: 0,
        claims: [],
        citations: [],
        answer: "",
        status: null,
        reasoningLog: ["[SYSTEM] AXIOMAI initialized.", "[WAIT] Awaiting user query..."],
        error: null
    });

    const abortRef = useRef(false);

    const handleQuerySubmit = async (query) => {
        if (!query) return;
        abortRef.current = false;

        // All pipeline phases
        const allPhases = ['retrieving', 'generating', 'validating', 'verifying', 'refreshing'];

        setState({
            phase: "retrieving",
            trustScore: 0,
            claims: [],
            citations: [],
            answer: "",
            status: null,
            reasoningLog: [`[SYSTEM] New query received: "${query}"`],
            error: null
        });

        let apiData = null;
        let apiError = null;

        // Start API call (non-blocking)
        const fetchPromise = fetch('http://localhost:8000/api/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        }).then(async (response) => {
            if (!response.ok) throw new Error('Network response was not ok');
            apiData = await response.json();
        }).catch(err => {
            apiError = err;
        });

        // Animate through phases while API is loading
        for (let i = 1; i < allPhases.length; i++) {
            if (abortRef.current) return;
            await sleep(1200);
            if (!apiData && !apiError) {
                setState(prev => ({
                    ...prev,
                    phase: allPhases[i],
                    reasoningLog: [...prev.reasoningLog, `[PIPELINE] Stage: ${allPhases[i].toUpperCase()}`]
                }));
            }
        }

        // Wait for API to finish if it hasn't yet
        await fetchPromise;

        if (abortRef.current) return;

        // Handle API error
        if (apiError) {
            console.error(apiError);
            setState(prev => ({
                ...prev,
                phase: "idle",
                error: "Failed to connect to AXIOMAI Intelligence Backend.",
                reasoningLog: [...prev.reasoningLog, `[ERROR] ${apiError.message}`]
            }));
            return;
        }

        // Rapidly complete any remaining phases visually
        for (let i = 0; i < allPhases.length; i++) {
            if (abortRef.current) return;
            setState(prev => {
                const currentIdx = allPhases.indexOf(prev.phase);
                // Only advance if we haven't reached this phase yet
                if (currentIdx < i) {
                    return {
                        ...prev,
                        phase: allPhases[i],
                        reasoningLog: [...prev.reasoningLog, `[PIPELINE] Stage: ${allPhases[i].toUpperCase()}`]
                    };
                }
                return prev;
            });
            await sleep(300);
        }

        // Brief pause so user sees the last stage complete
        await sleep(400);

        if (abortRef.current) return;

        // Set final state with results
        setState(prev => ({
            ...prev,
            phase: "done",
            trustScore: apiData.trust_score || 0,
            answer: apiData.answer || "No logical answer generated.",
            status: apiData.status || null,
            claims: apiData.claims || [],
            citations: apiData.citations || [],
            reasoningLog: [...prev.reasoningLog, ...(apiData.reasoning_log || []), "[SYSTEM] Query resolution complete."]
        }));
    };

    return (
        <QuerySessionContext.Provider value={{ state, handleQuerySubmit }}>
            {children}
        </QuerySessionContext.Provider>
    );
};

export const useQuerySession = () => useContext(QuerySessionContext);

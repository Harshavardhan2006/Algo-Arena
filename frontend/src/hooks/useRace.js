import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { getRaceEvents, getRaceState, startRace } from '../api.js';

function socketUrl() {
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    if (wsBase) {
        return `${wsBase.replace(/\/+$/, '')}/ws/websocket`;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (apiBase) {
        try {
            const url = new URL(apiBase);
            const scheme = url.protocol === 'https:' ? 'wss' : 'ws';
            return `${scheme}://${url.host}/ws/websocket`;
        } catch {}
    }
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${window.location.host}/ws/websocket`;
}

function mergeEvents(prev, incoming) {
    if (!incoming || incoming.length === 0) return prev;
    const map = new Map();
    for (const e of prev) {
        if (e && e.eventId != null) map.set(e.eventId, e);
    }
    for (const e of incoming) {
        if (e && e.eventId != null) map.set(e.eventId, e);
    }
    return Array.from(map.values()).sort((a, b) => a.eventId - b.eventId);
}

export function useRace(raceId) {
    const [race, setRace] = useState(null);
    const [events, setEvents] = useState([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);

    const raceRef = useRef(null);
    const eventsRef = useRef([]);
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        raceRef.current = race;
    }, [race]);

    useEffect(() => {
        eventsRef.current = events;
    }, [events]);

    useEffect(() => {
        setRace(null);
        setEvents([]);
        setConnected(false);
        setError(null);
        raceRef.current = null;
        eventsRef.current = [];

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        if (!raceId) return;

        let active = true;
        let client = null;

        function refreshStateAndEvents(afterId) {
            return Promise.all([
                getRaceState(raceId),
                getRaceEvents(raceId, afterId)
            ]).then(([stateData, newEvents]) => {
                if (!active) return;
                setRace(stateData);
                raceRef.current = stateData;
                setEvents(prev => {
                    const merged = mergeEvents(prev, newEvents);
                    eventsRef.current = merged;
                    return merged;
                });
                if (stateData.status === 'completed' || stateData.status === 'cancelled') {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                }
                return stateData;
            });
        }

        function handleMessage(msg) {
            if (!active) return;
            if (msg.eventId == null) {
                const lastId = eventsRef.current.length > 0 ? eventsRef.current[eventsRef.current.length - 1].eventId : 0;
                refreshStateAndEvents(lastId).catch(() => {});
                return;
            }
            setEvents(prev => {
                const merged = mergeEvents(prev, [msg]);
                eventsRef.current = merged;
                return merged;
            });
        }

        client = new Client({
            brokerURL: socketUrl(),
            reconnectDelay: 0,
            onConnect: () => {
                if (!active) return;
                setConnected(true);
                client.subscribe(`/topic/race/${raceId}`, (message) => {
                    try {
                        const parsed = JSON.parse(message.body);
                        handleMessage(parsed);
                    } catch {}
                });

                refreshStateAndEvents(0).then((stateData) => {
                    if (!active || !stateData) return;
                    if (stateData.status === 'pending') {
                        startRace(raceId).catch(() => {});
                    }
                }).catch((e) => {
                    if (active) setError(e.message);
                });
            },
            onStompError: (frame) => {
                if (active) setError(frame.headers?.message || 'STOMP error');
            },
            onWebSocketError: () => {
                if (active) setError('could not reach the live stream');
            }
        });

        client.activate();

        pollIntervalRef.current = setInterval(() => {
            if (!active) return;
            const currentRace = raceRef.current;
            if (!currentRace || ['pending', 'running', 'paused'].includes(currentRace.status)) {
                const lastId = eventsRef.current.length > 0 ? eventsRef.current[eventsRef.current.length - 1].eventId : 0;
                refreshStateAndEvents(lastId).catch(() => {});
            }
        }, 3000);

        return () => {
            active = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            if (client) {
                client.deactivate();
            }
        };
    }, [raceId]);

    return {
        race,
        events,
        connected,
        error,
        refresh: () => {
            const lastId = eventsRef.current.length > 0 ? eventsRef.current[eventsRef.current.length - 1].eventId : 0;
            return Promise.all([getRaceState(raceId), getRaceEvents(raceId, lastId)]).then(([stateData, newEvents]) => {
                setRace(stateData);
                setEvents((prev) => mergeEvents(prev, newEvents));
                return stateData;
            });
        }
    };
}
